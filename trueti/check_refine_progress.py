# -*- coding: utf-8 -*-
"""
查看 refine_vocab_deepseek.py 精修进度：总词数、已精修数、待精修数、当前百分比，并检查有无遗漏。
用法：python trueti/check_refine_progress.py
      python trueti/check_refine_progress.py --sample   # 打印一条已精修词的 data_json 摘要
      python trueti/check_refine_progress.py --missing  # 仅检查遗漏（has_refined=1 但 defs 为空或无效）
"""
from pathlib import Path
import argparse
import json
import sqlite3

TRUETI = Path(__file__).resolve().parent
PROJECT = TRUETI.parent
MASTER_DB = PROJECT / "static" / "vocal_master.db"


def main():
    parser = argparse.ArgumentParser(description="查看 vocal_master 精修进度")
    parser.add_argument("--sample", action="store_true", help="打印一条已精修词的释义与 data_json 摘要")
    parser.add_argument("--missing", action="store_true", help="仅检查遗漏（已标精修但 defs 为空或无效）")
    args = parser.parse_args()

    if not MASTER_DB.exists():
        print(f"未找到 {MASTER_DB}")
        return 1

    conn = sqlite3.connect(str(MASTER_DB))
    cur = conn.execute("PRAGMA table_info(vocab_master)")
    cols = [row[1] for row in cur.fetchall()]

    if "has_refined" not in cols:
        print("表中尚无 has_refined 列，请先运行一次 refine_vocab_deepseek.py（可用 --limit 10 测试）")
        conn.close()
        return 0

    total = conn.execute("SELECT COUNT(*) FROM vocab_master").fetchone()[0]
    refined = conn.execute("SELECT COUNT(*) FROM vocab_master WHERE has_refined = 1").fetchone()[0]
    pending = conn.execute("SELECT COUNT(*) FROM vocab_master WHERE (has_refined IS NULL OR has_refined = 0)").fetchone()[0]

    pct = (refined / total * 100) if total else 0
    print(f"总词数: {total}")
    print(f"已精修: {refined}  待精修: {pending}")
    print(f"当前进度: {pct:.1f}%")

    if args.missing:
        missing = []
        cur = conn.execute("SELECT english, data_json FROM vocab_master WHERE has_refined = 1")
        for row in cur.fetchall():
            english, data_json = row[0], row[1]
            try:
                data = json.loads(data_json or "{}")
                defs = data.get("defs")
                if not isinstance(defs, list) or len(defs) == 0:
                    missing.append(english)
            except Exception:
                missing.append(english)
        if missing:
            print(f"\n遗漏（已标精修但 defs 为空或无效）: {len(missing)} 个")
            for w in missing[:30]:
                print(f"  {w}")
            if len(missing) > 30:
                print(f"  ... 共 {len(missing)} 个")
        else:
            print("\n无遗漏，所有已精修词均有有效 defs。")
        conn.close()
        return 0

    if args.sample and refined > 0:
        row = conn.execute(
            "SELECT english, chinese, data_json FROM vocab_master WHERE has_refined = 1 LIMIT 1"
        ).fetchone()
        if row:
            english, chinese, data_json = row
            print("\n--- 一条已精修样本 ---")
            print(f"english: {english}")
            print(f"chinese: {chinese[:80]}{'...' if len(chinese or '') > 80 else ''}")
            try:
                data = json.loads(data_json or "{}")
                defs = data.get("defs", [])
                print(f"defs 条数: {len(defs)}")
                for i, d in enumerate(defs[:3]):
                    print(f"  [{i}] pos={d.get('pos')} type={d.get('type')} trans={(d.get('trans') or '')[:50]}...")
                print(f"exam_tip: {(data.get('exam_tip') or '')[:60]}...")
                print(f"sentiment: {data.get('sentiment')}")
            except Exception as e:
                print(f"data_json 解析失败: {e}")

    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
