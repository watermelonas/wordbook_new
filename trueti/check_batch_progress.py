# -*- coding: utf-8 -*-
"""查看 batch_ai_vocab 进度：已写入多少词、总数、百分比。"""
from pathlib import Path

TRUETI = Path(__file__).resolve().parent
DB = TRUETI / "kaoyan_vocab.db"
TXT = TRUETI / "wordbooks" / "红宝书补全版.txt"

def main():
    if not DB.exists():
        print("尚未生成数据库，请先运行 batch_ai_vocab.py")
        return
    import sqlite3
    conn = sqlite3.connect(str(DB))
    done = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
    conn.close()
    total = len([l for l in TXT.read_text(encoding="utf-8").splitlines() if l.strip()])
    pct = (100.0 * done / total) if total else 0
    print(f"已写入: {done} / {total} 个单词 ({pct:.1f}%)")
    if done > 0:
        conn = sqlite3.connect(str(DB))
        last = conn.execute("SELECT english FROM words ORDER BY rowid DESC LIMIT 1").fetchone()
        conn.close()
        print(f"当前最后一条: {last[0] if last else '-'}")

if __name__ == "__main__":
    main()
