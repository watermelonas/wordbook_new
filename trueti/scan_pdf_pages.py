# -*- coding: utf-8 -*-
"""扫描 PDF 每页的字符数，用于定位「必考词+基础词」所在页。"""
from pathlib import Path
import fitz

TRUETI = Path(__file__).resolve().parent
PDF = TRUETI / "2026红宝书.pdf"

def main():
    doc = fitz.open(PDF)
    print(f"总页数: {len(doc)}")
    print("页码(1-based)  本页字符数")
    print("-" * 30)
    for i in range(len(doc)):
        t = doc[i].get_text()
        n = len(t)
        if n > 50:  # 只打印有内容的页
            print(f"  {i+1:4d}         {n:6d}")
    doc.close()

if __name__ == "__main__":
    main()
