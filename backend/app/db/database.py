import sqlite3
import threading
from pathlib import Path
from backend.app.config import get_settings

_db_lock = threading.Lock()


def get_db_connection(db_path: Path | None = None) -> sqlite3.Connection:
    """Get a SQLite connection with row factory configured."""
    if db_path is None:
        db_path = get_settings().database_path
    
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Path | None = None) -> None:
    """Initialize the SQLite schema for datasets registry."""
    with _db_lock:
        conn = get_db_connection(db_path)
        try:
            with conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS datasets (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        filename TEXT NOT NULL,
                        storage_path TEXT NOT NULL,
                        file_size_bytes INTEGER NOT NULL,
                        row_count INTEGER NOT NULL,
                        column_count INTEGER NOT NULL,
                        columns_json TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'ready',
                        is_derived INTEGER NOT NULL DEFAULT 0,
                        parent_dataset_id TEXT,
                        preprocessing_config TEXT,
                        artifact_path TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY (parent_dataset_id) REFERENCES datasets(id) ON DELETE SET NULL
                    );
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at);")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_datasets_parent ON datasets(parent_dataset_id);")
        finally:
            conn.close()
