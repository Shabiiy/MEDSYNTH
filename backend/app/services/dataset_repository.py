import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from backend.app.db.database import get_db_connection, init_db


class DatasetRepository:
    """Persistent SQLite repository for dataset metadata."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path
        init_db(self.db_path)

    def create(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new dataset record."""
        conn = get_db_connection(self.db_path)
        try:
            with conn:
                conn.execute(
                    """
                    INSERT INTO datasets (
                        id, name, filename, storage_path, file_size_bytes,
                        row_count, column_count, columns_json, status,
                        is_derived, parent_dataset_id, preprocessing_config,
                        artifact_path, created_at, updated_at
                    ) VALUES (
                        :id, :name, :filename, :storage_path, :file_size_bytes,
                        :row_count, :column_count, :columns_json, :status,
                        :is_derived, :parent_dataset_id, :preprocessing_config,
                        :artifact_path, :created_at, :updated_at
                    )
                    """,
                    record
                )
            return self.get_by_id(record["id"])  # type: ignore
        finally:
            conn.close()

    def get_by_id(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a dataset by ID."""
        conn = get_db_connection(self.db_path)
        try:
            cursor = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_dict(row)
        finally:
            conn.close()

    def list_datasets(self, page: int = 1, page_size: int = 10) -> Tuple[List[Dict[str, Any]], int]:
        """List paginated datasets ordered by created_at DESC."""
        conn = get_db_connection(self.db_path)
        try:
            # Get total count
            count_cursor = conn.execute("SELECT COUNT(*) FROM datasets")
            total = count_cursor.fetchone()[0]

            offset = (page - 1) * page_size
            cursor = conn.execute(
                "SELECT * FROM datasets ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (page_size, offset)
            )
            items = [self._row_to_dict(row) for row in cursor.fetchall()]
            return items, total
        finally:
            conn.close()

    def count(self) -> int:
        """Count total non-deleted datasets."""
        conn = get_db_connection(self.db_path)
        try:
            cursor = conn.execute("SELECT COUNT(*) FROM datasets")
            return cursor.fetchone()[0]
        finally:
            conn.close()

    def delete(self, dataset_id: str) -> bool:
        """Delete a dataset from SQLite."""
        conn = get_db_connection(self.db_path)
        try:
            with conn:
                cursor = conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
                return cursor.rowcount > 0
        finally:
            conn.close()

    def update_status(self, dataset_id: str, status: str) -> bool:
        """Update dataset processing status."""
        conn = get_db_connection(self.db_path)
        try:
            with conn:
                now = datetime.now(timezone.utc).isoformat()
                cursor = conn.execute(
                    "UPDATE datasets SET status = ?, updated_at = ? WHERE id = ?",
                    (status, now, dataset_id)
                )
                return cursor.rowcount > 0
        finally:
            conn.close()

    def _row_to_dict(self, row) -> Dict[str, Any]:
        """Convert SQLite Row to dictionary with parsed JSON fields."""
        data = dict(row)
        data["is_derived"] = bool(data["is_derived"])
        if data.get("columns_json"):
            try:
                data["columns"] = json.loads(data["columns_json"])
            except Exception:
                data["columns"] = []
        else:
            data["columns"] = []

        if data.get("preprocessing_config"):
            try:
                data["preprocessing_config"] = json.loads(data["preprocessing_config"])
            except Exception:
                data["preprocessing_config"] = None
        else:
            data["preprocessing_config"] = None

        return data


dataset_repository = DatasetRepository()
