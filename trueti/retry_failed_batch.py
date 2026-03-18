# -*- coding: utf-8 -*-
"""
根据 check_batch_data 的校验结果，对「未写入」或「数据异常」的单词重新请求 AI 并写库，保证词库健壮性。
- 未写入：词表中有但 DB 中没有的单词
- 数据异常：examples/synonyms/antonyms 任一 JSON 无效或结构不完整
对异常记录先删除再按正常流程重新请求、插入。
"""
from pathlib import Path
import json
import re
import sqlite3
import time
import uuid

from concurrent.futures import ThreadPoolExecutor, as_completed

# 复用 check_batch_data 的校验与词表加载
from check_batch_data import (
    load_expected_words,
    check_json_list,
    check_examples_structure,
    check_synonyms_structure,
    check_antonyms_structure,
)

TRUETI = Path(__file__).resolve().parent
DB = TRUETI / "kaoyan_vocab.db"
WORDLIST_TXT = TRUETI / "wordbooks" / "红宝书补全版.txt"
PROJECT_ROOT = TRUETI.parent
WORD_DICT_JSON = PROJECT_ROOT / "src" / "utils" / "word-dict.json"

REQUEST_DELAY = 0.5
MAX_WORKERS = 10


def get_words_to_retry(db_path: Path, wordlist_path: Path) -> tuple[list[str], list[str]]:
    """
    返回 (missing_words, bad_data_words)。
    missing: 词表中有但 DB 中没有；
    bad_data: DB 中有但 examples/synonyms/antonyms 任一校验不通过。
    """
    expected = load_expected_words(wordlist_path)
    expected_set = {w.lower() for w in expected}
    in_db = set()
    bad_english = set()

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT english, examples, synonyms, antonyms FROM words"
    ).fetchall()
    conn.close()

    for r in rows:
        english = (r["english"] or "").strip()
        if not english:
            continue
        in_db.add(english.lower())

        row_ok = True
        for ok, _ in [check_json_list(r["examples"] or "", 1)]:
            if not ok:
                row_ok = False
                break
        if row_ok and r["examples"]:
            try:
                ex_data = json.loads(r["examples"])
                st_ok, _ = check_examples_structure(ex_data)
                if not st_ok:
                    row_ok = False
            except Exception:
                row_ok = False
        else:
            row_ok = False

        if row_ok:
            for ok, _ in [check_json_list(r["synonyms"] or "", 1)]:
                if not ok:
                    row_ok = False
                    break
            if row_ok and r["synonyms"]:
                try:
                    sy_data = json.loads(r["synonyms"])
                    st_ok, _ = check_synonyms_structure(sy_data)
                    if not st_ok:
                        row_ok = False
                except Exception:
                    row_ok = False
            else:
                row_ok = False
        else:
            row_ok = False

        if row_ok:
            for ok, _ in [check_json_list(r["antonyms"] or "", 1)]:
                if not ok:
                    row_ok = False
                    break
            if row_ok and r["antonyms"]:
                try:
                    an_data = json.loads(r["antonyms"])
                    st_ok, _ = check_antonyms_structure(an_data)
                    if not st_ok:
                        row_ok = False
                except Exception:
                    row_ok = False
            else:
                row_ok = False

        if not row_ok:
            bad_english.add(english)

    missing = [w for w in expected if w.lower() not in in_db]
    bad_data = list(bad_english)
    return missing, bad_data


def load_chinese_lookup(word_dict_path: Path) -> dict:
    if not word_dict_path.exists():
        return {}
    try:
        data = json.loads(word_dict_path.read_text(encoding="utf-8", errors="ignore"))
        words_list = data.get("words") or []
        return {(item.get("word") or "").strip().lower(): (item.get("chinese") or "").strip() for item in words_list if (item.get("word") or "").strip()}
    except Exception:
        return {}


def main():
    if not DB.exists():
        print("数据库不存在:", DB)
        return

    print("正在检查需要重试的单词…")
    missing, bad_data = get_words_to_retry(DB, WORDLIST_TXT)
    to_retry_set = {w.lower() for w in missing} | {w.lower() for w in bad_data}
    # 保持与词表顺序一致，且去重
    seen = set()
    to_retry_ordered = []
    for w in load_expected_words(WORDLIST_TXT):
        k = w.lower()
        if k in to_retry_set and k not in seen:
            seen.add(k)
            to_retry_ordered.append(w)

    if not to_retry_ordered:
        print("无需重试，所有单词均已正确写入且数据完整。")
        return

    print(f"未写入: {len(missing)} 个，数据异常: {len(bad_data)} 个，待重试（去重）: {len(to_retry_ordered)} 个")

    # 删除异常记录，便于重新插入
    conn = sqlite3.connect(str(DB))
    for w in bad_data:
        conn.execute("DELETE FROM words WHERE LOWER(english) = LOWER(?)", (w,))
    conn.commit()
    print(f"已删除 {len(bad_data)} 条异常记录")

    # 导入批处理模块的 API 与写入逻辑
    import batch_ai_vocab as batch
    api_key = batch.get_api_key()
    chinese_lookup = load_chinese_lookup(WORD_DICT_JSON)
    to_process = [(word, chinese_lookup.get(word.lower(), "")) for word in to_retry_ordered]

    batch.ensure_table(conn)
    done = 0
    failed = 0
    total_todo = len(to_process)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(
                batch.process_one_word,
                api_key,
                word,
                chinese,
                REQUEST_DELAY,
            ): (word, chinese)
            for word, chinese in to_process
        }
        for future in as_completed(futures):
            try:
                result = future.result()
            except Exception as e:
                failed += 1
                w = futures[future][0]
                print(f"  [异常] {w}: {e}")
                continue
            if result[0] == "err":
                failed += 1
                print(f"  [请求失败] {result[1]}: {result[2][:80]}")
                continue
            _, word, chinese, examples, synonyms, antonyms = result
            word_id = str(uuid.uuid4())
            batch.insert_word(conn, word_id, word, chinese, examples, synonyms, antonyms)
            done += 1
            if done % 10 == 0 or done == 1:
                print(f"已重试写入 {done}/{total_todo}，当前: {word}")

    conn.close()
    print(f"重试结束。成功 {done}，失败 {failed}")

    # 重新导出 pregen_vocab.json 并同步到构建目录
    json_out = PROJECT_ROOT / "static" / "pregen_vocab.json"
    export_conn = sqlite3.connect(str(DB))
    batch.export_db_to_json(export_conn, json_out)
    export_conn.close()
    print(f"已导出: {json_out}")
    import shutil
    for subdir in ["unpackage/dist/dev/app-plus", "unpackage/dist/build/app-plus"]:
        dest_dir = PROJECT_ROOT / subdir / "static"
        if dest_dir.exists():
            dest = dest_dir / "pregen_vocab.json"
            try:
                shutil.copy2(json_out, dest)
                print(f"已同步到: {dest}")
            except Exception as e:
                print(f"同步失败 {dest}: {e}")
    print("词库健壮性重试完成。")


if __name__ == "__main__":
    main()
