# -*- coding: utf-8 -*-
"""
根据真题词频生成考研英语单词本：
1. 剔除出现次数极高的「傻瓜词」（如 the, a, of 等）
2. 只保留词根：同一词根的变形（过去式、现在分词、过去分词等）合并为词根，频次累加
3. 仅保留单词库（word-dict.json）中存在的词，过滤垃圾词
4. 输出三个单词本：全单词本、核心单词本、难词单词本（难词含仅出现 1 次的词）

依赖：先运行 word_stats_from_trueti.py 和 build_word_stats_app.py。
词形还原依赖 nltk，首次运行会下载 wordnet。
"""

import json
import sqlite3
from pathlib import Path

TRUETI_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = TRUETI_ROOT.parent
WORD_EXAM_DB = TRUETI_ROOT / "word_exam.db"
WORD_STATS_APP = PROJECT_ROOT / "static" / "word-stats.json"
WORD_STATS_RAW = TRUETI_ROOT / "word_stats_output.json"
WORD_DICT_JSON = PROJECT_ROOT / "src" / "utils" / "word-dict.json"
OUTPUT_DIR = TRUETI_ROOT / "wordbooks"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 傻瓜词：1) 固定极常见功能词 2) 按真题出现次数取前 N 个
FIXED_STOP = frozenset([
    "the", "a", "an", "and", "or", "but", "if", "then", "so", "as", "of", "in", "on", "at", "to", "for", "with",
    "by", "from", "up", "out", "into", "over", "after", "before", "between", "under", "again", "further",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "shall", "can", "need", "dare", "ought", "used",
    "it", "its", "this", "that", "these", "those", "i", "you", "he", "she", "we", "they", "what", "which",
    "who", "whom", "when", "where", "why", "how", "all", "each", "every", "both", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same", "than", "too", "very", "just",
])
STOP_TOP_N = 120  # 再剔除频次最高的前 N 个（与上面取并集）

CORE_MIN_COUNT = 4  # 核心单词本：出现次数 4 次及以上（不考虑重要程度）
HARD_COUNT_MAX = 3  # 难词单词本 = 核心单词本 + 出现 1～3 次的词（不考虑重要程度）


def _ensure_nltk():
    try:
        import nltk
        nltk.download("wordnet", quiet=True)
        nltk.download("omw-1.4", quiet=True)
    except Exception:
        pass


def load_word_dict_set():
    """加载单词库，返回小写单词集合，仅词库中存在的词才可进入单词本。"""
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
    """将单词还原为词根，且词根必须在 valid_roots 中；否则返回 None。cache 为可选 dict 避免重复计算。"""
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
    """加载词表，保证每词有 total_count 和 importance。"""
    if WORD_EXAM_DB.exists():
        conn = sqlite3.connect(str(WORD_EXAM_DB))
        rows = conn.execute("SELECT english, total_count FROM word_exam_stats").fetchall()
        conn.close()
        counts = [int(r[1] or 0) for r in rows if int(r[1] or 0) > 0]
        counts.sort(reverse=True)
        n = len(counts)
        return {
            (row[0] or "").strip().lower(): {
                "total_count": int(row[1] or 0),
                "importance": _compute_importance(int(row[1] or 0), counts, n),
            }
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
        w: {
            "total_count": st.get("total_count", 0),
            "importance": st.get("importance", 3),
        }
        for w, st in words.items()
    }


def _compute_importance(total, sorted_counts, n):
    if not total or not n:
        return 0
    # 出现次数为最小值时固定为 1 星，保证有 (1, 1) 的词
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


def main():
    print("加载单词库（仅词库中的词才保留）...")
    valid_roots = load_word_dict_set()
    print(f"  词库词数: {len(valid_roots)}")

    print("加载词频与重要程度...")
    words = load_words_with_importance()

    print("词形还原并合并为词根（只保留词库中存在的词根）...")
    wnl = get_lemmatizer()
    lemma_cache = {}
    merged = {}  # root -> total_count
    skipped = 0
    for w, info in words.items():
        root = lemmatize_to_root(w, wnl, valid_roots, lemma_cache)
        if root is None:
            skipped += 1
            continue
        merged[root] = merged.get(root, 0) + info["total_count"]

    # 补入：原始统计里出现次数=1 且词根在词库中、但合并时被漏掉的词根（保证有 出现次数=1, 重要程度=1）
    for w, info in words.items():
        if (info.get("total_count") or 0) != 1:
            continue
        root = lemmatize_to_root(w, wnl, valid_roots, lemma_cache)
        if root is not None and root not in merged:
            merged[root] = 1
    print(f"  合并后词根数: {len(merged)}，跳过（不在词库或无法还原为词库中的词根）: {skipped}")

    # 按合并后的频次重新计算重要程度
    counts = sorted(merged.values(), reverse=True)
    n = len(counts)
    root_to_importance = {r: _compute_importance(c, counts, n) for r, c in merged.items()}

    # 按 total_count 降序，取前 N 个作为傻瓜词（在合并后的词根上算）
    sorted_by_count = sorted(merged.items(), key=lambda x: -x[1])
    stop_by_freq = {w for w, _ in sorted_by_count[:STOP_TOP_N]}
    stop_words = FIXED_STOP | stop_by_freq
    print(f"剔除傻瓜词: 固定 {len(FIXED_STOP)} 个 + 频次前 {STOP_TOP_N} 个，共 {len(stop_words)} 个")

    # 内部用：剔除傻瓜词后全体（不输出全单词本）
    full_list = [
        (root, cnt, root_to_importance[root])
        for root, cnt in sorted_by_count
        if root not in stop_words
    ]

    # 真题高频词：出现次数 >= 4（原核心单词本）
    core_list = [
        (root, cnt, root_to_importance[root])
        for root, cnt in sorted_by_count
        if root not in stop_words and cnt >= CORE_MIN_COUNT
    ]
    for name, rows in [("真题高频词", core_list)]:
        csv_path = OUTPUT_DIR / f"{name}.csv"
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write("单词,真题出现次数,重要程度(1-5)\n")
            for w, cnt, imp in rows:
                f.write(f"{w},{cnt},{imp}\n")
        print(f"{name}: {len(rows)} 词 -> {csv_path}")

    # 真题所有词：高频词 + 出现 1～3 次的词（原难词单词本）
    hard_list = [
        (root, cnt, imp)
        for (root, cnt, imp) in full_list
        if cnt >= CORE_MIN_COUNT or (1 <= cnt <= HARD_COUNT_MAX)
    ]
    for name, rows in [("真题所有词", hard_list)]:
        csv_path = OUTPUT_DIR / f"{name}.csv"
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write("单词,真题出现次数,重要程度(1-5)\n")
            for w, cnt, imp in rows:
                f.write(f"{w},{cnt},{imp}\n")
        print(f"{name}: {len(rows)} 词 -> {csv_path}")

    for name, rows in [
        ("真题高频词", core_list),
        ("真题所有词", hard_list),
    ]:
        txt_path = OUTPUT_DIR / f"{name}.txt"
        with open(txt_path, "w", encoding="utf-8") as f:
            for w, _, _ in rows:
                f.write(w + "\n")
        print(f"  -> {txt_path} (仅单词)")

    print("完成。")


if __name__ == "__main__":
    main()
