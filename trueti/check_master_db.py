# -*- coding: utf-8 -*-
import json
import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent / "static" / "vocal_master.db"
if not db_path.exists():
    print("vocal_master.db 不存在")
    raise SystemExit(1)
conn = sqlite3.connect(str(db_path))
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
indexes = conn.execute("SELECT name FROM sqlite_master WHERE type='index' ORDER BY name").fetchall()
print("tables:", [x[0] for x in tables])
print("indexes:", [x[0] for x in indexes])

vocab_count = conn.execute("SELECT count(*) FROM vocab_master").fetchone()[0]
stats_count = conn.execute("SELECT count(*) FROM word_exam_stats").fetchone()[0]
sent_count = conn.execute("SELECT count(*) FROM word_exam_sentences").fetchone()[0]
print("vocab_master 条数:", vocab_count)
print("word_exam_stats 条数:", stats_count)
print("word_exam_sentences 条数:", sent_count)

row = conn.execute("SELECT english, chinese, length(data_json) FROM vocab_master WHERE english='the' LIMIT 1").fetchone()
if row:
    print("the 行: english=%r, chinese_len=%s, data_json_len=%s" % (row[0], len(row[1] or ''), row[2]))
    full = conn.execute("SELECT data_json FROM vocab_master WHERE english='the' LIMIT 1").fetchone()
    if full and full[0]:
        print("data_json 前150字符:", full[0][:150])
stats = conn.execute("SELECT total_count, importance, tags_json FROM word_exam_stats WHERE english='the' LIMIT 1").fetchone()
if stats:
    print("the stats:", stats[0], stats[1], json.loads(stats[2] or "[]"))
sample_sent = conn.execute("SELECT year, section, exam_type, sentence FROM word_exam_sentences WHERE english='the' LIMIT 1").fetchone()
if sample_sent:
    print("the sentence sample:", sample_sent)
else:
    print("未找到 english='the' 的行")
conn.close()
