import json
import sqlite3
from pathlib import Path

WORD = "inexorable"

DBS = [
    ("static_master", Path(r"e:\vocal\wordbook_new\static\vocal_master.db"), "vocab_master"),
    ("static_backup", Path(r"e:\vocal\wordbook_new\static\vocal_master_backup.db"), "vocab_master"),
    ("static_before_restore", Path(r"e:\vocal\wordbook_new\static\vocal_master_before_restore_20260313_202920.db"), "vocab_master"),
    ("dev_master", Path(r"e:\vocal\wordbook_new\unpackage\dist\dev\app-plus\static\vocal_master.db"), "vocab_master"),
    ("kaoyan_vocab", Path(r"e:\vocal\wordbook_new\trueti\kaoyan_vocab.db"), "words"),
]


def inspect_vocab_master(path: Path):
    conn = sqlite3.connect(str(path))
    cols = [row[1] for row in conn.execute("PRAGMA table_info(vocab_master)").fetchall()]
    has_refined = "has_refined" in cols
    sql = "SELECT english, chinese, data_json{} FROM vocab_master WHERE english = ? LIMIT 1".format(
        ", has_refined" if has_refined else ""
    )
    row = conn.execute(sql, (WORD,)).fetchone()
    if not row:
      print("  missing")
      conn.close()
      return
    english, chinese, data_json, *rest = row
    has_refined_val = rest[0] if rest else None
    data = json.loads(data_json or "{}")
    print(f"  english: {english}")
    print(f"  chinese: {chinese}")
    if has_refined:
        print(f"  has_refined: {has_refined_val}")
    print(f"  keys: {list(data.keys())}")
    defs = data.get("defs") or []
    print(f"  defs_count: {len(defs)}")
    for i, item in enumerate(defs[:5]):
        print(f"    [{i}] pos={item.get('pos')} type={item.get('type')} trans={item.get('trans')}")
    print(f"  exam_tip: {data.get('exam_tip')}")
    print(f"  sentiment: {data.get('sentiment')}")
    ex = data.get("examples") or []
    sy = data.get("synonyms") or []
    an = data.get("antonyms") or []
    print(f"  examples={len(ex)} synonyms={len(sy)} antonyms={len(an)}")
    conn.close()


def inspect_kaoyan(path: Path):
    conn = sqlite3.connect(str(path))
    row = conn.execute(
        "SELECT english, chinese, examples, synonyms, antonyms FROM words WHERE english = ? LIMIT 1",
        (WORD,),
    ).fetchone()
    if not row:
        print("  missing")
        conn.close()
        return
    english, chinese, examples, synonyms, antonyms = row
    print(f"  english: {english}")
    print(f"  chinese: {chinese}")
    try:
        examples = json.loads(examples or "[]")
    except Exception:
        examples = []
    try:
        synonyms = json.loads(synonyms or "[]")
    except Exception:
        synonyms = []
    try:
        antonyms = json.loads(antonyms or "[]")
    except Exception:
        antonyms = []
    print(f"  examples={len(examples)} synonyms={len(synonyms)} antonyms={len(antonyms)}")
    conn.close()


for name, path, kind in DBS:
    print(f"\n== {name} ==")
    print(path)
    if not path.exists():
        print("  file missing")
        continue
    if kind == "vocab_master":
        inspect_vocab_master(path)
    else:
        inspect_kaoyan(path)
