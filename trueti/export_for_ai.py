# -*- coding: utf-8 -*-
"""
读取 word_stats_output.json，生成适合直接喂给 AI 的文本摘要（按词一条条描述）。
与 word_stats_report 使用同一数据源和题型顺序，保证与 CSV 报告一致。
"""

import json
from pathlib import Path

TRUETI_ROOT = Path(__file__).resolve().parent
INPUT_JSON = TRUETI_ROOT / "word_stats_output.json"
OUTPUT_TXT = TRUETI_ROOT / "word_summary_for_ai.txt"

# 与 word_stats_report.py 一致，保证与 CSV 列顺序一致
SECTION_ORDER = ("完形", "阅读", "新题型", "翻译", "写作", "完整试卷")


def main():
    if not INPUT_JSON.exists():
        print(f"请先运行 word_stats_from_trueti.py 生成 {INPUT_JSON}")
        return

    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    words = data.get("words", {})
    if not words:
        print("没有单词数据。")
        return

    lines = [
        "以下为考研真题词汇统计摘要，请根据「出现年份、总次数、题型分布、出现位置」评估每个词的重要程度（如 1–5 星或高/中/低）。",
        "题型说明：完形/阅读/新题型/翻译/写作=卷内分段统计；完整试卷=该年整份未再分段；未分类已剔除不计入总次数。",
        "",
    ]

    # 按总次数降序，便于 AI 先看高频词
    sorted_items = sorted(words.items(), key=lambda x: -x[1]["total_count"])
    for word, st in sorted_items:
        by_section = st.get("by_section", {})
        # 按 SECTION_ORDER 输出，只列有次数的题型，与 CSV 一致
        parts = [f"{k}:{by_section.get(k, 0)}次" for k in SECTION_ORDER if by_section.get(k, 0) > 0]
        section_str = "；".join(parts) if parts else "-"
        years_str = "、".join(str(y) for y in st.get("years", []))
        positions_preview = st.get("positions", [])[:5]
        pos_str = "；".join(f"{p.get('year')}年{p.get('section')}({p.get('file')})" for p in positions_preview)
        if len(st.get("positions", [])) > 5:
            pos_str += " …"

        block = [
            f"【{word}】",
            f"  总出现次数：{st['total_count']}",
            f"  出现年份：{years_str or '未知'}",
            f"  按题型：{section_str}",
            f"  部分位置：{pos_str or '-'}",
            "",
        ]
        lines.extend(block)

    OUTPUT_TXT.write_text("\n".join(lines), encoding="utf-8")
    print(f"已生成 AI 用摘要：{OUTPUT_TXT}（与 word_stats_report 同源，数据一致）")


if __name__ == "__main__":
    main()
