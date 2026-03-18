# -*- coding: utf-8 -*-
import sqlite3, json

conn = sqlite3.connect(r'e:\vocal\wordbook_new\static\vocal_master.db')
cursor = conn.cursor()

print('=== vocab_master columns ===')
cursor.execute('PRAGMA table_info(vocab_master)')
for row in cursor.fetchall():
    print(row)

print('\n=== Sample rows ===')
cursor.execute('SELECT english, chinese, data_json FROM vocab_master LIMIT 5')
rows = cursor.fetchall()
for r in rows:
    print(f'\n--- WORD: {r[0]} ---')
    print(f'chinese: {r[1]}')
    if r[2]:
        try:
            d = json.loads(r[2])
            print(f'data_json keys: {list(d.keys())}')
            if 'defs' in d:
                print('defs sample:')
                for def_item in d['defs'][:4]:
                    print(f'  {def_item}')
            if 'exam_tip' in d:
                print(f'exam_tip: {d["exam_tip"][:80]}')
            if 'sentiment' in d:
                print(f'sentiment: {d["sentiment"]}')
        except Exception as e:
            print(f'data_json parse error: {e}')
            print(f'raw: {r[2][:300]}')

conn.close()
print('\nDone.')
