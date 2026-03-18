# -*- coding: utf-8 -*-
"""
读取 word_stats_output.json，生成每个单词的统计报告：
- 出现总次数
- 各题型及对应次数（完形/阅读/新题型/翻译/写作）
- 出现的真题年份及每年次数
输出：CSV（便于筛选排序）+ 可读 TXT 汇总
"""

import json
import csv
from pathlib import Path

TRUETI_ROOT = Path(__file__).resolve().parent
INPUT_JSON = TRUETI_ROOT / "word_stats_output.json"
OUTPUT_CSV = TRUETI_ROOT / "word_stats_report.csv"
OUTPUT_TXT = TRUETI_ROOT / "word_stats_report.txt"

# 题型列顺序（与统计脚本一致；已剔除未分类，总次数不含未分类）
SECTION_ORDER = ("完形", "阅读", "新题型", "翻译", "写作", "完整试卷")


def load_data():
    if not INPUT_JSON.exists():
        raise FileNotFoundError(f"请先运行 word_stats_from_trueti.py 生成 {INPUT_JSON}")
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def format_years(st):
    """将 years 列表格式化为紧凑字符串，如 1998,1999,...,2024 或 1998-2024。"""
    years = st.get("years") or []
    by_year = st.get("by_year") or {}
    if not years and by_year:
        years = sorted(int(y) for y in by_year.keys() if y != "unknown")
    if not years:
        return ""
    if len(years) <= 3:
        return ",".join(map(str, years))
    return f"{min(years)}-{max(years)}({len(years)}年)"


def run():
    data = load_data()
    words_data = data.get("words", {})
    if not words_data:
        print("没有单词数据。")
        return

    # 按总次数降序，便于看高频词
    sorted_words = sorted(
        words_data.items(),
        key=lambda x: -x[1]["total_count"]
    )

    # 1. 写 CSV：单词, 总次数, 完形, 阅读, 新题型, 翻译, 写作, 完整试卷, 出现年份（已剔除未分类）
    with open(OUTPUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        header = ["单词", "总次数"] + list(SECTION_ORDER) + ["出现年份"]
        writer.writerow(header)
        for word, st in sorted_words:
            by_section = st.get("by_section") or {}
            row = [
                word,
                st.get("total_count", 0),
            ] + [by_section.get(s, 0) for s in SECTION_ORDER]
            row.append(format_years(st))
            writer.writerow(row)
    print(f"已写入 CSV: {OUTPUT_CSV}")

    # 2. 写可读 TXT：每词一块，含总次数、题型次数、年份
    lines = [
        "考研真题词汇统计报告",
        "字段说明：单词 | 总次数 | 各题型次数(完形/阅读/新题型/翻译/写作/完整试卷)，未分类已剔除 | 出现年份",
        "=" * 80,
        "",
    ]
    for word, st in sorted_words:
        total = st.get("total_count", 0)
        by_section = st.get("by_section") or {}
        section_str = " ".join(f"{s}:{by_section.get(s, 0)}" for s in SECTION_ORDER if by_section.get(s, 0))
        years_str = format_years(st)
        lines.append(f"【{word}】 总次数: {total}")
        lines.append(f"  题型: {section_str or '-'}")
        lines.append(f"  年份: {years_str or '-'}")
        lines.append("")
    OUTPUT_TXT.write_text("\n".join(lines), encoding="utf-8")
    print(f"已写入 TXT: {OUTPUT_TXT}")

    print(f"共 {len(sorted_words)} 个单词，可按总次数在 CSV 中排序筛选。")


if __name__ == "__main__":
    run()
