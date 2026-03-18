import json
import sqlite3
from pathlib import Path

ROOTS = [
    Path(r"e:\vocal"),
    Path(r"C:\Users\roxy\.cursor\projects\e-vocal-wordbook-new"),
]


def inspect_db(path: Path):
    try:
        conn = sqlite3.connect(str(path))
        tables = [x[0] for x in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        if "vocab_master" not in tables:
            conn.close()
            return None
        cols = [r[1] for r in conn.execute("PRAGMA table_info(vocab_master)").fetchall()]
        has_refined = "has_refined" in cols
        refined = conn.execute("SELECT COUNT(*) FROM vocab_master WHERE has_refined = 1").fetchone()[0] if has_refined else -1
        total = conn.execute("SELECT COUNT(*) FROM vocab_master").fetchone()[0]
        row = conn.execute(
            "SELECT english, chinese, data_json FROM vocab_master WHERE data_json IS NOT NULL AND length(data_json) > 2 LIMIT 1"
        ).fetchone()
        sample_word = ""
        sample_defs = 0
        sample_tip = False
        if row:
            sample_word = row[0] or ""
            try:
                data = json.loads(row[2] or "{}")
            except Exception:
                data = {}
            sample_defs = len(data.get("defs") or [])
            sample_tip = bool(data.get("exam_tip"))
        conn.close()
        return {
            "path": str(path),
            "total": total,
            "refined": refined,
            "sample_word": sample_word,
            "sample_defs": sample_defs,
            "sample_tip": sample_tip,
            "has_refined": has_refined,
        }
    except Exception:
        return None


def main():
    seen = set()
    results = []
    for root in ROOTS:
        if not root.exists():
            continue
        for path in root.rglob("*.db"):
            resolved = str(path.resolve())
            if resolved in seen:
                continue
            seen.add(resolved)
            info = inspect_db(path)
            if info:
                results.append(info)

    results.sort(key=lambda x: (x["refined"], x["sample_defs"], x["total"]), reverse=True)
    for item in results:
        print(
            f'{item["path"]}\tTOTAL={item["total"]}\tREFINED={item["refined"]}\t'
            f'HAS_REFINED={int(item["has_refined"])}\tDEFS={item["sample_defs"]}\tTIP={int(item["sample_tip"])}\t'
            f'SAMPLE={item["sample_word"]}'
        )


if __name__ == "__main__":
    main()
