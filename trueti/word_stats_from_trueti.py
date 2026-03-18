# -*- coding: utf-8 -*-
"""
考研真题词汇统计脚本。

默认输出：
- trueti/word_exam.db
  - word_exam_stats：每个词的总次数、年份、按年/按题型次数、出现位置
  - word_exam_sentences：每个词在真题中的出处句子

可选调试输出：
- --export-json 时额外写出 word_stats_output.json / word_exam_sentences.json
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from collections import defaultdict
from pathlib import Path

# 当前脚本所在目录即 trueti 根目录
TRUETI_ROOT = Path(__file__).resolve().parent
OUTPUT_DB = TRUETI_ROOT / "word_exam.db"
OUTPUT_JSON = TRUETI_ROOT / "word_stats_output.json"
SENTENCES_JSON = TRUETI_ROOT / "word_exam_sentences.json"

# 支持的题型（用于从路径/文件名中识别）
SECTION_NAMES = ("阅读", "翻译", "完形", "新题型", "写作")
# 年份范围（用于从路径/文件名中解析 4 位年份）
YEAR_MIN, YEAR_MAX = 1990, 2030
# 英文单词正则：字母（可含连字符），至少 2 个字符，避免单字符噪音
WORD_PATTERN = re.compile(r"\b[A-Za-z][A-Za-z\-']*(?<=[A-Za-z])\b")

# 考研英语真题卷内题型顺序：Section I 完形 → Section II 阅读 Part A/B/C(翻译) → Section III 写作
RE_SECTION_I = re.compile(r"Section\s*I\s+Use\s+of\s+English", re.I)
RE_SECTION_II = re.compile(r"Section\s*(?:II|\u2161)\s*Reading", re.I)  # II 或 Ⅱ(U+2161)
RE_PART_B = re.compile(r"Part\s*B\s*(?:\s+Directions)?", re.I)
RE_PART_C = re.compile(r"Part\s*C\s*(?:\s+Directions)?\s*[:\s]*\n.*?translate\s+the\s+underlined", re.I | re.DOTALL)
RE_SECTION_III = re.compile(r"Section\s*III\s+Writing", re.I)


def split_exam_into_sections(text: str) -> list[tuple[str, str]] | None:
    """若文本为完整考研英语试卷，则按卷内题型切分。"""
    m1 = RE_SECTION_I.search(text)
    m2 = RE_SECTION_II.search(text)
    m3 = RE_SECTION_III.search(text)
    if not (m1 and m2):
        return None
    start_wanxing = m1.end()
    end_wanxing = m2.start()
    wanxing = text[start_wanxing:end_wanxing].strip()
    if not wanxing or len(wanxing) < 200:
        wanxing = ""
    block_reading = text[m2.end() : m3.start() if m3 else len(text)]
    part_b = RE_PART_B.search(block_reading)
    part_c = RE_PART_C.search(block_reading)
    if part_b and part_c and part_b.start() < part_c.start():
        reading = block_reading[: part_b.start()].strip()
        xinxing = block_reading[part_b.end() : part_c.start()].strip()
        fanyi = block_reading[part_c.end() :].strip() if m3 else block_reading[part_c.start() :].strip()
    elif part_c:
        reading = block_reading[: part_c.start()].strip()
        xinxing = ""
        fanyi = block_reading[part_c.start() :].strip()
    else:
        reading = block_reading.strip()
        xinxing = ""
        fanyi = ""
    xiezuo = text[m3.end() :].strip() if m3 else ""
    out = []
    if wanxing:
        out.append(("完形", wanxing))
    if reading:
        out.append(("阅读", reading))
    if xinxing:
        out.append(("新题型", xinxing))
    if fanyi:
        out.append(("翻译", fanyi))
    if xiezuo:
        out.append(("写作", xiezuo))
    return out if out else None


def extract_year_from_path(path: Path) -> int | None:
    text = path.as_posix() + " " + path.name
    for m in re.finditer(r"(19\d{2}|20\d{2})", text):
        y = int(m.group(1))
        if YEAR_MIN <= y <= YEAR_MAX:
            return y
    return None


def extract_section_from_path(path: Path) -> str | None:
    text = (path.parent.as_posix() + " " + path.name).replace("\\", "/")
    for name in SECTION_NAMES:
        if name in text:
            return name
    return None


def get_exam_type_from_path(path: Path) -> str:
    text = (path.parent.as_posix() + " " + path.name).replace("\\", "/").lower()
    if "英语二" in text or "英二" in text or "english ii" in text or "英语2" in text or "英语 2" in text:
        return "英二"
    return "英一"


def split_into_sentences(text: str) -> list[str]:
    if not text or not text.strip():
        return []
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [s.strip() for s in parts if s and len(s.strip()) > 5]


def extract_words(text: str) -> list[str]:
    words = []
    for m in WORD_PATTERN.finditer(text):
        w = m.group(0).lower()
        if len(w) >= 2:
            words.append(w)
    return words


def collect_file_items(root: Path) -> list[tuple[Path, int | None, str | None, str]]:
    items = []
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in (".txt", ".md"):
            continue
        skip_names = (
            "README",
            "readme",
            "requirements",
            "STRUCTURE",
            ".git",
            "word_summary_for_ai",
            "word_stats_output",
            "word_exam_sentences",
            "word_exam.db",
        )
        if any(s in p.name for s in skip_names):
            continue
        if p.name.startswith("."):
            continue
        items.append((p, extract_year_from_path(p), extract_section_from_path(p), get_exam_type_from_path(p)))
    return items


def _sentence_contains_word(sentence: str, word_lower: str) -> bool:
    if not sentence or not word_lower:
        return False
    return re.search(r"\b" + re.escape(word_lower) + r"\b", sentence, re.I) is not None


def build_word_stats(root: Path) -> tuple[dict, dict]:
    """统计所有文件，并返回 (stats_result, sentences_result)。"""
    stats = defaultdict(
        lambda: {
            "total_count": 0,
            "years": [],
            "by_year": defaultdict(int),
            "by_section": defaultdict(int),
            "positions": [],
        }
    )
    word_sentences = defaultdict(list)
    sentence_key_count = defaultdict(int)
    max_sentences_per_key = 5

    file_items = collect_file_items(root)
    if not file_items:
        print(f"未在 {root} 下找到 .txt / .md 文件，请按 README_STRUCTURE.md 放置真题。")
        return {}, {}

    for path, year, section, exam_type in file_items:
        try:
            raw = path.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            print(f"跳过无法读取的文件: {path}, 错误: {e}")
            continue
        year_str = str(year) if year is not None else "unknown"

        chunks = split_exam_into_sections(raw)
        if chunks:
            iterable = chunks
        else:
            if section:
                section_str = section
            elif year is not None and "真题" in path.name:
                section_str = "完整试卷"
            else:
                section_str = "未分类"
            iterable = [(section_str, raw)]

        for section_str, chunk_text in iterable:
            words = extract_words(chunk_text)
            file_count = defaultdict(int)
            for w in words:
                file_count[w] += 1
            for w, cnt in file_count.items():
                st = stats[w]
                st["total_count"] += cnt
                st["by_section"][section_str] += cnt
                if year is not None:
                    st["by_year"][year_str] += cnt
                st["positions"].append(
                    {
                        "year": year_str,
                        "section": section_str,
                        "exam_type": exam_type,
                        "file": path.name,
                        "path": path.relative_to(root).as_posix(),
                        "count": cnt,
                    }
                )
            if section_str == "未分类":
                continue
            sentences = split_into_sentences(chunk_text)
            for w in file_count:
                key = (w, year_str, section_str, exam_type)
                if sentence_key_count[key] >= max_sentences_per_key:
                    continue
                for sent in sentences:
                    if not _sentence_contains_word(sent, w):
                        continue
                    if sentence_key_count[key] >= max_sentences_per_key:
                        break
                    word_sentences[w].append(
                        {
                            "year": year_str,
                            "section": section_str,
                            "exam_type": exam_type,
                            "sentence": sent.strip(),
                        }
                    )
                    sentence_key_count[key] += 1

    result = {}
    for w, st in stats.items():
        st["years"] = sorted(set(int(yr) for yr in st["by_year"].keys() if yr != "unknown"))
        if "unknown" in st["by_year"]:
            st["by_year"].pop("unknown")
        by_sec = dict(st["by_section"])
        unc_count = by_sec.pop("未分类", 0)
        total = max(0, st["total_count"] - unc_count)
        positions_clean = [p for p in st["positions"] if p.get("section") != "未分类"]
        result[w] = {
            "total_count": total,
            "years": st["years"],
            "by_year": dict(st["by_year"]),
            "by_section": by_sec,
            "positions": positions_clean,
        }

    out_sentences = {w: word_sentences[w] for w in word_sentences if word_sentences[w]}
    return result, out_sentences


def write_exam_db(stats: dict, sentences: dict) -> None:
    OUTPUT_DB.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT_DB.exists():
        OUTPUT_DB.unlink()
    conn = sqlite3.connect(str(OUTPUT_DB))
    conn.execute(
        """
        CREATE TABLE word_exam_stats (
            english TEXT NOT NULL PRIMARY KEY,
            total_count INTEGER DEFAULT 0,
            years_json TEXT DEFAULT '[]',
            by_year_json TEXT DEFAULT '{}',
            by_section_json TEXT DEFAULT '{}',
            positions_json TEXT DEFAULT '[]'
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
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_stats_word ON word_exam_stats(english)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_exam_sentence_word ON word_exam_sentences(english)")

    stats_rows = []
    for word, st in stats.items():
        stats_rows.append(
            (
                word,
                int(st.get("total_count") or 0),
                json.dumps(st.get("years") or [], ensure_ascii=False),
                json.dumps(st.get("by_year") or {}, ensure_ascii=False),
                json.dumps(st.get("by_section") or {}, ensure_ascii=False),
                json.dumps(st.get("positions") or [], ensure_ascii=False),
            )
        )
    conn.executemany(
        """
        INSERT INTO word_exam_stats (english, total_count, years_json, by_year_json, by_section_json, positions_json)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        stats_rows,
    )

    sentence_rows = []
    for word, items in sentences.items():
        for item in items:
            sentence_rows.append(
                (
                    word,
                    item.get("year") or "",
                    item.get("section") or "",
                    item.get("exam_type") or "",
                    item.get("sentence") or "",
                )
            )
        if len(sentence_rows) >= 5000:
            conn.executemany(
                """
                INSERT INTO word_exam_sentences (english, year, section, exam_type, sentence)
                VALUES (?, ?, ?, ?, ?)
                """,
                sentence_rows,
            )
            sentence_rows = []
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
    print(f"已写入真题数据库: {OUTPUT_DB}，统计词数 {len(stats)}，句子词数 {len(sentences)}")


def export_debug_json(stats: dict, sentences: dict) -> None:
    sorted_words = sorted(stats.items(), key=lambda x: -x[1]["total_count"])
    output = {
        "meta": {
            "source": "trueti",
            "total_unique_words": len(stats),
            "description": "每个词的统计：总次数、出现年份、按题型次数、出现位置，供调试查看。",
        },
        "words": dict(sorted_words),
    }
    OUTPUT_JSON.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    SENTENCES_JSON.write_text(json.dumps(sentences, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已导出调试 JSON: {OUTPUT_JSON}")
    print(f"已导出调试句子 JSON: {SENTENCES_JSON}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--export-json", action="store_true", help="额外导出调试 JSON（默认仅写 SQLite）")
    args = parser.parse_args()

    print("真题根目录:", TRUETI_ROOT)
    if not TRUETI_ROOT.is_dir():
        print("错误: trueti 目录不存在。")
        return 1

    data, sentences = build_word_stats(TRUETI_ROOT)
    if not data:
        return 1

    write_exam_db(data, sentences)
    if args.export_json:
        export_debug_json(data, sentences)

    sorted_words = sorted(data.items(), key=lambda x: -x[1]["total_count"])
    print("示例（总频次前 5）:")
    for w, st in sorted_words[:5]:
        print(f"  {w}: 总次数={st['total_count']}, 年份数={len(st['years'])}, 按题型={st['by_section']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
