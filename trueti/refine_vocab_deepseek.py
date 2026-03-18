# -*- coding: utf-8 -*-
"""
使用 asyncio + aiohttp 并行调用 DeepSeek API，对 vocal_master.db 中的单词做「多词性释义 + 考点提示 + 情感」精修，
并写回 chinese（简短核心释义）与 data_json（含 defs、exam_tip、sentiment）；断点续传依赖 has_refined 字段。

用法：python trueti/refine_vocab_deepseek.py
依赖：pip install aiohttp
"""
from pathlib import Path
from typing import List, Optional

import argparse
import asyncio
import json
import re
import shutil
import sqlite3

try:
    import aiohttp
except ImportError:
    aiohttp = None

from api_config import get_api_key

TRUETI = Path(__file__).resolve().parent
PROJECT = TRUETI.parent
MASTER_DB = PROJECT / "static" / "vocal_master.db"
MASTER_DB_BACKUP = PROJECT / "static" / "vocal_master_backup.db"
DEV_MASTER_DB = PROJECT / "unpackage" / "dist" / "dev" / "app-plus" / "static" / "vocal_master.db"
DEV_MASTER_DB_BACKUP = PROJECT / "unpackage" / "dist" / "dev" / "app-plus" / "static" / "vocal_master_backup.db"

API_URL = "https://api.deepseek.com/v1/chat/completions"
MODEL = "deepseek-chat"
BATCH_SIZE = 35   # 一次 API 请求处理 35 个单词（1:35 批量）
CONCURRENCY = 15
REQUEST_TIMEOUT = 60
MAX_RETRIES = 3
RETRY_DELAY = 2.0

REFINE_SYSTEM = "你是考研英语专家，为单词提供多词性释义，并标记常考(freq)、熟词僻义(rare)、普通(normal)。"
REFINE_USER_TEMPLATE = """请一次性为以下 {n} 个单词分别生成释义。每个单词需包含：
1. defs 数组：每项含 pos（词性）、trans（释义）、type（freq/rare/normal）。
2. exam_tip：一句话考点提示。
3. sentiment：pos/neg/neu。

单词列表（小写）：{words}

直接返回一个 JSON 对象，以每个单词为 Key，值为该词的释义对象。不要其他说明，仅输出 JSON。
格式示例（Key 为单词字符串）：
{{"word1": {{"defs":[{{"pos":"v.","trans":"释义","type":"freq"}}],"exam_tip":"...","sentiment":"neu"}}, "word2": {{...}}, ...}}"""


def ensure_has_refined_column(conn: sqlite3.Connection):
    cur = conn.execute("PRAGMA table_info(vocab_master)")
    cols = [row[1] for row in cur.fetchall()]
    if "has_refined" not in cols:
        conn.execute("ALTER TABLE vocab_master ADD COLUMN has_refined INTEGER DEFAULT 0")
        conn.commit()


def apply_fast_sqlite_pragmas(conn: sqlite3.Connection):
    """
    精修是离线批处理任务，优先吞吐。
    这些参数会显著减少 SQLite 同步开销。
    """
    pragmas = [
        "PRAGMA journal_mode = WAL",
        "PRAGMA synchronous = NORMAL",
        "PRAGMA temp_store = MEMORY",
        "PRAGMA cache_size = -200000",
        "PRAGMA mmap_size = 268435456",
    ]
    for sql in pragmas:
        try:
            conn.execute(sql)
        except Exception:
            pass


def load_pending_english(conn: sqlite3.Connection, limit: int = 0):
    sql = "SELECT english FROM vocab_master WHERE (has_refined IS NULL OR has_refined = 0) ORDER BY english"
    if limit > 0:
        sql += f" LIMIT {limit}"
    cur = conn.execute(sql)
    return [row[0].strip().lower() for row in cur.fetchall() if row[0]]


def load_pending_from_word_list(conn: sqlite3.Connection, path: Path) -> List[str]:
    """从文件读取单词列表（每行一个），只保留在库中且未精修的词。"""
    if not path.exists():
        return []
    words_file = [line.strip().lower() for line in path.read_text(encoding="utf-8", errors="ignore").splitlines() if line.strip()]
    if not words_file:
        return []
    placeholders = ",".join("?" for _ in words_file)
    sql = f"SELECT english FROM vocab_master WHERE (has_refined IS NULL OR has_refined = 0) AND LOWER(TRIM(english)) IN ({placeholders}) ORDER BY english"
    cur = conn.execute(sql, tuple(words_file))
    return [row[0].strip().lower() for row in cur.fetchall() if row[0]]


def build_short_chinese(defs: list) -> str:
    if not defs or not isinstance(defs, list):
        return ""
    parts = []
    for d in defs[:5]:
        if isinstance(d, dict) and d.get("trans"):
            parts.append(d.get("trans", "").strip())
    return "；".join(parts) if parts else ""


def sanitize_defs(defs: list) -> list:
    """过滤无效 defs，至少要有 trans，pos/type 做兜底。"""
    if not isinstance(defs, list):
        return []
    out = []
    for d in defs:
        if not isinstance(d, dict):
            continue
        trans = (d.get("trans") or "").strip()
        if not trans:
            continue
        pos = (d.get("pos") or "").strip() or "n."
        typ = (d.get("type") or "").strip().lower()
        if typ not in {"freq", "rare", "normal"}:
            typ = "normal"
        out.append({"pos": pos, "trans": trans, "type": typ})
    return out


def parse_refine_response_object(text: str) -> Optional[dict]:
    """解析模型返回的「以单词为 Key」的嵌套 JSON 对象。"""
    text = (text or "").strip()
    for start in ["{", "```json"]:
        i = text.find(start)
        if i >= 0:
            if start == "{":
                end = text.rfind("}") + 1
            else:
                j = text.find("{", i)
                if j >= 0:
                    end = text.rfind("}") + 1
                else:
                    continue
            if end > i:
                try:
                    raw = text[i:end].replace("```json", "").replace("```", "").strip()
                    return json.loads(raw)
                except json.JSONDecodeError:
                    pass
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def parse_refine_response_fallback_array(text: str) -> Optional[list]:
    """兼容模型偶发返回 JSON 数组。"""
    text = (text or "").strip()
    for start in ["[", "```json"]:
        i = text.find(start)
        if i >= 0:
            if start == "[":
                end = text.rfind("]") + 1
            else:
                j = text.find("[", i)
                if j < 0:
                    continue
                end = text.rfind("]") + 1
            if end > i:
                try:
                    raw = text[i:end].replace("```json", "").replace("```", "").strip()
                    return json.loads(raw)
                except json.JSONDecodeError:
                    pass
    try:
        arr = json.loads(text)
        return arr if isinstance(arr, list) else None
    except json.JSONDecodeError:
        return None


def normalize_batch_result(content: str, words: List[str]) -> dict:
    """
    兼容两种返回：
    1) {"word": {...}}
    2) [{"word":"...", ...}, ...]
    """
    by_word = {}
    obj = parse_refine_response_object(content)
    if isinstance(obj, dict):
        for k, v in obj.items():
            w = (k or "").strip().lower()
            if not (w and isinstance(v, dict)):
                continue
            defs = sanitize_defs(v.get("defs"))
            if defs:
                by_word[w] = {
                    "defs": defs,
                    "exam_tip": v.get("exam_tip") or "",
                    "sentiment": v.get("sentiment") or "neu",
                }
        if by_word:
            return by_word

    arr = parse_refine_response_fallback_array(content)
    if isinstance(arr, list):
        for item in arr:
            if not isinstance(item, dict):
                continue
            w = (item.get("word") or item.get("english") or "").strip().lower()
            defs = sanitize_defs(item.get("defs"))
            if w and defs:
                by_word[w] = {
                    "defs": defs,
                    "exam_tip": item.get("exam_tip") or "",
                    "sentiment": item.get("sentiment") or "neu",
                }
    return by_word


def reset_invalid_refined_rows(conn: sqlite3.Connection) -> int:
    """
    防止脏标记：has_refined=1 但 defs 缺失/无效的行回滚为 0，便于重跑。
    """
    rows = conn.execute("SELECT english, data_json FROM vocab_master WHERE has_refined = 1").fetchall()
    bad = []
    for english, data_json in rows:
        try:
            data = json.loads(data_json or "{}")
            defs = sanitize_defs(data.get("defs"))
            if not defs:
                bad.append((english,))
        except Exception:
            bad.append((english,))
    if not bad:
        return 0
    conn.executemany("UPDATE vocab_master SET has_refined = 0 WHERE english = ?", bad)
    conn.commit()
    return len(bad)


def backup_master_db():
    if not MASTER_DB.exists():
        print(f"未找到主库，无法备份: {MASTER_DB}")
        return
    try:
        shutil.copy2(MASTER_DB, MASTER_DB_BACKUP)
        print(f"已备份主库 -> {MASTER_DB_BACKUP}")
    except Exception as e:
        print(f"备份主库失败: {e}")
    try:
        if DEV_MASTER_DB.parent.exists():
            shutil.copy2(MASTER_DB, DEV_MASTER_DB)
            print(f"已同步开发静态主库 -> {DEV_MASTER_DB}")
            shutil.copy2(MASTER_DB, DEV_MASTER_DB_BACKUP)
            print(f"已同步开发备份主库 -> {DEV_MASTER_DB_BACKUP}")
    except Exception as e:
        print(f"同步开发静态主库失败: {e}")


async def call_deepseek_batch(
    session: aiohttp.ClientSession,
    api_key: str,
    words: List[str],
    sem: asyncio.Semaphore,
) -> dict:
    """一次请求 35 个单词，返回以单词为 Key 的 dict，无效 key 不在其中。"""
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
                        print(f"  [batch {words[0]}..] 解析失败（对象/数组均不合法）")
                        return {}
                    # 避免模型返回额外词条，确保只处理本批词
                    by_word = {w: by_word[w] for w in words if w in by_word}
                    return by_word
            except asyncio.TimeoutError:
                print(f"  [batch {words[0]}..] 超时")
            except Exception as e:
                print(f"  [batch {words[0]}..] {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY * (attempt + 1))
    return {}


def load_current_rows_map(conn: sqlite3.Connection, words: List[str]) -> dict:
    if not words:
        return {}
    placeholders = ",".join("?" for _ in words)
    sql = f"SELECT english, chinese, data_json FROM vocab_master WHERE english IN ({placeholders})"
    out = {}
    for english, chinese, data_json in conn.execute(sql, tuple(words)).fetchall():
        try:
            parsed = json.loads(data_json or "{}")
        except Exception:
            parsed = {}
        out[(english or "").strip().lower()] = {
            "chinese": (chinese or "").strip(),
            "data_json": parsed if isinstance(parsed, dict) else {},
        }
    return out


def write_refined_batch(conn: sqlite3.Connection, by_word: dict, words: List[str]) -> int:
    """将本批次有效结果写入 DB，不 commit；返回本批成功数。"""
    valid_words = [english for english in words if by_word.get(english)]
    current_rows = load_current_rows_map(conn, valid_words)
    updates = []
    for english in words:
        refined = by_word.get(english)
        defs = sanitize_defs((refined or {}).get("defs"))
        if not refined or not defs:
            continue
        current = current_rows.get(english, {})
        current_data = current.get("data_json") or {}
        merged = {**current_data, "defs": defs, "exam_tip": refined.get("exam_tip") or "", "sentiment": refined.get("sentiment") or "neu"}
        data_json = json.dumps(merged, ensure_ascii=False)
        short_chinese = build_short_chinese(defs)
        final_chinese = (short_chinese or "").strip() or (current.get("chinese") or "")
        updates.append((final_chinese, data_json, english))
    if updates:
        conn.executemany(
            "UPDATE vocab_master SET chinese = ?, data_json = ?, has_refined = 1 WHERE english = ?",
            updates,
        )
    return len(updates)


async def main():
    if aiohttp is None:
        print("请安装: pip install aiohttp")
        raise SystemExit(1)

    if not MASTER_DB.exists():
        print(f"未找到 {MASTER_DB}，请先运行 build_master_db.py")
        raise SystemExit(1)

    parser = argparse.ArgumentParser(description="DeepSeek 精修 vocal_master 释义（defs/exam_tip/sentiment）")
    parser.add_argument("--limit", type=int, default=0, help="仅处理前 N 个未精修词（冷启动测试建议 10）")
    parser.add_argument("--word-list", type=str, default="", help="只处理该文件中的单词（每行一个），且仅当在库中且未精修时处理")
    parser.add_argument("--concurrency", type=int, default=CONCURRENCY, help=f"并发数，默认 {CONCURRENCY}")
    args = parser.parse_args()

    api_key = get_api_key()
    conn = sqlite3.connect(str(MASTER_DB))
    apply_fast_sqlite_pragmas(conn)
    ensure_has_refined_column(conn)
    repaired = reset_invalid_refined_rows(conn)
    if repaired:
        print(f"已回滚无效精修标记: {repaired} 条")
    total_in_db = conn.execute("SELECT COUNT(*) FROM vocab_master").fetchone()[0]
    if args.word_list:
        pending = load_pending_from_word_list(conn, Path(args.word_list))
        print(f"从词表文件加载: 共 {len(pending)} 个未精修词待处理")
    else:
        pending = load_pending_english(conn, limit=args.limit)
    total_run = len(pending)
    concurrency = args.concurrency
    print(f"待精修: {total_run} 个单词，并发数: {concurrency}，每批 {BATCH_SIZE} 词")

    sem = asyncio.Semaphore(concurrency)
    done = 0
    failed = 0
    # 1. 把 pending 切成「每 BATCH_SIZE 个词一组」的 chunks
    chunks = [pending[i : i + BATCH_SIZE] for i in range(0, total_run, BATCH_SIZE)]
    num_batches = len(chunks)
    num_waves = (num_batches + concurrency - 1) // concurrency
    print(f"每批 {BATCH_SIZE} 词，共 {num_batches} 批；每波 {concurrency} 批（约 {concurrency * BATCH_SIZE} 词）", flush=True)

    async with aiohttp.ClientSession() as session:
        # 2. 以 CONCURRENCY 为步长分波次处理
        for wave_start in range(0, num_batches, concurrency):
            wave_chunks = chunks[wave_start : wave_start + concurrency]  # 这一波最多 15 个 chunk，共约 525 词
            tasks = [call_deepseek_batch(session, api_key, c, sem) for c in wave_chunks]
            results = await asyncio.gather(*tasks, return_exceptions=True)  # 单个请求异常不导致整波丢失

            # 3. 统一处理结果并写入
            wave_success = 0
            wave_failed = 0
            for chunk, result in zip(wave_chunks, results):
                if isinstance(result, BaseException):
                    failed += len(chunk)
                    wave_failed += len(chunk)
                    print(f"  [波次] 某批异常: {result!r}")
                elif isinstance(result, dict) and result:
                    batch_ok = write_refined_batch(conn, result, chunk)
                    done += batch_ok
                    failed += len(chunk) - batch_ok
                    wave_success += batch_ok
                    wave_failed += len(chunk) - batch_ok
                else:
                    failed += len(chunk)
                    wave_failed += len(chunk)

            conn.commit()  # 每一波提交一次，保护磁盘且效率高
            refined_total = conn.execute("SELECT COUNT(*) FROM vocab_master WHERE has_refined = 1").fetchone()[0]
            pct = (refined_total / total_in_db * 100) if total_in_db else 0
            processed = min((wave_start + concurrency) * BATCH_SIZE, total_run)
            wave_no = wave_start // concurrency + 1
            print(
                f"波次 {wave_no}/{num_waves}  本波成功 {wave_success}  本波失败 {wave_failed}  "
                f"进度 {processed}/{total_run}  累计成功 {done}  总精修 {refined_total}/{total_in_db} ({pct:.1f}%)",
                flush=True,
            )

    conn.close()
    backup_master_db()
    print("完成.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
