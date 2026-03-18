# -*- coding: utf-8 -*-
"""
调试导出工具。

说明：
- App 运行时已不再依赖 word-stats.json / word-exam-sentences.json。
- 本脚本仅在需要人工查看或兼容旧工具时，将 trueti/word_exam.db 导出为 JSON。
"""

import json
import sqlite3
from pathlib import Path

TRUETI_ROOT = Path(__file__).resolve().parent
INPUT_DB = TRUETI_ROOT / "word_exam.db"
OUTPUT_JSON = TRUETI_ROOT.parent / "static" / "word-stats.json"
SENTENCES_DEST = TRUETI_ROOT.parent / "static" / "word-exam-sentences.json"

# 与 wordStats.js 一致
TAG_THRESHOLDS = {
    "阅读词汇": 5,
    "完形词汇": 3,
    "翻译词汇": 3,
    "新题型词汇": 3,
    "写作词汇": 2,
}


def compute_importance(stats: dict, sorted_counts: list) -> int:
    """重要程度 0–5，与 wordStats.js 一致；出现次数为最小值时固定 1 星，保证有 (1, 1)。"""
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


def compute_tags(stats: dict, sorted_counts: list) -> list:
    """与 wordStats.js getSuggestedTagsFromStats 一致."""
    tags = []
    by = stats.get("by_section") or {}
    total = stats.get("total_count") or 0
    # 高频：总次数在全体前 25%
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
    if not INPUT_DB.exists():
        print(f"错误: 未找到 {INPUT_DB}，请先运行 word_stats_from_trueti.py")
        return
    conn = sqlite3.connect(str(INPUT_DB))
    counts = [int(r[0] or 0) for r in conn.execute("SELECT total_count FROM word_exam_stats WHERE total_count > 0").fetchall()]
    counts.sort(reverse=True)
    out_words = {}
    for row in conn.execute(
        """
        SELECT english, total_count, years_json, by_section_json
        FROM word_exam_stats
        """
    ).fetchall():
        english = (row[0] or "").strip().lower()
        if not english:
            continue
        try:
            years = json.loads(row[2] or "[]")
        except Exception:
            years = []
        try:
            by_section = json.loads(row[3] or "{}")
        except Exception:
            by_section = {}
        st = {
            "total_count": int(row[1] or 0),
            "years": years if isinstance(years, list) else [],
            "by_section": by_section if isinstance(by_section, dict) else {},
        }
        entry = {
            "total_count": st.get("total_count", 0),
            "by_section": st.get("by_section") or {},
            "years": st.get("years") or [],
            "importance": compute_importance(st, counts),
            "tags": compute_tags(st, counts),
        }
        out_words[w] = entry

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    out = {
        "meta": {
            "source": "trueti",
            "total_unique_words": len(out_words),
            "description": "预计算：真题统计 + 重要程度 + 标签，App 直接使用无需再算。",
        },
        "words": out_words,
    }
    OUTPUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已写入 {OUTPUT_JSON}，共 {len(out_words)} 词（含 importance、tags）")

    sentence_map = {}
    for row in conn.execute(
        """
        SELECT english, year, section, exam_type, sentence
        FROM word_exam_sentences
        ORDER BY english, year
        """
    ).fetchall():
        english = (row[0] or "").strip().lower()
        if not english:
            continue
        sentence_map.setdefault(english, []).append(
            {
                "year": row[1] or "",
                "section": row[2] or "",
                "exam_type": row[3] or "",
                "sentence": row[4] or "",
            }
        )
    SENTENCES_DEST.write_text(json.dumps(sentence_map, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已导出真题出处句子到 {SENTENCES_DEST}")
    conn.close()


if __name__ == "__main__":
    main()
