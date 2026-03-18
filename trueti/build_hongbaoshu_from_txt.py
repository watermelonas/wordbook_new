# -*- coding: utf-8 -*-
"""
从「26红宝书导览速记打卡簿.txt」与「26红宝书连线自测本.txt」提取英文单词，二合一去重后
与真题统计对齐（真题出现次数、重要程度），生成红宝书单词库（格式与其它单词本一致）。
仅保留词库（word-dict.json）中存在的词，变形合并为词根。
"""

import json
import re
import sqlite3
from pathlib import Path

TRUETI_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = TRUETI_ROOT.parent
TXT_FILES = [
    TRUETI_ROOT / "26红宝书导览速记打卡簿.txt",
    TRUETI_ROOT / "26红宝书连线自测本.txt",
]
WORD_EXAM_DB = TRUETI_ROOT / "word_exam.db"
WORD_STATS_APP = PROJECT_ROOT / "static" / "word-stats.json"
WORD_STATS_RAW = TRUETI_ROOT / "word_stats_output.json"
WORD_DICT_JSON = PROJECT_ROOT / "src" / "utils" / "word-dict.json"
OUTPUT_DIR = TRUETI_ROOT / "wordbooks"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

WORD_PATTERN = re.compile(r"[a-zA-Z]+")


def extract_words_from_text(text: str) -> list[str]:
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
    merged = {}
    for w, info in words_with_importance.items():
        root = lemmatize_to_root(w, wnl, valid_roots, lemma_cache)
        if root is None:
            continue
        merged[root] = merged.get(root, 0) + info["total_count"]
    counts = sorted(merged.values(), reverse=True)
    n = len(counts)
    root_to_importance = {r: _compute_importance(c, counts, n) for r, c in merged.items()}
    return merged, root_to_importance


def main():
    raw_words = []
    for path in TXT_FILES:
        if not path.exists():
            print(f"警告: 未找到 {path.name}，跳过。")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        words = extract_words_from_text(text)
        raw_words.extend(words)
        print(f"  {path.name}: 提取 {len(words)} 个英文词（含重复）")

    if not raw_words:
        print("错误: 两个 TXT 均未提取到英文词，请检查文件路径与内容。")
        return

    print(f"  合计（合并前）: {len(raw_words)} 个词（含重复）")

    print("加载单词库与真题统计...")
    valid_roots = load_word_dict_set()
    words_with_importance = load_words_with_importance()
    wnl = get_lemmatizer()
    lemma_cache = {}
    root_to_count, root_to_importance = build_merged_exam_stats(
        words_with_importance, valid_roots, wnl, lemma_cache
    )

    seen_root = set()
    rows = []
    for w in raw_words:
        root = lemmatize_to_root(w, wnl, valid_roots, lemma_cache)
        if root is None or root in seen_root:
            continue
        seen_root.add(root)
        exam_count = root_to_count.get(root, 0)
        importance = root_to_importance.get(root, 0)
        if exam_count == 0:
            importance = 1
        rows.append((root, exam_count, importance))

    # 红宝书（原版）：仅两本 TXT 提取的词
    rows.sort(key=lambda x: (-x[1], -x[2]))
    for name, out_rows in [("红宝书", rows)]:
        csv_path = OUTPUT_DIR / f"{name}.csv"
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write("单词,真题出现次数,重要程度(1-5)\n")
            for w, cnt, imp in out_rows:
                f.write(f"{w},{cnt},{imp}\n")
        txt_path = OUTPUT_DIR / f"{name}.txt"
        with open(txt_path, "w", encoding="utf-8") as f:
            for w, _, _ in out_rows:
                f.write(w + "\n")
        print(f"{name}: {len(out_rows)} 词 -> {csv_path}, {txt_path}")

    # 补全：真题里至少出现过 1 次、且在词库中，但两本 TXT 里没有的词
    roots_in_hongbao = {r for r, _, _ in rows}
    rows_full = list(rows)
    added = 0
    for root, exam_count in root_to_count.items():
        if root not in valid_roots or root in roots_in_hongbao:
            continue
        if exam_count < 1:
            continue
        importance = root_to_importance.get(root, 0)
        if exam_count == 0:
            importance = 1
        rows_full.append((root, exam_count, importance))
        roots_in_hongbao.add(root)
        added += 1
    if added:
        print(f"  补全真题出现≥1 次但原红宝书未收录的词: {added} 个")

    # 红宝书补全版：原版 + 补全词
    rows_full.sort(key=lambda x: (-x[1], -x[2]))
    for name, out_rows in [("红宝书补全版", rows_full)]:
        csv_path = OUTPUT_DIR / f"{name}.csv"
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write("单词,真题出现次数,重要程度(1-5)\n")
            for w, cnt, imp in out_rows:
                f.write(f"{w},{cnt},{imp}\n")
        txt_path = OUTPUT_DIR / f"{name}.txt"
        with open(txt_path, "w", encoding="utf-8") as f:
            for w, _, _ in out_rows:
                f.write(w + "\n")
        print(f"{name}: {len(out_rows)} 词 -> {csv_path}, {txt_path}")

    print("完成。")


if __name__ == "__main__":
    main()
