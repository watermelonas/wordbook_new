# -*- coding: utf-8 -*-
"""
检查 kaoyan_vocab.db 中已写入单词的数据完整性与正确性。
- 与词表对比：是否有遗漏、重复
- 字段与 JSON 校验：examples/synonyms/antonyms 是否合法、结构是否完整
"""
from pathlib import Path
import json
import re
import sqlite3

TRUETI = Path(__file__).resolve().parent
DB = TRUETI / "kaoyan_vocab.db"
WORDLIST_TXT = TRUETI / "wordbooks" / "红宝书补全版.txt"


def load_expected_words(txt_path: Path) -> list[str]:
    """与 batch_ai_vocab 一致的词表加载逻辑。"""
    if not txt_path.exists():
        return []
    lines = txt_path.read_text(encoding="utf-8", errors="ignore").strip().splitlines()
    words = []
    seen = set()
    for line in lines:
        w = line.strip()
        if not w or not re.match(r"^[a-zA-Z\-']+$", w):
            continue
        w_lower = w.lower()
        if w_lower in seen:
            continue
        seen.add(w_lower)
        words.append(w)
    return words


def check_json_list(value: str, min_items: int = 1) -> tuple[bool, str]:
    """校验为合法 JSON 数组且长度>=min_items。"""
    if not value or not value.strip():
        return False, "为空"
    try:
        data = json.loads(value)
    except json.JSONDecodeError as e:
        return False, f"JSON 解析失败: {e}"
    if not isinstance(data, list):
        return False, "非数组"
    if len(data) < min_items:
        return False, f"长度 {len(data)} < {min_items}"
    return True, ""


def check_examples_structure(examples: list) -> tuple[bool, str]:
    """校验 examples 每项含 english, chinese。"""
    for i, item in enumerate(examples):
        if not isinstance(item, dict):
            return False, f"项[{i}] 非对象"
        if "english" not in item or "chinese" not in item:
            return False, f"项[{i}] 缺少 english/chinese"
    return True, ""


def check_synonyms_structure(synonyms: list) -> tuple[bool, str]:
    """校验 synonyms 每项含 synonym, chinese, example, exampleChinese。"""
    for i, item in enumerate(synonyms):
        if not isinstance(item, dict):
            return False, f"项[{i}] 非对象"
        for key in ("synonym", "chinese", "example", "exampleChinese"):
            if key not in item:
                return False, f"项[{i}] 缺少 {key}"
    return True, ""


def check_antonyms_structure(antonyms: list) -> tuple[bool, str]:
    """校验 antonyms 每项含 antonym, chinese, example, exampleChinese。"""
    for i, item in enumerate(antonyms):
        if not isinstance(item, dict):
            return False, f"项[{i}] 非对象"
        for key in ("antonym", "chinese", "example", "exampleChinese"):
            if key not in item:
                return False, f"项[{i}] 缺少 {key}"
    return True, ""


def main():
    if not DB.exists():
        print("数据库不存在:", DB)
        return

    expected = load_expected_words(WORDLIST_TXT)
    expected_set = {w.lower() for w in expected}
    print(f"词表总数（红宝书补全版）: {len(expected)}")

    conn = sqlite3.connect(str(DB))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, english, chinese, examples, synonyms, antonyms FROM words"
    ).fetchall()
    conn.close()

    db_count = len(rows)
    print(f"数据库记录数: {db_count}\n")

    # 1) 重复 english
    english_list = [r["english"] for r in rows if r["english"]]
    seen_lower = set()
    dupes = []
    for e in english_list:
        e_lower = e.lower()
        if e_lower in seen_lower:
            dupes.append(e)
        seen_lower.add(e_lower)
    if dupes:
        print(f"[错误] 重复的 english: {len(dupes)} 个，示例: {dupes[:5]}")
    else:
        print("[通过] 无重复 english")

    # 2) 缺失：词表中有但 DB 中没有
    in_db = {r["english"].lower() for r in rows if r["english"]}
    missing = [w for w in expected if w.lower() not in in_db]
    if missing:
        print(f"[未写入] 词表中未出现在 DB 的单词: {len(missing)} 个")
        print(f"         示例（前 10）: {missing[:10]}")
    else:
        print("[通过] 词表内单词均已写入 DB")

    # 3) 逐行校验数据完整性与 JSON 结构
    no_english = 0
    bad_examples = []
    bad_synonyms = []
    bad_antonyms = []
    ok_count = 0

    for r in rows:
        english = (r["english"] or "").strip()
        if not english:
            no_english += 1
            continue

        row_ok = True

        # examples
        ex_ok, ex_msg = check_json_list(r["examples"] or "", min_items=1)
        if not ex_ok:
            bad_examples.append((english, ex_msg))
            row_ok = False
        else:
            try:
                ex_data = json.loads(r["examples"])
                st_ok, st_msg = check_examples_structure(ex_data)
                if not st_ok:
                    bad_examples.append((english, st_msg))
                    row_ok = False
            except Exception as e:
                bad_examples.append((english, str(e)))
                row_ok = False

        # synonyms
        sy_ok, sy_msg = check_json_list(r["synonyms"] or "", min_items=1)
        if not sy_ok:
            bad_synonyms.append((english, sy_msg))
            row_ok = False
        else:
            try:
                sy_data = json.loads(r["synonyms"])
                st_ok, st_msg = check_synonyms_structure(sy_data)
                if not st_ok:
                    bad_synonyms.append((english, st_msg))
                    row_ok = False
            except Exception as e:
                bad_synonyms.append((english, str(e)))
                row_ok = False

        # antonyms
        an_ok, an_msg = check_json_list(r["antonyms"] or "", min_items=1)
        if not an_ok:
            bad_antonyms.append((english, an_msg))
            row_ok = False
        else:
            try:
                an_data = json.loads(r["antonyms"])
                st_ok, st_msg = check_antonyms_structure(an_data)
                if not st_ok:
                    bad_antonyms.append((english, st_msg))
                    row_ok = False
            except Exception as e:
                bad_antonyms.append((english, str(e)))
                row_ok = False

        if row_ok:
            ok_count += 1

    if no_english:
        print(f"[错误] english 为空: {no_english} 条")
    if bad_examples:
        print(f"[异常] examples 无效或结构不完整: {len(bad_examples)} 条")
        for w, msg in bad_examples[:5]:
            print(f"        {w}: {msg}")
    else:
        print("[通过] examples 均有效且结构完整")
    if bad_synonyms:
        print(f"[异常] synonyms 无效或结构不完整: {len(bad_synonyms)} 条")
        for w, msg in bad_synonyms[:5]:
            print(f"        {w}: {msg}")
    else:
        print("[通过] synonyms 均有效且结构完整")
    if bad_antonyms:
        print(f"[异常] antonyms 无效或结构不完整: {len(bad_antonyms)} 条")
        for w, msg in bad_antonyms[:5]:
            print(f"        {w}: {msg}")
    else:
        print("[通过] antonyms 均有效且结构完整")

    print(f"\n数据完整且结构正确的记录: {ok_count} / {db_count}")
    if db_count:
        pct = 100.0 * ok_count / db_count
        print(f"完整率: {pct:.1f}%")

    print("\n检查结束。")


if __name__ == "__main__":
    main()
