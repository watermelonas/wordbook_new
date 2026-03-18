from pathlib import Path
import shutil
import sqlite3


PROJECT = Path(__file__).resolve().parent.parent
STATIC = PROJECT / "static"
DEV_STATIC = PROJECT / "unpackage" / "dist" / "dev" / "app-plus" / "static"

BASE_DB = STATIC / "vocal_master_before_restore_20260313_202920.db"
REFINED_DB = STATIC / "vocal_master_backup.db"
OUTPUT_DB = STATIC / "vocal_master.db"
DEV_OUTPUT_DB = DEV_STATIC / "vocal_master.db"


def ensure_has_refined_column(conn: sqlite3.Connection):
    cols = [row[1] for row in conn.execute("PRAGMA table_info(vocab_master)").fetchall()]
    if "has_refined" not in cols:
        conn.execute("ALTER TABLE vocab_master ADD COLUMN has_refined INTEGER DEFAULT 0")
        conn.commit()


def main():
    if not BASE_DB.exists():
        raise SystemExit(f"未找到基础主库: {BASE_DB}")
    if not REFINED_DB.exists():
        raise SystemExit(f"未找到精修备份库: {REFINED_DB}")

    shutil.copy2(BASE_DB, OUTPUT_DB)
    print(f"已复制基础主库 -> {OUTPUT_DB}")

    conn = sqlite3.connect(str(OUTPUT_DB))
    ensure_has_refined_column(conn)
    refined_conn = sqlite3.connect(str(REFINED_DB))

    refined_cols = [row[1] for row in refined_conn.execute("PRAGMA table_info(vocab_master)").fetchall()]
    if "has_refined" in refined_cols:
        rows = refined_conn.execute(
            "SELECT english, chinese, data_json, has_refined FROM vocab_master"
        ).fetchall()
    else:
        rows = refined_conn.execute(
            "SELECT english, chinese, data_json, 0 AS has_refined FROM vocab_master"
        ).fetchall()

    conn.executemany(
        "UPDATE vocab_master SET chinese = ?, data_json = ?, has_refined = ? WHERE english = ?",
        [(row[1], row[2], int(row[3] or 0), row[0]) for row in rows],
    )
    conn.commit()

    vocab_count = conn.execute("SELECT COUNT(*) FROM vocab_master").fetchone()[0]
    stats_count = conn.execute("SELECT COUNT(*) FROM word_exam_stats").fetchone()[0]
    sent_count = conn.execute("SELECT COUNT(*) FROM word_exam_sentences").fetchone()[0]
    refined_count = conn.execute("SELECT COUNT(*) FROM vocab_master WHERE has_refined = 1").fetchone()[0]

    conn.close()
    refined_conn.close()

    print(f"合并完成: vocab={vocab_count}, stats={stats_count}, sentences={sent_count}, refined={refined_count}")

    if DEV_STATIC.exists():
        shutil.copy2(OUTPUT_DB, DEV_OUTPUT_DB)
        print(f"已同步到开发包: {DEV_OUTPUT_DB}")


if __name__ == "__main__":
    main()
