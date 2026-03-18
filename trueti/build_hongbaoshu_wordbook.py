# -*- coding: utf-8 -*-
"""
从 2026红宝书.pdf 第 432～442 页（必考词+基础词汇总）提取单词，
与真题统计对齐：在 static/word-stats.json 中查找每个词的真题出现次数和重要程度，
输出与其它单词本相同格式：单词, 真题出现次数, 重要程度(1-5)。
仅保留词库（word-dict.json）中存在的词，变形合并为词根。
"""

import json
import re
import sqlite3
from pathlib import Path

TRUETI_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = TRUETI_ROOT.parent
HONGBAOSHU_PDF = TRUETI_ROOT / "2026红宝书.pdf"
WORD_EXAM_DB = TRUETI_ROOT / "word_exam.db"
WORD_STATS_APP = PROJECT_ROOT / "static" / "word-stats.json"
WORD_STATS_RAW = TRUETI_ROOT / "word_stats_output.json"
WORD_DICT_JSON = PROJECT_ROOT / "src" / "utils" / "word-dict.json"
OUTPUT_DIR = TRUETI_ROOT / "wordbooks"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# PDF 页码（1-based）。你指定 432～442；若该范围无可选文字（多为扫描图），脚本会回退到 424～434
PAGE_START = 432
PAGE_END = 442
# 回退范围（当 432～442 提取字数过少时使用）
FALLBACK_START = 424
FALLBACK_END = 434
MIN_CHARS_FOR_PAGE_RANGE = 500  # 若提取字符数少于此则用回退范围

# 提取英文单词：至少 2 个字母
WORD_PATTERN = re.compile(r"[a-zA-Z]+")


def extract_text_from_pdf_pages(pdf_path: Path, page_start: int, page_end: int):
    """从 PDF 的 page_start～page_end 页（1-based，含首尾）提取文本。返回 (text, total_pages)。"""
    try:
        import fitz
    except ImportError:
        raise ImportError("请先安装 PyMuPDF: pip install pymupdf")
    doc = fitz.open(pdf_path)
    try:
        total_pages = len(doc)
        # 1-based 432～442 → 0-based 索引 431～441
        i_start = max(0, page_start - 1)
        i_end = min(page_end, total_pages)
        parts = []
        for i in range(i_start, i_end):
            page = doc[i]
            parts.append(page.get_text())
        return "\n".join(parts), total_pages
    finally:
        doc.close()


def extract_words_from_text(text: str) -> list[str]:
    """从文本中提取英文单词（小写），保留顺序、可重复。"""
    words = []
    for m in WORD_PATTERN.finditer(text):
        w = m.group(0).lower()
        if len(w) >= 2:
            words.append(w)
    return words


def _ensure_nltk():
    try:
        import nltk
        nltk.download("wordnet", quiet=True)
        nltk.download("omw-1.4", quiet=True)
    except Exception:
        pass


def load_word_dict_set():
    if not WORD_DICT_JSON.exists():
        raise FileNotFoundError(f"未找到单词库: {WORD_DICT_JSON}")
    data = json.loads(WORD_DICT_JSON.read_text(encoding="utf-8"))
    words_list = data.get("words") or []
    return frozenset((item.get("word") or "").strip().lower() for item in words_list if item.get("word"))


def get_lemmatizer():
    _ensure_nltk()
    from nltk.stem import WordNetLemmatizer
    return WordNetLemmatizer()


def lemmatize_to_root(word, wnl, valid_roots, cache=None):
    w = (word or "").strip().lower()
    if not w:
        return None
    if cache is not None and w in cache:
        return cache[w]
    if w in valid_roots:
        if cache is not None:
            cache[w] = w
        return w
    out = None
    for pos in ("v", "n", "a", "r"):
        try:
            root = wnl.lemmatize(w, pos=pos)
            if root in valid_roots:
                out = root
                break
        except Exception:
            continue
    if cache is not None:
        cache[w] = out
    return out


def load_words_with_importance():
    if WORD_EXAM_DB.exists():
        conn = sqlite3.connect(str(WORD_EXAM_DB))
        rows = conn.execute("SELECT english, total_count FROM word_exam_stats").fetchall()
        conn.close()
        counts = [int(r[1] or 0) for r in rows if int(r[1] or 0) > 0]
        counts.sort(reverse=True)
        n = len(counts)
        return {
            (row[0] or "").strip().lower(): {"total_count": int(row[1] or 0), "importance": _compute_importance(int(row[1] or 0), counts, n)}
            for row in rows
            if (row[0] or "").strip()
        }
    data = None
    if WORD_STATS_APP.exists():
        data = json.loads(WORD_STATS_APP.read_text(encoding="utf-8"))
    if not data or not data.get("words"):
        if not WORD_STATS_RAW.exists():
            raise FileNotFoundError("请先运行 word_stats_from_trueti.py 和 build_word_stats_app.py")
        data = json.loads(WORD_STATS_RAW.read_text(encoding="utf-8"))
        words = data.get("words") or {}
        counts = [w.get("total_count") or 0 for w in words.values() if (w.get("total_count") or 0) > 0]
        counts.sort(reverse=True)
        n = len(counts)
        out = {}
        for w, st in words.items():
            total = st.get("total_count") or 0
            imp = _compute_importance(total, counts, n)
            out[w] = {"total_count": total, "importance": imp}
        return out
    words = data["words"]
    return {
        w: {"total_count": st.get("total_count", 0), "importance": st.get("importance", 0)}
        for w, st in words.items()
    }


def _compute_importance(total, sorted_counts, n):
    if not total or not n:
        return 0
    if sorted_counts and total <= sorted_counts[-1]:
        return 1
    rank = next((i for i, c in enumerate(sorted_counts) if c <= total), n)
    p = 1 - rank / n
    if p >= 0.90:
        return 5
    if p >= 0.75:
        return 4
    if p >= 0.55:
        return 3
    if p >= 0.35:
        return 2
    return 1


def build_merged_exam_stats(words_with_importance, valid_roots, wnl, lemma_cache):
    """与 build_wordbooks 一致：按词根合并真题统计，得到 root -> (total_count, importance)。"""
    merged = {}
    for w, info in words_with_importance.items():
        root = lemmatize_to_root(w, wnl, valid_roots, lemma_cache)
        if root is None:
            continue
        merged[root] = merged.get(root, 0) + info["total_count"]
    counts = sorted(merged.values(), reverse=True)
    n = len(counts)
    root_to_importance = {r: _compute_importance(c, counts, n) for r, c in merged.items()}
    root_to_count = merged
    return root_to_count, root_to_importance


def main():
    if not HONGBAOSHU_PDF.exists():
        print(f"错误: 未找到 {HONGBAOSHU_PDF.name}，请将 2026红宝书.pdf 放在 trueti 目录下。")
        return

    print("从红宝书 PDF 提取必考词+基础词页...")
    text, total_pages = extract_text_from_pdf_pages(HONGBAOSHU_PDF, PAGE_START, PAGE_END)
    print(f"  PDF 总页数: {total_pages}，本段({PAGE_START}～{PAGE_END}页)提取字符数: {len(text)}")
    if len(text) < MIN_CHARS_FOR_PAGE_RANGE and total_pages >= FALLBACK_END:
        print(f"  该范围文字过少，改用 {FALLBACK_START}～{FALLBACK_END} 页重试。")
        text, _ = extract_text_from_pdf_pages(HONGBAOSHU_PDF, FALLBACK_START, FALLBACK_END)
        print(f"  回退段提取字符数: {len(text)}")
    raw_words = extract_words_from_text(text)
    print(f"  提取到 {len(raw_words)} 个英文词（含重复）")

    print("加载单词库与真题统计...")
    valid_roots = load_word_dict_set()
    words_with_importance = load_words_with_importance()
    wnl = get_lemmatizer()
    lemma_cache = {}
    root_to_count, root_to_importance = build_merged_exam_stats(
        words_with_importance, valid_roots, wnl, lemma_cache
    )

    # 红宝书中的词去重为词根，且仅保留词库中存在的词根；查真题次数与重要程度
    seen_root = set()
    rows = []  # (root, exam_count, importance)
    for w in raw_words:
        root = lemmatize_to_root(w, wnl, valid_roots, lemma_cache)
        if root is None or root in seen_root:
            continue
        seen_root.add(root)
        exam_count = root_to_count.get(root, 0)
        importance = root_to_importance.get(root, 0)
        rows.append((root, exam_count, importance))

    # 按真题出现次数降序，其次按原顺序
    rows.sort(key=lambda x: (-x[1], -x[2]))

    csv_path = OUTPUT_DIR / "红宝书.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("单词,真题出现次数,重要程度(1-5)\n")
        for w, cnt, imp in rows:
            f.write(f"{w},{cnt},{imp}\n")
    print(f"红宝书单词本: {len(rows)} 词 -> {csv_path}")

    txt_path = OUTPUT_DIR / "红宝书.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        for w, _, _ in rows:
            f.write(w + "\n")
    print(f"  -> {txt_path} (仅单词)")

    print("完成。")


if __name__ == "__main__":
    main()
