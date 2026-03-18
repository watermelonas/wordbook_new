# -*- coding: utf-8 -*-
"""
仅精修「未完成」的单词：从 vocal_master 中筛出 has_refined=0 的待精修词，
用小批量（默认每批 5 词）+ 低并发（默认 2）单独跑完，减少超时和 token 浪费。

用法：python trueti/refine_pending_only.py
      python trueti/refine_pending_only.py --batch 3 --concurrency 1   # 更保守
依赖：pip install aiohttp
"""
from pathlib import Path
from typing import List, Optional

import argparse
import asyncio
import json
import sqlite3

try:
    import aiohttp
except ImportError:
    aiohttp = None

from api_config import get_api_key

# 复用精修逻辑（与 refine_vocab_deepseek 一致）
from refine_vocab_deepseek import (
    MASTER_DB,
    MASTER_DB_BACKUP,
    DEV_MASTER_DB,
    DEV_MASTER_DB_BACKUP,
    API_URL,
    MODEL,
    REFINE_SYSTEM,
    REFINE_USER_TEMPLATE,
    REQUEST_TIMEOUT,
    MAX_RETRIES,
    RETRY_DELAY,
    ensure_has_refined_column,
    apply_fast_sqlite_pragmas,
    load_pending_english,
    build_short_chinese,
    sanitize_defs,
    normalize_batch_result,
    reset_invalid_refined_rows,
    load_current_rows_map,
    write_refined_batch,
)


def backup_master_db():
    import shutil
    if not MASTER_DB.exists():
        return
    try:
        shutil.copy2(MASTER_DB, MASTER_DB_BACKUP)
        print(f"已备份主库 -> {MASTER_DB_BACKUP}")
    except Exception as e:
        print(f"备份失败: {e}")
    try:
        if DEV_MASTER_DB.parent.exists():
            shutil.copy2(MASTER_DB, DEV_MASTER_DB)
            shutil.copy2(MASTER_DB, DEV_MASTER_DB_BACKUP)
    except Exception:
        pass


async def call_deepseek_batch(
    session: aiohttp.ClientSession,
    api_key: str,
    words: List[str],
    sem: asyncio.Semaphore,
) -> dict:
    """单次请求一批单词，返回 {word: {defs, exam_tip, sentiment}}。"""
    if not words:
        return {}
    n = len(words)
    prompt = REFINE_USER_TEMPLATE.format(n=n, words=", ".join(words))
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": REFINE_SYSTEM},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "stream": False,
    }
    for attempt in range(MAX_RETRIES):
        async with sem:
            try:
                async with session.post(
                    API_URL,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}",
                    },
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT * 2),
                ) as resp:
                    if resp.status == 429:
                        await asyncio.sleep(RETRY_DELAY * (attempt + 1))
                        continue
                    if resp.status != 200:
                        body = await resp.text()
                        print(f"  [batch {words[0]}..] HTTP {resp.status} {body[:150]}")
                        return {}
                    data = await resp.json()
                    content = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
                    by_word = normalize_batch_result(content, words)
                    if not by_word:
                        print(f"  [batch {words[0]}..] 解析失败")
                        return {}
                    by_word = {w: by_word[w] for w in words if w in by_word}
                    return by_word
            except asyncio.TimeoutError:
                print(f"  [batch {words[0]}..] 超时")
            except Exception as e:
                print(f"  [batch {words[0]}..] {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY * (attempt + 1))
    return {}


async def main():
    if aiohttp is None:
        print("请安装: pip install aiohttp")
        raise SystemExit(1)

    if not MASTER_DB.exists():
        print(f"未找到 {MASTER_DB}")
        raise SystemExit(1)

    parser = argparse.ArgumentParser(description="仅精修未完成的单词（小批量、低并发）")
    parser.add_argument("--batch", type=int, default=5, help="每批请求词数，默认 5")
    parser.add_argument("--concurrency", type=int, default=2, help="并发请求数，默认 2")
    parser.add_argument("--limit", type=int, default=0, help="最多处理 N 个词，0 表示全部")
    args = parser.parse_args()

    api_key = get_api_key()
    conn = sqlite3.connect(str(MASTER_DB))
    apply_fast_sqlite_pragmas(conn)
    ensure_has_refined_column(conn)
    repaired = reset_invalid_refined_rows(conn)
    if repaired:
        print(f"已回滚无效精修: {repaired} 条")

    pending = load_pending_english(conn, limit=args.limit)
    total_run = len(pending)
    if total_run == 0:
        print("没有待精修词，退出。")
        conn.close()
        return

    batch_size = max(1, min(args.batch, 15))
    concurrency = max(1, min(args.concurrency, 5))
    print(f"待精修: {total_run} 个 | 每批 {batch_size} 词 | 并发 {concurrency}")

    chunks = [pending[i : i + batch_size] for i in range(0, total_run, batch_size)]
    sem = asyncio.Semaphore(concurrency)
    done = 0
    failed = 0

    async with aiohttp.ClientSession() as session:
        for wave_start in range(0, len(chunks), concurrency):
            wave = chunks[wave_start : wave_start + concurrency]
            tasks = [call_deepseek_batch(session, api_key, c, sem) for c in wave]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for j, (chunk, result) in enumerate(zip(wave, results)):
                idx = wave_start + j + 1
                if isinstance(result, BaseException):
                    failed += len(chunk)
                    print(f"  批 {idx}/{len(chunks)} 异常: {result!r}")
                elif result:
                    batch_ok = write_refined_batch(conn, result, chunk)
                    done += batch_ok
                    failed += len(chunk) - batch_ok
                    print(f"  批 {idx}/{len(chunks)} 成功 {batch_ok}/{len(chunk)} 词")
                else:
                    failed += len(chunk)
                    print(f"  批 {idx}/{len(chunks)} 失败 {len(chunk)} 词")
            conn.commit()

    conn.close()
    backup_master_db()
    print(f"完成. 成功 {done}，失败 {failed}")


if __name__ == "__main__":
    asyncio.run(main())
