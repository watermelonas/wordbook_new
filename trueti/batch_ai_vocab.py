# -*- coding: utf-8 -*-
"""
离线批处理：从 红宝书补全版.txt 读取单词，按现有 AI 规则生成例句/近义词/反义词，写入 SQLite。
- 多线程并行（ThreadPoolExecutor，默认 10 并发），写入由主线程串行保证线程安全
- 断点续传：跳过已存在的单词（按 english 判断）
- 严格复用项目内 aiService 的 Prompt 与解析逻辑
- 支持速率限制与重试
"""
from pathlib import Path
import json
import re
import sqlite3
import time
import uuid

from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import requests
except ImportError:
    print("请安装: pip install requests")
    raise

from api_config import get_api_key

# --------------- 路径与配置 ---------------
TRUETI = Path(__file__).resolve().parent
PROJECT_ROOT = TRUETI.parent
WORDLIST_TXT = TRUETI / "wordbooks" / "红宝书补全版.txt"
WORD_DICT_JSON = PROJECT_ROOT / "src" / "utils" / "word-dict.json"
OUTPUT_DB = TRUETI / "kaoyan_vocab.db"

API_URL = "https://api.deepseek.com/v1/chat/completions"
MODEL = "deepseek-chat"
SYSTEM_PROMPT = "你是一个英语学习助手，帮助用户学习英语单词。"
TEMPERATURE = 0.6

# 速率限制：每个请求间隔（秒）
REQUEST_DELAY = 0.5
# 单次请求超时
REQUEST_TIMEOUT = 60
# 失败重试次数与间隔
MAX_RETRIES = 3
RETRY_DELAY = 10.0
# 多线程并发数（仅影响 API 请求；写入仍在主线程）
MAX_WORKERS = 15


def load_words_from_txt(txt_path: Path) -> list[str]:
    """从 红宝书补全版.txt 提取英文单词，每行一个，去重并过滤非单词。"""
    if not txt_path.exists():
        raise FileNotFoundError(f"单词列表不存在: {txt_path}")
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


def load_chinese_lookup(word_dict_path: Path) -> dict:
    """可选：从 word-dict.json 构建 word_lower -> chinese 的查找表（仅加载需要的键以省内存可后续做）。"""
    if not word_dict_path.exists():
        return {}
    try:
        data = json.loads(word_dict_path.read_text(encoding="utf-8", errors="ignore"))
        words_list = data.get("words") or []
        return {(item.get("word") or "").strip().lower(): (item.get("chinese") or "").strip() for item in words_list if (item.get("word") or "").strip()}
    except Exception as e:
        print(f"加载 word-dict 失败，将不填充中文释义: {e}")
        return {}


def call_api(api_key: str, prompt: str) -> str:
    """与 aiService.callAPI 一致的请求体与解析。"""
    for attempt in range(MAX_RETRIES):
        try:
            r = requests.post(
                API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": TEMPERATURE,
                    "stream": False,
                },
                timeout=REQUEST_TIMEOUT,
            )
            if r.status_code == 200:
                data = r.json()
                if data.get("choices") and data["choices"][0].get("message"):
                    return (data["choices"][0]["message"].get("content") or "").strip()
                return "错误: API 响应格式错误"
            msg = r.json().get("error", {}).get("message", r.text) if r.text else "未知错误"
            if r.status_code == 429:
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            return f"错误: {msg} (状态码: {r.status_code})"
        except requests.RequestException as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            return f"网络请求失败: {e}"
    return "错误: 超过最大重试次数"


# --------------- 与 aiService 一致的 Prompt ---------------

def prompt_examples(word: str, count: int = 3) -> str:
    existing_str = "用户单词本中暂无其他单词"
    return f"""请为以下英语单词生成{count}个不同的例句，要求：

单词：{word}
{existing_str}

例句要求：
1. 高级例句，包含高级单词
2. 句子不能过于冗长，结构清晰
3. 每个句子中包含2-3个考研词库中较难的单词
4. 例句要像考研的作文题和翻译题，贴近考研考纲
5. 尽量包含单词本中已有的其他单词，形成反复记忆的效果
6. 上下文合理，能够展示单词的正确用法
7. 每个例句都要提供中文翻译
8. 确保每个例句的场景和结构都不同
9. 重要单词标记规则：
   - 目标单词必须用 ** 标记
   - 每个例句中至少标记2-3个其他考研核心词汇
   - 标记格式：**单词**，如 "**important**"
10. 例句要生动形象，贴近现实生活场景，内容有趣，容易记忆
11. 可以加入具体的场景描述，让例句更有画面感
12. 输出格式：每个例句一组，英文例句和中文翻译各占一行，不要使用任何分隔符

示例输出：
英文：在一个阳光明媚的周末，**significant** number of families gathered in the park, enjoying the **vibrant** flowers and **tranquil** atmosphere.
中文：在一个阳光明媚的周末，**大量**家庭聚集在公园里，欣赏着**鲜艳**的花朵和**宁静**的氛围。"""


def prompt_synonyms(word: str, count: int = 3) -> str:
    existing_str = "用户单词本中暂无其他单词"
    return f"""请为以下英语单词生成{count}个近义词或同义词，并为每个近义词生成一个例句。

单词：{word}
{existing_str}

要求：
1. 选择3个最常见、最实用的近义词或同义词
2. 每个近义词需要包含：英文、中文释义、一个英文例句（带中文翻译）
3. 例句要像考研英语风格，包含高级词汇
4. 每个例句中用 **标记目标近义词和2-3个其他考研核心词汇
5. 输出格式：每组近义词包含4行：近义词、中文、英文例句、中文翻译

示例输出：
近义词：significant
中文：重要的，重大的
例句：The **significant** discovery changed the **entire** scientific community's understanding of **ancient** civilizations.
中文翻译：这一**重大**发现改变了**整个**科学界对**古代**文明的理解。"""


def prompt_antonyms(word: str, count: int = 3) -> str:
    return f"""请为以下英语单词生成{count}个反义词，并为每个反义词生成一个例句。

单词：{word}

要求：
1. 选择{count}个最常见、最实用的反义词
2. 每个反义词需要包含：英文、中文释义、一个英文例句（带中文翻译）
3. 例句要像考研英语风格，包含高级词汇
4. 每个例句中用 ** 标记目标反义词和2-3个其他考研核心词汇
5. 输出格式：每组反义词包含4行：反义词、中文、英文例句、中文翻译

示例输出：
反义词：minor
中文：次要的，不重要的
例句：The **minor** issue was **overlooked** in the **initial** report.
中文翻译：这一**次要**问题在**最初**的报告中**被忽视**了。"""


def prompt_combined(word: str, count: int = 3) -> str:
    """一次请求同时获取例句、近义词、反义词，要求返回 JSON。"""
    return f"""请为以下英语单词一次性生成三部分内容：{count}个例句、{count}个近义词（各带例句）、{count}个反义词（各带例句）。

单词：{word}

要求：
1. 例句：高级、考研风格，目标词用 ** 标记，每句配中文翻译。
2. 近义词：每个含 synonym、chinese、example、exampleChinese，例句用 ** 标记核心词。
3. 反义词：每个含 antonym、chinese、example、exampleChinese，例句用 ** 标记核心词。

请【严格】只返回一个 JSON 对象，不要 Markdown 代码块，不要其他说明。格式如下：
{{"examples":[{{"english":"英文例句","chinese":"中文"}},{{"english":"...","chinese":"..."}},{{"english":"...","chinese":"..."}}],"synonyms":[{{"synonym":"词","chinese":"释义","example":"例句","exampleChinese":"例句中文"}},...],"antonyms":[{{"antonym":"词","chinese":"释义","example":"例句","exampleChinese":"例句中文"}},...]}}"""


def parse_combined(result: str, word: str, count: int = 3) -> tuple[list, list, list]:
    """从一次 combined 请求的 JSON 中解析出 examples, synonyms, antonyms。失败时退回空列表或兜底。"""
    examples, synonyms, antonyms = [], [], []
    if not result or result.startswith("错误:") or result.startswith("网络"):
        return (
            [{"english": f"Example with {word}.", "chinese": "例句"} for _ in range(count)],
            [{"synonym": f"synonym{i+1}", "chinese": "近义词", "example": "", "exampleChinese": ""} for i in range(count)],
            [{"antonym": f"antonym{i+1}", "chinese": "反义词", "example": "", "exampleChinese": ""} for i in range(count)],
        )
    try:
        json_str = result
        m = re.search(r"\{[\s\S]*\}", result)
        if m:
            json_str = m.group(0)
        data = json.loads(json_str)
        examples = (data.get("examples") or [])[:count]
        synonyms = (data.get("synonyms") or [])[:count]
        antonyms = (data.get("antonyms") or [])[:count]
    except Exception:
        pass
    if not examples:
        examples = [{"english": f"Example with {word}.", "chinese": "例句"} for _ in range(count)]
    if not synonyms:
        synonyms = [{"synonym": f"synonym{i+1}", "chinese": "近义词", "example": "", "exampleChinese": ""} for i in range(count)]
    if not antonyms:
        antonyms = [{"antonym": f"antonym{i+1}", "chinese": "反义词", "example": "", "exampleChinese": ""} for i in range(count)]
    return examples, synonyms, antonyms


# --------------- 与 aiService 一致的解析 ---------------

def parse_examples(result: str, word: str, count: int = 3) -> list[dict]:
    examples = []
    lines = [ln.strip() for ln in (result or "").splitlines() if ln.strip()]
    for i in range(0, len(lines) - 1, 2):
        eng = lines[i]
        chi = lines[i + 1] if i + 1 < len(lines) else ""
        for prefix in ("英文：", "English：", ":"):
            eng = re.sub(r"^" + re.escape(prefix), "", eng).strip()
        for prefix in ("中文：", "Chinese：", ":"):
            chi = re.sub(r"^" + re.escape(prefix), "", chi).strip()
        if eng:
            examples.append({"english": eng, "chinese": chi})
        if len(examples) >= count:
            break
    if not examples:
        for sep in ("｜", "|"):
            for line in lines:
                parts = line.split(sep, 1)
                if len(parts) == 2:
                    eng = re.sub(r"^(英文：?|English：?|:)\s*", "", parts[0].strip()).strip()
                    chi = re.sub(r"^(中文：?|Chinese：?|:)\s*", "", parts[1].strip()).strip()
                    if eng:
                        examples.append({"english": eng, "chinese": chi})
                if len(examples) >= count:
                    break
            if examples:
                break
    if not examples:
        for i in range(count):
            examples.append({"english": f"Example {i+1}: This is a sentence with {word}.", "chinese": f"例句 {i+1}：这是一个包含 {word} 的句子。"})
    return examples[:count]


def parse_synonyms(result: str, word: str, count: int = 3) -> list[dict]:
    synonyms = []
    lines = [ln.strip() for ln in (result or "").splitlines() if ln.strip()]
    for i in range(0, len(lines), 4):
        syn = re.sub(r"^近义词：?\s*", "", lines[i] if i < len(lines) else "").strip()
        chi = re.sub(r"^中文：?\s*", "", lines[i + 1] if i + 1 < len(lines) else "").strip()
        ex = re.sub(r"^例句：?\s*", "", lines[i + 2] if i + 2 < len(lines) else "").strip()
        ex_chi = re.sub(r"^中文翻译：?\s*", "", lines[i + 3] if i + 3 < len(lines) else "").strip()
        if syn and chi:
            synonyms.append({"synonym": syn, "chinese": chi, "example": ex, "exampleChinese": ex_chi})
        if len(synonyms) >= count:
            break
    if not synonyms:
        for i in range(count):
            synonyms.append({"synonym": f"synonym{i+1}", "chinese": f"近义词{i+1}", "example": f"Example with {word}.", "exampleChinese": f"例句翻译{i+1}"})
    return synonyms[:count]


def parse_antonyms(result: str, word: str, count: int = 3) -> list[dict]:
    antonyms = []
    lines = [ln.strip() for ln in (result or "").splitlines() if ln.strip()]
    for i in range(0, len(lines), 4):
        ant = re.sub(r"^反义词：?\s*", "", lines[i] if i < len(lines) else "").strip()
        chi = re.sub(r"^中文：?\s*", "", lines[i + 1] if i + 1 < len(lines) else "").strip()
        ex = re.sub(r"^例句：?\s*", "", lines[i + 2] if i + 2 < len(lines) else "").strip()
        ex_chi = re.sub(r"^中文翻译：?\s*", "", lines[i + 3] if i + 3 < len(lines) else "").strip()
        if ant and chi:
            antonyms.append({"antonym": ant, "chinese": chi, "example": ex, "exampleChinese": ex_chi})
        if len(antonyms) >= count:
            break
    if not antonyms:
        for i in range(count):
            antonyms.append({"antonym": f"antonym{i+1}", "chinese": "反义词", "example": "", "exampleChinese": ""})
    return antonyms[:count]


# --------------- SQLite（与 app 表结构一致） ---------------

def ensure_table(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS words (
            id TEXT PRIMARY KEY,
            english TEXT NOT NULL,
            chinese TEXT,
            tags TEXT,
            source_page TEXT,
            year TEXT,
            importance INTEGER,
            error_rate REAL,
            review_frequency INTEGER,
            repeat_count INTEGER DEFAULT 1,
            view_count INTEGER DEFAULT 0,
            examples TEXT,
            synonyms TEXT,
            antonyms TEXT,
            create_time TEXT,
            update_time TEXT
        )
    """)
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_words_english ON words(english)")
    conn.commit()


def word_exists(conn: sqlite3.Connection, english: str) -> bool:
    cur = conn.execute("SELECT 1 FROM words WHERE english = ? LIMIT 1", (english,))
    return cur.fetchone() is not None


def insert_word(
    conn: sqlite3.Connection,
    word_id: str,
    english: str,
    chinese: str,
    examples: list,
    synonyms: list,
    antonyms: list,
) -> None:
    now = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
    conn.execute(
        """INSERT INTO words (
            id, english, chinese, tags, source_page, year, importance,
            error_rate, review_frequency, repeat_count, view_count,
            examples, synonyms, antonyms, create_time, update_time
        ) VALUES (?, ?, ?, '', '', '', 3, 0, 0, 1, 0, ?, ?, ?, ?, ?)""",
        (
            word_id,
            english,
            chinese or "",
            json.dumps(examples, ensure_ascii=False),
            json.dumps(synonyms, ensure_ascii=False),
            json.dumps(antonyms, ensure_ascii=False),
            now,
            now,
        ),
    )
    conn.commit()


# --------------- 多线程 worker ---------------


def process_one_word(
    api_key: str,
    word: str,
    chinese: str,
    delay: float,
) -> tuple:
    """
    单个单词的 API 调用与解析（在子线程中执行）。
    返回 ("ok", word, chinese, examples, synonyms, antonyms) 或 ("err", word, msg)。
    """
    time.sleep(delay)  # 各线程错开一点，减轻瞬时并发
    raw = call_api(api_key, prompt_combined(word))
    if raw.startswith("错误:") or raw.startswith("网络"):
        return ("err", word, raw[:120])
    examples, synonyms, antonyms = parse_combined(raw, word)
    return ("ok", word, chinese, examples, synonyms, antonyms)


# --------------- 主流程 ---------------
# 断点续传：默认按 english 判断，已存在的单词会跳过（可 --no-skip 关闭）。
# 多线程：API 请求并行，写入由主线程串行执行，保证 SQLite 线程安全。


def main():
    import argparse
    parser = argparse.ArgumentParser(description="红宝书补全版单词 AI 批处理，写入 kaoyan_vocab.db")
    parser.add_argument("--txt", type=Path, default=WORDLIST_TXT, help="单词列表 txt 路径")
    parser.add_argument("--db", type=Path, default=OUTPUT_DB, help="输出 SQLite 路径")
    parser.add_argument("--api-key", type=str, default="", help="DeepSeek API Key（也可用 DEEPSEEK_API_KEY 环境变量）")
    parser.add_argument("--no-skip", action="store_true", help="不跳过已存在单词（会重复插入失败，仅用于重跑单次）")
    parser.add_argument("--delay", type=float, default=REQUEST_DELAY, help="每次 API 请求间隔秒数")
    parser.add_argument("--limit", type=int, default=0, help="最多处理单词数，0 表示全部")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS, help=f"并发线程数（默认 {MAX_WORKERS}）")
    parser.add_argument("--no-dict", action="store_true", help="不加载 word-dict 填中文（可省内存）")
    parser.add_argument("--export-only", action="store_true", help="仅从已有 DB 导出 JSON，不调用 API")
    parser.add_argument("--json", type=Path, default=None, help="导出 JSON 路径（默认 static/pregen_vocab.json）")
    args = parser.parse_args()

    if args.export_only:
        db_path = args.db
        if not db_path.exists():
            raise SystemExit(f"数据库不存在: {db_path}，请先运行批处理生成")
        json_out = args.json or (PROJECT_ROOT / "static" / "pregen_vocab.json")
        conn = sqlite3.connect(str(db_path))
        export_db_to_json(conn, json_out)
        conn.close()
        print(f"导出完成: {json_out}")
        # 同步到构建输出目录，确保正在运行的 App 能读到最新文件
        import shutil
        for subdir in ["unpackage/dist/dev/app-plus", "unpackage/dist/build/app-plus"]:
            dest_dir = PROJECT_ROOT / subdir / "static"
            if dest_dir.exists():
                dest = dest_dir / "pregen_vocab.json"
                try:
                    shutil.copy2(json_out, dest)
                    print(f"已同步到: {dest}")
                except Exception as e:
                    print(f"同步到 {dest} 失败: {e}")
        return

    api_key = (args.api_key or get_api_key()).strip()
    if not api_key:
        raise SystemExit("未提供 DEEPSEEK_API_KEY")

    words = load_words_from_txt(args.txt)
    if args.limit > 0:
        words = words[: args.limit]
    print(f"共加载 {len(words)} 个单词，来源: {args.txt}")

    chinese_lookup = {} if args.no_dict else load_chinese_lookup(WORD_DICT_JSON)
    if chinese_lookup:
        print(f"已加载 word-dict 中文释义，共 {len(chinese_lookup)} 条")

    args.db.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(args.db))
    ensure_table(conn)
    skip_existing = not args.no_skip
    PAUSE_FILE = TRUETI / "PAUSE_BATCH.txt"

    # 断点续传：只处理尚未写入的单词（主线程内检查，保证线程安全）
    to_process = []
    skipped = 0
    for idx, word in enumerate(words):
        if skip_existing and word_exists(conn, word):
            skipped += 1
            continue
        chinese = chinese_lookup.get(word.lower(), "")
        to_process.append((word, chinese))
    total_todo = len(to_process)
    print(f"待处理 {total_todo} 个，已跳过 {skipped} 个；并发数: {args.workers}")

    done = 0
    failed = 0
    # 多线程请求，主线程统一写入 SQLite（线程安全）
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(
                process_one_word,
                api_key,
                word,
                chinese,
                args.delay,
            ): (word, chinese)
            for word, chinese in to_process
        }
        for future in as_completed(futures):
            if PAUSE_FILE.exists():
                print("检测到 PAUSE_BATCH.txt，已暂停。未完成的任务将不再写入。")
                for f in futures:
                    f.cancel()
                break
            try:
                result = future.result()
            except Exception as e:
                failed += 1
                word = futures[future][0]
                print(f"  [异常] {word}: {e}")
                continue
            if result[0] == "err":
                failed += 1
                print(f"  [合并请求] {result[1]}: {result[2][:80]}")
                continue
            _, word, chinese, examples, synonyms, antonyms = result
            word_id = str(uuid.uuid4())
            insert_word(conn, word_id, word, chinese, examples, synonyms, antonyms)
            done += 1
            if done % 10 == 0 or done == 1:
                print(f"已写入 {done}/{total_todo} 个，当前: {word}")

    conn.close()
    print(f"结束。完成 {done}，跳过 {skipped}，失败 {failed}，数据库: {args.db}")

    json_out = args.json or (PROJECT_ROOT / "static" / "pregen_vocab.json")
    export_conn = sqlite3.connect(str(args.db))
    export_db_to_json(export_conn, json_out)
    export_conn.close()
    print(f"已导出预生成词库: {json_out}")
    # 同步到构建输出目录，确保正在运行的 App 能读到最新文件
    for subdir in ["unpackage/dist/dev/app-plus", "unpackage/dist/build/app-plus"]:
        dest_dir = PROJECT_ROOT / subdir / "static"
        if dest_dir.exists():
            dest = dest_dir / "pregen_vocab.json"
            try:
                import shutil
                shutil.copy2(json_out, dest)
                print(f"已同步到: {dest}")
            except Exception as e:
                print(f"同步到 {dest} 失败: {e}")


def export_db_to_json(conn: sqlite3.Connection, out_path: Path) -> None:
    """将 words 表导出为 { "word_lower": { chinese, examples, synonyms, antonyms } }，供 App 本地优先使用。"""
    cur = conn.execute(
        "SELECT english, chinese, examples, synonyms, antonyms FROM words"
    )
    rows = cur.fetchall()
    vocab = {}
    for (english, chinese, examples_json, synonyms_json, antonyms_json) in rows:
        if not english:
            continue
        key = english.strip().lower()
        try:
            examples = json.loads(examples_json) if examples_json else []
        except Exception:
            examples = []
        try:
            synonyms = json.loads(synonyms_json) if synonyms_json else []
        except Exception:
            synonyms = []
        try:
            antonyms = json.loads(antonyms_json) if antonyms_json else []
        except Exception:
            antonyms = []
        vocab[key] = {
            "chinese": (chinese or "").strip(),
            "examples": examples,
            "synonyms": synonyms,
            "antonyms": antonyms,
        }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(vocab, ensure_ascii=False), encoding="utf-8")
    print(f"导出 {len(vocab)} 条到 {out_path}")


if __name__ == "__main__":
    main()
