"""
db.py — SQLite + FTS5 schema setup.
Role 2 owns seed_memories.py and recall_events logging on retrieval.
Role 1 owns this file (scaffold) and hands off DB path to all.
"""
import sqlite3
import json
import os
from pathlib import Path

DB_PATH = Path(os.environ.get("MISTAKEMEMO_DB", "mistakememo.db"))


def get_conn() -> sqlite3.Connection:
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn
    except sqlite3.DatabaseError as e:
        if "file is not a database" in str(e) or "disk I/O error" in str(e):
            print(f"[db] Invalid/corrupted DB at {DB_PATH}. Resetting database file...")
            if DB_PATH.exists():
                try:
                    DB_PATH.unlink()
                except Exception:
                    pass
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")
            return conn
        raise e


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # Main experiences table (locked schema from BUILD_PLAN.md)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS experiences (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        scope                 TEXT NOT NULL DEFAULT 'project',  -- project|ai|universal
        title                 TEXT NOT NULL DEFAULT '',
        problem_summary       TEXT NOT NULL DEFAULT '',
        symptoms              TEXT NOT NULL DEFAULT '[]',       -- json array
        error_codes           TEXT NOT NULL DEFAULT '[]',       -- json array
        context               TEXT NOT NULL DEFAULT '{}',       -- json: language, framework[], libraries[], env
        category              TEXT NOT NULL DEFAULT 'other',
        technologies          TEXT NOT NULL DEFAULT '[]',       -- json array
        patterns              TEXT NOT NULL DEFAULT '[]',       -- json array
        hypotheses            TEXT NOT NULL DEFAULT '[]',       -- json array
        attempts              TEXT NOT NULL DEFAULT '[]',       -- json array
        failed_approaches     TEXT NOT NULL DEFAULT '[]',       -- json array
        successful_approach   TEXT NOT NULL DEFAULT '',
        root_cause            TEXT NOT NULL DEFAULT '',
        solution              TEXT NOT NULL DEFAULT '',
        verification          TEXT NOT NULL DEFAULT '{}',       -- json: {passed, failed}
        lesson                TEXT NOT NULL DEFAULT '',
        recommended_next_action TEXT NOT NULL DEFAULT '',
        confidence            REAL NOT NULL DEFAULT 0.0,
        project               TEXT NOT NULL DEFAULT '',
        source                TEXT NOT NULL DEFAULT 'manual',   -- autocapture|manual|import|seed
        embedding             BLOB,                             -- 384 float32 bytes
        created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # FTS5 virtual table for lexical search
    cur.execute("""
    CREATE VIRTUAL TABLE IF NOT EXISTS experiences_fts USING fts5(
        problem_summary,
        symptoms,
        lesson,
        patterns,
        content='experiences',
        content_rowid='id'
    )
    """)

    # Triggers to keep FTS5 in sync
    cur.execute("""
    CREATE TRIGGER IF NOT EXISTS experiences_ai AFTER INSERT ON experiences BEGIN
        INSERT INTO experiences_fts(rowid, problem_summary, symptoms, lesson, patterns)
        VALUES (new.id, new.problem_summary, new.symptoms, new.lesson, new.patterns);
    END
    """)
    cur.execute("""
    CREATE TRIGGER IF NOT EXISTS experiences_au AFTER UPDATE ON experiences BEGIN
        INSERT INTO experiences_fts(experiences_fts, rowid, problem_summary, symptoms, lesson, patterns)
        VALUES ('delete', old.id, old.problem_summary, old.symptoms, old.lesson, old.patterns);
        INSERT INTO experiences_fts(rowid, problem_summary, symptoms, lesson, patterns)
        VALUES (new.id, new.problem_summary, new.symptoms, new.lesson, new.patterns);
    END
    """)
    cur.execute("""
    CREATE TRIGGER IF NOT EXISTS experiences_ad AFTER DELETE ON experiences BEGIN
        INSERT INTO experiences_fts(experiences_fts, rowid, problem_summary, symptoms, lesson, patterns)
        VALUES ('delete', old.id, old.problem_summary, old.symptoms, old.lesson, old.patterns);
    END
    """)

    # recall_events table — Role 2 writes to this on every retrieval
    cur.execute("""
    CREATE TABLE IF NOT EXISTS recall_events (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        query             TEXT NOT NULL DEFAULT '',
        experience_id     INTEGER REFERENCES experiences(id),
        retrieval_score   REAL NOT NULL DEFAULT 0.0,
        feature_breakdown TEXT NOT NULL DEFAULT '{}',  -- json
        used_in_report    INTEGER NOT NULL DEFAULT 0,  -- bool
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # sessions table — tracks capture sessions
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id                         INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace                  TEXT NOT NULL DEFAULT '',
        source                     TEXT NOT NULL DEFAULT 'live',  -- live|import
        started_at                 DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at                   DATETIME,
        capture_enabled            INTEGER NOT NULL DEFAULT 1,    -- bool
        extracted_experience_count INTEGER NOT NULL DEFAULT 0
    )
    """)

    conn.commit()
    count = cur.execute("SELECT COUNT(*) FROM experiences").fetchone()[0]
    conn.close()
    print(f"[db] Initialized at {DB_PATH.resolve()} (total items: {count})")

    if count == 0:
        try:
            from seed.seed_memories import run_seed
            run_seed()
        except Exception as err:
            print(f"[db] Auto-seed warning: {err}")
