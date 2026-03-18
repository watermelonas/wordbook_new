import json
import sqlite3
from pathlib import Path

FILES = [
    Path(r"e:\vocal\wordbook_new\static\vocal_master.db"),
    Path(r"e:\vocal\wordbook_new\static\vocal_master_backup.db"),
    Path(r"e:\vocal\wordbook_new\unpackage\dist\dev\app-plus\static\vocal_master.db"),
    Path(r"e:\vocal\wordbook_new\unpackage\dist\dev\app-plus\static\vocal_master_backup.db"),
]


def inspect_db(path: Path):
    print(f"\nFILE: {path}")
    if not path.exists():
        print("missing")
        return
    print(f"size: {path.stat().st_size}")
    conn = sqlite3.connect(str(path))
    cols = [row[1] for row in conn.execute("PRAGMA table_info(vocab_master)").fetchall()]
    has_refined = "has_refined" in cols
    refined_count = conn.execute("SELECT COUNT(*) FROM vocab_master WHERE has_refined = 1").fetchone()[0] if has_refined else "NO_COL"
    print(f"has_refined_col: {has_refined}")
    print(f"refined_count: {refined_count}")

    row = conn.execute(
        "SELECT english, chinese, data_json FROM vocab_master WHERE data_json IS NOT NULL AND length(data_json) > 2 LIMIT 1"
    ).fetchone()
    if row:
        english, chinese, raw = row
        try:
            data = json.loads(raw or "{}")
        except Exception:
            data = {}
        print(f"sample_word: {english}")
        print(f"sample_chinese: {(chinese or '')[:80]}")
        print(f"sample_keys: {list(data.keys())[:10]}")
        print(f"sample_defs_len: {len(data.get('defs') or [])}")
        print(f"sample_exam_tip: {(data.get('exam_tip') or '')[:80]}")

    if has_refined:
        rows = conn.execute(
            "SELECT english, chinese, data_json FROM vocab_master WHERE has_refined = 1 LIMIT 3"
        ).fetchall()
        print(f"refined_rows_preview: {len(rows)}")
        for english, chinese, raw in rows:
            try:
                data = json.loads(raw or "{}")
            except Exception:
                data = {}
            print(f"  WORD: {english}")
            print(f"    chinese: {(chinese or '')[:60]}")
            print(f"    defs: {(data.get('defs') or [])[:2]}")
            print(f"    exam_tip: {(data.get('exam_tip') or '')[:60]}")
    conn.close()


for file in FILES:
    inspect_db(file)
