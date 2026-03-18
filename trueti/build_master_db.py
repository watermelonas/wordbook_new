# -*- coding: utf-8 -*-
"""
构建统一主库 vocal_master.db。

运行时只查数据库，不再依赖 word-stats.json / word-exam-sentences.json。

输入：
- trueti/word_exam.db：真题统计与真题出处（由 word_stats_from_trueti.py 生成）
- trueti/kaoyan_vocab.db：例句/近义/反义
- static/pregen_vocab.json：可选兜底
- src/utils/word-dict.json：释义补全

输出：
- static/vocal_master.db
  - vocab_master(english, chinese, data_json)
  - word_exam_stats(english, total_count, years_json, by_year_json, by_section_json, positions_json, importance, tags_json)
  - word_exam_sentences(id, english, year, section, exam_type, sentence)
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

TRUETI = Path(__file__).resolve().parent
PROJECT = TRUETI.parent
STATIC = PROJECT / "static"
OUTPUT_DB = STATIC / "vocal_master.db"

PREGEN_JSON = STATIC / "pregen_vocab.json"
KAOYAN_VOCAB_DB = TRUETI / "kaoyan_vocab.db"
WORD_EXAM_DB = TRUETI / "word_exam.db"
WORD_STATS_JSON = STATIC / "word-stats.json"  # 兼容旧链路，仅兜底
WORD_EXAM_SENTENCES_JSON = STATIC / "word-exam-sentences.json"  # 兼容旧链路，仅兜底
WORD_DICT_JSON = PROJECT / "src" / "utils" / "word-dict.json"

TAG_THRESHOLDS = {
    "阅读词汇": 5,
    "完形词汇": 3,
    "翻译词汇": 3,
    "新题型词汇": 3,
    "写作词汇": 2,
}


def load_json(path: Path, default=None):
    if default is None:
        default = {}
    if not path.exists():
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"警告: 读取 {path} 失败: {e}")
        return default


def load_pregen_from_kaoyan_db() -> dict:
    out = {}
    if not KAOYAN_VOCAB_DB.exists():
        return out
    try:
        conn = sqlite3.connect(str(KAOYAN_VOCAB_DB))
        cur = conn.execute("SELECT english, chinese, examples, synonyms, antonyms FROM words")
        for row in cur.fetchall():
            english = (row[0] or "").strip().lower()
            if not english:
                continue
            try:
                examples = json.loads(row[2]) if row[2] else []
            except Exception:
                examples = []
            try:
                synonyms = json.loads(row[3]) if row[3] else []
            except Exception:
                synonyms = []
            try:
                antonyms = json.loads(row[4]) if row[4] else []
            except Exception:
                antonyms = []
            out[english] = {
                "chinese": (row[1] or "").strip(),
                "examples": examples if isinstance(examples, list) else [],
                "synonyms": synonyms if isinstance(synonyms, list) else [],
                "antonyms": antonyms if isinstance(antonyms, list) else [],
            }
        conn.close()
        print(f"从 kaoyan_vocab.db 读取 pregen 词数: {len(out)}")
    except Exception as e:
        print(f"警告: 读取 {KAOYAN_VOCAB_DB} 失败: {e}")
    return out


def load_existing_refined_data() -> dict:
    """
    在重建 vocal_master.db 前，尽量保留旧库里的精修字段，
    避免重新 build 时把 defs / exam_tip / sentiment / has_refined 冲掉。
    """
    out = {}
    if not OUTPUT_DB.exists():
        return out
    try:
        conn = sqlite3.connect(str(OUTPUT_DB))
        cols = [row[1] for row in conn.execute("PRAGMA table_info(vocab_master)").fetchall()]
        has_refined_col = "has_refined" in cols
        if has_refined_col:
            sql = "SELECT english, chinese, data_json, has_refined FROM vocab_master"
        else:
            sql = "SELECT english, chinese, data_json, 0 AS has_refined FROM vocab_master"
        for english, chinese, data_json, has_refined in conn.execute(sql).fetchall():
            key = (english or "").strip().lower()
            if not key:
                continue
            try:
                data = json.loads(data_json or "{}")
            except Exception:
                data = {}
            defs = data.get("defs") if isinstance(data.get("defs"), list) else []
            exam_tip = data.get("exam_tip") if isinstance(data.get("exam_tip"), str) else ""
            sentiment = data.get("sentiment") if isinstance(data.get("sentiment"), str) else ""
            if defs or exam_tip or sentiment or int(has_refined or 0) == 1:
                out[key] = {
                    "chinese": (chinese or "").strip(),
                    "defs": defs,
                    "exam_tip": exam_tip,
                    "sentiment": sentiment,
                    "has_refined": int(has_refined or 0),
                }
        conn.close()
        if out:
            print(f"从旧 vocal_master.db 保留精修词数: {len(out)}")
    except Exception as e:
        print(f"警告: 读取旧 vocal_master.db 精修字段失败: {e}")
    return out


def load_exam_data():
    stats = {}
    sentences = {}
    if WORD_EXAM_DB.exists():
        try:
            conn = sqlite3.connect(str(WORD_EXAM_DB))
            cur = conn.execute(
                """
                SELECT english, total_count, years_json, by_year_json, by_section_json, positions_json
                FROM word_exam_stats
                """
            )
            for row in cur.fetchall():
                english = (row[0] or "").strip().lower()
                if not english:
                    continue
                try:
                    years = json.loads(row[2] or "[]")
                except Exception:
                    years = []
                try:
                    by_year = json.loads(row[3] or "{}")
                except Exception:
                    by_year = {}
                try:
                    by_section = json.loads(row[4] or "{}")
                except Exception:
                    by_section = {}
                try:
                    positions = json.loads(row[5] or "[]")
                except Exception:
                    positions = []
                stats[english] = {
                    "total_count": int(row[1] or 0),
                    "years": years if isinstance(years, list) else [],
                    "by_year": by_year if isinstance(by_year, dict) else {},
                    "by_section": by_section if isinstance(by_section, dict) else {},
                    "positions": positions if isinstance(positions, list) else [],
                }
            cur = conn.execute(
                """
                SELECT english, year, section, exam_type, sentence
                FROM word_exam_sentences
                ORDER BY english, year
                """
            )
            for row in cur.fetchall():
                english = (row[0] or "").strip().lower()
                if not english:
                    continue
                sentences.setdefault(english, []).append(
                    {
                        "year": row[1] or "",
                        "section": row[2] or "",
                        "exam_type": row[3] or "",
                        "sentence": row[4] or "",
                    }
                )
            conn.close()
            print(f"从 word_exam.db 读取真题统计 {len(stats)} 词，真题句子 {len(sentences)} 词")
            return stats, sentences
        except Exception as e:
            print(f"警告: 读取 {WORD_EXAM_DB} 失败: {e}")

    word_stats_data = load_json(WORD_STATS_JSON)
    word_stats = (word_stats_data.get("words") or {}) if isinstance(word_stats_data, dict) else {}
    exam_sentences = load_json(WORD_EXAM_SENTENCES_JSON)
    print("警告: 已退回旧 JSON 真题链路，请尽快重新运行 word_stats_from_trueti.py 生成 word_exam.db")
    return word_stats, exam_sentences if isinstance(exam_sentences, dict) else {}


def compute_importance(stats: dict, sorted_counts: list[int]) -> int:
    total = stats.get("total_count") or 0
    if not isinstance(total, (int, float)) or total < 0:
        return 0
    if total == 0:
        return 1
    if not sorted_counts:
        return 0
    if total <= sorted_counts[-1]:
        return 1
    rank = next((i for i, c in enumerate(sorted_counts) if c <= total), len(sorted_counts))
    p = 1 - rank / len(sorted_counts)
    if p >= 0.90:
        return 5
    if p >= 0.75:
        return 4
    if p >= 0.55:
        return 3
    if p >= 0.35:
        return 2
    return 1


def compute_tags(stats: dict, sorted_counts: list[int]) -> list[str]:
    tags = []
    by = stats.get("by_section") or {}
    total = stats.get("total_count") or 0
    if sorted_counts and total > 0:
        rank = next((i for i, c in enumerate(sorted_counts) if c <= total), len(sorted_counts))
        p = 1 - rank / len(sorted_counts)
        if p >= 0.75:
            tags.append("高频")
    if (by.get("阅读") or 0) >= TAG_THRESHOLDS["阅读词汇"]:
        tags.append("阅读词汇")
    if (by.get("完形") or 0) >= TAG_THRESHOLDS["完形词汇"]:
        tags.append("完形词汇")
    if (by.get("翻译") or 0) >= TAG_THRESHOLDS["翻译词汇"]:
        tags.append("翻译词汇")
    if (by.get("新题型") or 0) >= TAG_THRESHOLDS["新题型词汇"]:
        tags.append("新题型词汇")
    if (by.get("写作") or 0) >= TAG_THRESHOLDS["写作词汇"]:
        tags.append("写作词汇")
    return tags


def main():
    print("读取真题数据库与 pregen 源...")
    existing_refined = load_existing_refined_data()
    pregen = load_json(PREGEN_JSON)
    pregen_db = load_pregen_from_kaoyan_db()
    for key, val in pregen_db.items():
        if key not in pregen:
            pregen[key] = val
        else:
            p = pregen[key]
            if isinstance(p, dict):
                if not (p.get("examples") and isinstance(p["examples"], list)):
                    p["examples"] = val.get("examples") or []
                if not (p.get("synonyms") and isinstance(p["synonyms"], list)):
                    p["synonyms"] = val.get("synonyms") or []
                if not (p.get("antonyms") and isinstance(p["antonyms"], list)):
                    p["antonyms"] = val.get("antonyms") or []
                if not (p.get("chinese") or "").strip():
                    p["chinese"] = val.get("chinese") or p.get("chinese") or ""
    if pregen_db:
        print(f"合并后 pregen 词数: {len(pregen)}")

    word_stats, exam_sentences = load_exam_data()
    counts = [st.get("total_count") or 0 for st in word_stats.values() if (st.get("total_count") or 0) > 0]
    counts.sort(reverse=True)

    word_dict_data = load_json(WORD_DICT_JSON)
    dict_words = {}
    if isinstance(word_dict_data, dict) and isinstance(word_dict_data.get("words"), list):
        for item in word_dict_data["words"]:
            w = (item.get("word") or "").strip().lower()
            if w:
                dict_words[w] = (item.get("chinese") or "").strip()

    all_keys = set()
    if isinstance(pregen, dict):
        all_keys.update(pregen.keys())
    all_keys.update(word_stats.keys())
    if isinstance(exam_sentences, dict):
        all_keys.update(exam_sentences.keys())

    print(f"合并键数: {len(all_keys)}（释义缺失时从 word-dict 补）")

    STATIC.mkdir(parents=True, exist_ok=True)
    # 先写临时文件，成功后原子性替换，避免中途崩溃导致主库损坏
    TEMP_DB = OUTPUT_DB.with_suffix('.db.tmp')
    if TEMP_DB.exists():
        TEMP_DB.unlink()
    conn = sqlite3.connect(str(TEMP_DB))
    conn.execute(
        """
        CREATE TABLE vocab_master (
            english TEXT NOT NULL PRIMARY KEY,
            chinese TEXT,
            data_json TEXT,
            has_refined INTEGER DEFAULT 0
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE word_exam_stats (
            english TEXT NOT NULL PRIMARY KEY,
            total_count INTEGER DEFAULT 0,
            years_json TEXT DEFAULT '[]',
            by_year_json TEXT DEFAULT '{}',
            by_section_json TEXT DEFAULT '{}',
            positions_json TEXT DEFAULT '[]',
            importance INTEGER DEFAULT 0,
            tags_json TEXT DEFAULT '[]'
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE word_exam_sentences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            english TEXT NOT NULL,
            year TEXT,
            section TEXT,
            exam_type TEXT,
            sentence TEXT
        )
        """
    )
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_word ON vocab_master(english)")
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_stats_word ON word_exam_stats(english)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_exam_sentences_word ON word_exam_sentences(english)")

    count = 0
    stats_rows = []
    sentence_rows = []
    for i, key in enumerate(sorted(all_keys)):
        if not key:
            continue
        chinese = ""
        if isinstance(pregen, dict) and key in pregen:
            p = pregen[key]
            if isinstance(p, dict) and p.get("chinese"):
                chinese = (p.get("chinese") or "").strip()
        if not chinese and key in dict_words:
            chinese = dict_words[key] or ""

        data = {}
        if isinstance(pregen, dict) and key in pregen:
            p = pregen[key]
            if isinstance(p, dict):
                data["examples"] = p.get("examples") if isinstance(p.get("examples"), list) else []
                data["synonyms"] = p.get("synonyms") if isinstance(p.get("synonyms"), list) else []
                data["antonyms"] = p.get("antonyms") if isinstance(p.get("antonyms"), list) else []
        else:
            data["examples"] = []
            data["synonyms"] = []
            data["antonyms"] = []

        existing = existing_refined.get(key) or {}
        if existing.get("defs"):
            data["defs"] = existing.get("defs") or []
        if existing.get("exam_tip"):
            data["exam_tip"] = existing.get("exam_tip") or ""
        if existing.get("sentiment"):
            data["sentiment"] = existing.get("sentiment") or ""
        if existing.get("has_refined") and existing.get("chinese"):
            chinese = existing.get("chinese") or chinese

        data_json = json.dumps(data, ensure_ascii=False)
        try:
            conn.execute(
                "INSERT INTO vocab_master (english, chinese, data_json, has_refined) VALUES (?, ?, ?, ?)",
                (key, chinese, data_json, int(existing.get("has_refined") or 0)),
            )
            count += 1
        except sqlite3.IntegrityError:
            pass

        stats = word_stats.get(key)
        if isinstance(stats, dict):
            stats_rows.append(
                (
                    key,
                    int(stats.get("total_count") or 0),
                    json.dumps(stats.get("years") or [], ensure_ascii=False),
                    json.dumps(stats.get("by_year") or {}, ensure_ascii=False),
                    json.dumps(stats.get("by_section") or {}, ensure_ascii=False),
                    json.dumps(stats.get("positions") or [], ensure_ascii=False),
                    compute_importance(stats, counts),
                    json.dumps(compute_tags(stats, counts), ensure_ascii=False),
                )
            )

        for sent in exam_sentences.get(key, []) or []:
            sentence_rows.append(
                (
                    key,
                    sent.get("year") or "",
                    sent.get("section") or "",
                    sent.get("exam_type") or "",
                    sent.get("sentence") or "",
                )
            )

        if (i + 1) % 5000 == 0:
            print(f"进度: {i + 1}/{len(all_keys)}")

    if stats_rows:
        conn.executemany(
            """
            INSERT INTO word_exam_stats (english, total_count, years_json, by_year_json, by_section_json, positions_json, importance, tags_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            stats_rows,
        )
    if sentence_rows:
        conn.executemany(
            """
            INSERT INTO word_exam_sentences (english, year, section, exam_type, sentence)
            VALUES (?, ?, ?, ?, ?)
            """,
            sentence_rows,
        )

    conn.commit()
    conn.close()
    # 原子性替换：临时文件写完后 rename 到目标路径
    import shutil
    shutil.move(str(TEMP_DB), str(OUTPUT_DB))
    print(f"已写入 {OUTPUT_DB}，主词条 {count} 条，真题统计 {len(stats_rows)} 条，真题句子 {len(sentence_rows)} 条")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
