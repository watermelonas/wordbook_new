# -*- coding: utf-8 -*-
"""
将 pregen_vocab.json 导入为 SQLite 数据库 static/pregen_data.db，避免 App 端解析大 JSON。
表结构与前端 src/utils/pregenVocab.js 保持一致：
vocab(english TEXT UNIQUE, chinese TEXT, examples TEXT, synonyms TEXT, antonyms TEXT)
用法: python trueti/import_pregen_json_to_db.py
"""
from pathlib import Path
import json
import sqlite3

TRUETI = Path(__file__).resolve().parent
PROJECT_ROOT = TRUETI.parent
INPUT_JSON = PROJECT_ROOT / "static" / "pregen_vocab.json"
OUTPUT_DB = PROJECT_ROOT / "static" / "pregen_data.db"


def main():
    if not INPUT_JSON.exists():
        print(f"错误: 未找到 {INPUT_JSON}，请先有 pregen_vocab.json（可由 sync_pregen_to_app 或 batch_ai_vocab 导出）")
        return 1
    print(f"读取 JSON: {INPUT_JSON}")
    try:
        with open(INPUT_JSON, "r", encoding="utf-8") as f:
            vocab = json.load(f)
    except Exception as e:
        print(f"JSON 解析失败: {e}")
        return 1
    if not isinstance(vocab, dict):
        print("错误: JSON 根节点应为对象 { word_lower: { chinese, examples, synonyms, antonyms }, ... }")
        return 1

    OUTPUT_DB.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT_DB.exists():
        OUTPUT_DB.unlink()
    conn = sqlite3.connect(str(OUTPUT_DB))
    conn.execute("""
        CREATE TABLE vocab (
            english TEXT NOT NULL PRIMARY KEY,
            chinese TEXT,
            examples TEXT,
            synonyms TEXT,
            antonyms TEXT
        )
    """)
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_english ON vocab(english)")
    count = 0
    for key, val in vocab.items():
        if not key or not isinstance(val, dict):
            continue
        english = key.strip().lower()
        if not english:
            continue
        chinese = (val.get("chinese") or "").strip() or ""
        examples = val.get("examples")
        synonyms = val.get("synonyms")
        antonyms = val.get("antonyms")
        examples_json = json.dumps(examples, ensure_ascii=False) if examples is not None else "[]"
        synonyms_json = json.dumps(synonyms, ensure_ascii=False) if synonyms is not None else "[]"
        antonyms_json = json.dumps(antonyms, ensure_ascii=False) if antonyms is not None else "[]"
        try:
            conn.execute(
                "INSERT INTO vocab (english, chinese, examples, synonyms, antonyms) VALUES (?,?,?,?,?)",
                (english, chinese, examples_json, synonyms_json, antonyms_json),
            )
            count += 1
        except sqlite3.IntegrityError:
            pass
    conn.commit()
    conn.close()
    print(f"已导入 {count} 条到 {OUTPUT_DB}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
