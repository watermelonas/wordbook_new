# -*- coding: utf-8 -*-
"""
手动将本地 AI 预生成词库（kaoyan_vocab.db）导出并同步到 App 使用的 pregen_vocab.json。
可选：将 pregen_vocab.json 导入为 static/pregen_data.db（vocab 表），供 App 按需查询。

用法:
  python trueti/sync_pregen_to_app.py
  python trueti/sync_pregen_to_app.py --db trueti/kaoyan_vocab.db --json static/pregen_vocab.json
  python trueti/sync_pregen_to_app.py --build-db   # 从 JSON 生成 pregen_data.db 并打印进度
"""
from pathlib import Path
import argparse
import json
import shutil
import sqlite3
import sys

TRUETI = Path(__file__).resolve().parent
PROJECT_ROOT = TRUETI.parent
DEFAULT_DB = TRUETI / "kaoyan_vocab.db"
DEFAULT_JSON = PROJECT_ROOT / "static" / "pregen_vocab.json"
PREGEN_DB_PATH = PROJECT_ROOT / "static" / "pregen_data.db"


def export_db_to_json(conn: sqlite3.Connection, out_path: Path) -> int:
    """将 words 表导出为 { "word_lower": { chinese, examples, synonyms, antonyms } }，返回导出条数。"""
    cur = conn.execute(
        "SELECT english, chinese, examples, synonyms, antonyms FROM words"
    )
    rows = cur.fetchall()
    vocab = {}
    for (english, chinese, examples_json, synonyms_json, antonyms_json) in rows:
        if not english:
            continue
        key = english.strip().lower()
        try:
            examples = json.loads(examples_json) if examples_json else []
        except Exception:
            examples = []
        try:
            synonyms = json.loads(synonyms_json) if synonyms_json else []
        except Exception:
            synonyms = []
        try:
            antonyms = json.loads(antonyms_json) if antonyms_json else []
        except Exception:
            antonyms = []
        vocab[key] = {
            "chinese": (chinese or "").strip(),
            "examples": examples,
            "synonyms": synonyms,
            "antonyms": antonyms,
        }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(vocab, ensure_ascii=False), encoding="utf-8")
    return len(vocab)


def build_pregen_db_from_json(json_path: Path, db_path: Path) -> int:
    """
    读取 pregen_vocab.json，在 static 下创建 pregen_data.db，表 vocab：
    english (UNIQUE INDEX), chinese, examples, synonyms, antonyms（均为 JSON 字符串）。
    导入全部数据并打印进度，返回导入条数。
    """
    if not json_path.exists():
        print(f"错误: 未找到 {json_path}")
        return 0
    print(f"读取 JSON: {json_path}")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            vocab = json.load(f)
    except Exception as e:
        print(f"JSON 解析失败: {e}")
        return 0
    if not isinstance(vocab, dict):
        print("错误: JSON 根节点应为对象 { word_lower: { chinese, examples, synonyms, antonyms }, ... }")
        return 0

    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(str(db_path))
    conn.execute("""
        CREATE TABLE vocab (
            english TEXT NOT NULL PRIMARY KEY,
            chinese TEXT,
            examples TEXT,
            synonyms TEXT,
            antonyms TEXT
        )
    """)
    # 必须建索引，否则 1 万条数据下按 english 查询会全表扫描
    conn.execute("CREATE UNIQUE INDEX idx_vocab_english ON vocab(english)")
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_english ON vocab(english)")
    total = len(vocab)
    count = 0
    for i, (key, val) in enumerate(vocab.items()):
        if not key or not isinstance(val, dict):
            continue
        english = key.strip().lower()
        if not english:
            continue
        chinese = (val.get("chinese") or "").strip() or ""
        examples = val.get("examples")
        synonyms = val.get("synonyms")
        antonyms = val.get("antonyms")
        examples_str = json.dumps(examples, ensure_ascii=False) if examples is not None else "[]"
        synonyms_str = json.dumps(synonyms, ensure_ascii=False) if synonyms is not None else "[]"
        antonyms_str = json.dumps(antonyms, ensure_ascii=False) if antonyms is not None else "[]"
        try:
            conn.execute(
                "INSERT INTO vocab (english, chinese, examples, synonyms, antonyms) VALUES (?,?,?,?,?)",
                (english, chinese, examples_str, synonyms_str, antonyms_str),
            )
            count += 1
        except sqlite3.IntegrityError:
            pass
        if (i + 1) % 500 == 0 or (i + 1) == total:
            print(f"进度: {i + 1}/{total} ({count} 条已写入)")
            sys.stdout.flush()
    conn.commit()
    conn.close()
    print(f"已导入 {count} 条到 {db_path}")
    return count


def main():
    parser = argparse.ArgumentParser(
        description="将 kaoyan_vocab.db 导出为 pregen_vocab.json；或从 JSON 生成 pregen_data.db"
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="SQLite 数据库路径（导出 JSON 时用）")
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON, help="导出/读取的 JSON 路径")
    parser.add_argument("--no-copy", action="store_true", help="仅导出到 static，不复制到 unpackage")
    parser.add_argument("--build-db", action="store_true", help="从 pregen_vocab.json 生成 pregen_data.db（vocab 表）并打印进度")
    args = parser.parse_args()

    if args.build_db:
        json_path = args.json if args.json.is_absolute() else (PROJECT_ROOT / args.json).resolve()
        db_path = PREGEN_DB_PATH
        n = build_pregen_db_from_json(json_path, db_path)
        return 0 if n > 0 else 1

    db_path = args.db if args.db.is_absolute() else (PROJECT_ROOT / args.db).resolve()
    json_out = args.json if args.json.is_absolute() else (PROJECT_ROOT / args.json).resolve()

    if not db_path.exists():
        print(f"数据库不存在: {db_path}")
        print("请先运行 batch_ai_vocab.py 生成数据，或指定已有 DB：--db 路径")
        return 1

    print(f"读取: {db_path}")
    conn = sqlite3.connect(str(db_path))
    n = export_db_to_json(conn, json_out)
    conn.close()
    print(f"已导出 {n} 条到 {json_out}")

    if not args.no_copy:
        for subdir in ["unpackage/dist/dev/app-plus", "unpackage/dist/build/app-plus"]:
            dest_dir = PROJECT_ROOT / subdir / "static"
            if dest_dir.exists():
                dest = dest_dir / "pregen_vocab.json"
                try:
                    shutil.copy2(json_out, dest)
                    print(f"已同步到: {dest}")
                except Exception as e:
                    print(f"同步到 {dest} 失败: {e}")

    print("完成。重新运行或刷新 App 即可查看当前 AI 生成效果。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
