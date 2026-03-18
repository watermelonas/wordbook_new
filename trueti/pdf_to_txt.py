# -*- coding: utf-8 -*-
"""
将 trueti 目录下的所有 PDF 转为同名的 .txt 文本文件。
转换后的 txt 与 PDF 同目录、同名，便于后续用 word_stats_from_trueti.py 做词汇统计。
"""

import sys
from pathlib import Path

TRUETI_ROOT = Path(__file__).resolve().parent


def extract_text_pymupdf(pdf_path: Path) -> str:
    """用 PyMuPDF 提取 PDF 文本（中英文均可）。"""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError("请先安装 PyMuPDF: pip install pymupdf")

    text_parts = []
    doc = fitz.open(pdf_path)
    try:
        for page in doc:
            # get_text() 对数字版 PDF 效果较好；若为扫描版可改用 get_text("dict") 或 OCR
            block = page.get_text()
            if block.strip():
                text_parts.append(block)
    finally:
        doc.close()
    return "\n\n".join(text_parts)


def main():
    print("PDF 根目录:", TRUETI_ROOT)
    if not TRUETI_ROOT.is_dir():
        print("错误: trueti 目录不存在。")
        sys.exit(1)

    pdf_files = list(TRUETI_ROOT.rglob("*.pdf"))
    if not pdf_files:
        print("未找到任何 .pdf 文件。请把真题 PDF 放入 trueti 或其子文件夹中。")
        sys.exit(0)

    print(f"共找到 {len(pdf_files)} 个 PDF 文件。")
    ok, err = 0, 0
    for pdf_path in pdf_files:
        txt_path = pdf_path.with_suffix(".txt")
        try:
            text = extract_text_pymupdf(pdf_path)
            txt_path.write_text(text, encoding="utf-8", errors="replace")
            print(f"  OK: {pdf_path.relative_to(TRUETI_ROOT)} -> {txt_path.name}")
            ok += 1
        except Exception as e:
            print(f"  失败: {pdf_path.relative_to(TRUETI_ROOT)} 错误: {e}")
            err += 1

    print(f"\n完成: 成功 {ok} 个, 失败 {err} 个。")
    print("接下来可运行: python trueti/word_stats_from_trueti.py 进行词汇统计。")


if __name__ == "__main__":
    main()
