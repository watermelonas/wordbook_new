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
import os
import re
import sqlite3

try:
    import aiohttp
except ImportError:
    aiohttp = None

TRUETI = Path(__file__).resolve().parent
PROJECT = TRUETI.parent
MASTER_DB = PROJECT / "static" / "vocal_master.db"

API_URL = "https://api.deepseek.com/v1/chat/completions"
MODEL = "deepseek-chat"
BATCH_SIZE = 20   # 一次 API 请求处理 20 个单词（1:20 批量）
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


def get_api_key():
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if key:
        return key
    env_file = PROJECT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if line.startswith("DEEPSEEK_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    config_js = PROJECT / "src" / "utils" / "config.js"
    if config_js.exists():
        text = config_js.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r"deepseekApiKey\s*:\s*['\"]([^'\"]+)['\"]", text, re.I)
        if m:
            return m.group(1).strip()
    raise SystemExit("请设置 DEEPSEEK_API_KEY 或 .env 或 config.js 中的 deepseekApiKey")


def ensure_has_refined_column(conn: sqlite3.Connection):
    cur = conn.execute("PRAGMA table_info(vocab_master)")
    cols = [row[1] for row in cur.fetchall()]
    if "has_refined" not in cols:
        conn.execute("ALTER TABLE vocab_master ADD COLUMN has_refined INTEGER DEFAULT 0")
        conn.commit()


def load_pending_english(conn: sqlite3.Connection, limit: int = 0):
    sql = "SELECT english FROM vocab_master WHERE (has_refined IS NULL OR has_refined = 0) ORDER BY english"
    if limit > 0:
        sql += f" LIMIT {limit}"
    cur = conn.execute(sql)
    return [row[0].strip().lower() for row in cur.fetchall() if row[0]]


def get_current_data_json(conn: sqlite3.Connection, english: str) -> dict:
    cur = conn.execute("SELECT data_json FROM vocab_master WHERE english = ? LIMIT 1", (english,))
    row = cur.fetchone()
    if not row or not row[0]:
        return {}
    try:
        return json.loads(row[0])
    except Exception:
        return {}


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


async def call_deepseek_batch(
    session: aiohttp.ClientSession,
    api_key: str,
    words: List[str],
    sem: asyncio.Semaphore,
) -> dict:
    """一次请求 20 个单词，返回以单词为 Key 的 dict，无效 key 不在其中。"""
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
