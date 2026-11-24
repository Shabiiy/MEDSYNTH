import csv
import io
import json
import logging
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Tuple
import pandas as pd
from fastapi import UploadFile, HTTPException, status
from backend.app.config import get_settings
from backend.app.schemas.dataset import (
    DatasetSummary,
    DatasetDetailResponse,
    DatasetListResponse,
    DatasetPreviewResponse,
    DatasetColumnInfo,
)
from backend.app.services.dataset_repository import dataset_repository
from backend.app.services.inspection_service import inspection_service

logger = logging.getLogger(__name__)


class DatasetService:
    """Orchestrates CSV dataset intake, storage, retrieval, and validation."""

    def __init__(self):
        self.settings = get_settings()

    async def upload_csv(
        self, file: UploadFile, custom_name: Optional[str] = None
    ) -> DatasetSummary:
        """Validate, store, profile, and register an incoming CSV file."""
        original_filename = file.filename or "dataset.csv"

        # 1. Validate file extension
        if not original_filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension for '{original_filename}'. Only standard .csv files are supported."
            )

        # 2. Read in chunks to enforce 50 MB bounded memory limit
        max_size = self.settings.MAX_UPLOAD_SIZE_BYTES
        temp_buffer = bytearray()
        bytes_read = 0
        chunk_size = 64 * 1024  # 64 KB chunks

        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            bytes_read += len(chunk)
            if bytes_read > max_size:
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail=f"File exceeds maximum allowed upload size of 50 MB ({max_size} bytes)."
                )
            temp_buffer.extend(chunk)

        if bytes_read == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes). Please upload a valid CSV file."
            )

        # 3. Detect text encoding
        encoding = self._detect_encoding(temp_buffer)
        try:
            content_text = temp_buffer.decode(encoding)
        except Exception:
            try:
                content_text = temp_buffer.decode("latin-1")
                encoding = "latin-1"
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to decode CSV content with standard encodings: {str(e)}"
                )

        # Safely strip any leading UTF-8 BOM character from decoded text
        content_text = content_text.lstrip("\ufeff")

        # 4. Validate CSV structure & content
        sample_snippet = content_text.lstrip()[:16384]
        delimiter = self._sniff_delimiter(sample_snippet)

        try:
            # Check structure using csv reader
            reader = csv.reader(io.StringIO(content_text), delimiter=delimiter)

            # Skip any leading empty lines to find the true header row
            header = None
            for row in reader:
                if row and any(str(cell).strip() for cell in row):
                    header = row
                    break

            if not header:
                logger.info(
                    "Dataset upload diagnostic: filename=%s, byte_length=%d, detected_encoding=%s, parsed_header_count=0",
                    original_filename, bytes_read, encoding
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Malformed CSV: No column headers detected."
                )

            # Strip whitespace and quotes from headers
            cleaned_headers = [str(col).strip() for col in header if str(col).strip()]
            header_count = len(cleaned_headers)

            # Log safe diagnostic without logging dataset row contents
            logger.info(
                "Dataset upload diagnostic: filename=%s, byte_length=%d, detected_encoding=%s, parsed_header_count=%d",
                original_filename, bytes_read, encoding, header_count
            )

            if header_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Malformed CSV: Header contains no valid, usable column names."
                )

            # Ensure there is at least one data row, skipping any blank rows
            first_data_row = None
            for row in reader:
                if row and any(str(cell).strip() for cell in row):
                    first_data_row = row
                    break

            if not first_data_row:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CSV contains header columns but no data rows (empty dataset)."
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Malformed CSV syntax or parsing error: {str(e)}"
            )

        # 5. Create safe storage path (isolated server-controlled path)
        dataset_id = f"ds_{uuid.uuid4().hex[:12]}"
        dataset_dir = self.settings.datasets_dir / dataset_id
        dataset_dir.mkdir(parents=True, exist_ok=True)
        storage_file = dataset_dir / "original.csv"

        with open(storage_file, "wb") as f:
            f.write(temp_buffer)

        # 6. Profile the saved dataset
        try:
            profile = inspection_service.profile_csv(storage_file)
        except Exception as e:
            # Cleanup on failure
            shutil.rmtree(dataset_dir, ignore_errors=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to compute statistical profile for uploaded CSV: {str(e)}"
            )

        # 7. Persist metadata into SQLite registry
        now_iso = datetime.now(timezone.utc).isoformat()
        display_name = custom_name.strip() if custom_name and custom_name.strip() else original_filename

        record = {
            "id": dataset_id,
            "name": display_name,
            "filename": original_filename,
            "storage_path": str(storage_file),
            "file_size_bytes": bytes_read,
            "row_count": profile.row_count,
            "column_count": profile.column_count,
            "columns_json": json.dumps([c.model_dump() for c in profile.columns]),
            "status": "ready",
            "is_derived": 0,
            "parent_dataset_id": None,
            "preprocessing_config": None,
            "artifact_path": None,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        created = dataset_repository.create(record)

        return DatasetSummary(
            id=created["id"],
            name=created["name"],
            filename=created["filename"],
            file_size_bytes=created["file_size_bytes"],
            row_count=created["row_count"],
            column_count=created["column_count"],
            status=created["status"],
            is_derived=created["is_derived"],
            parent_dataset_id=created["parent_dataset_id"],
            created_at=created["created_at"],
            updated_at=created["updated_at"]
        )

    def list_datasets(self, page: int = 1, page_size: int = 10) -> DatasetListResponse:
        """List paginated datasets."""
        page = max(1, page)
        page_size = min(max(1, page_size), 50)
        items, total = dataset_repository.list_datasets(page, page_size)
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        summaries = [
            DatasetSummary(
                id=item["id"],
                name=item["name"],
                filename=item["filename"],
                file_size_bytes=item["file_size_bytes"],
                row_count=item["row_count"],
                column_count=item["column_count"],
                status=item["status"],
                is_derived=item["is_derived"],
                parent_dataset_id=item["parent_dataset_id"],
                created_at=item["created_at"],
                updated_at=item["updated_at"]
            )
            for item in items
        ]

        return DatasetListResponse(
            items=summaries,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    def get_dataset_detail(self, dataset_id: str) -> DatasetDetailResponse:
        """Fetch full details and compute updated statistical profile for a dataset."""
        record = dataset_repository.get_by_id(dataset_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset with ID '{dataset_id}' was not found in the registry."
            )

        storage_path = Path(record["storage_path"])
        if not storage_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset file '{record['filename']}' is missing from local storage."
            )

        profile = inspection_service.profile_csv(storage_path)

        summary = DatasetSummary(
            id=record["id"],
            name=record["name"],
            filename=record["filename"],
            file_size_bytes=record["file_size_bytes"],
            row_count=record["row_count"],
            column_count=record["column_count"],
            status=record["status"],
            is_derived=record["is_derived"],
            parent_dataset_id=record["parent_dataset_id"],
            created_at=record["created_at"],
            updated_at=record["updated_at"]
        )

        return DatasetDetailResponse(
            dataset=summary,
            columns=profile.columns,
            profile=profile,
            preprocessing_config=record.get("preprocessing_config")
        )

    def get_dataset_preview(
        self, dataset_id: str, offset: int = 0, limit: int = 20
    ) -> DatasetPreviewResponse:
        """Fetch paginated preview rows from a dataset."""
        record = dataset_repository.get_by_id(dataset_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset with ID '{dataset_id}' was not found."
            )

        storage_path = Path(record["storage_path"])
        if not storage_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset file is missing from local storage."
            )

        offset = max(0, offset)
        limit = min(max(1, limit), self.settings.MAX_PREVIEW_ROWS)

        try:
            df = pd.read_csv(storage_path, low_memory=False)
        except UnicodeDecodeError:
            df = pd.read_csv(storage_path, encoding="latin-1", low_memory=False)

        total_rows = len(df)
        columns = [str(c) for c in df.columns]

        # Extract column types
        column_types = {}
        for c in df.columns:
            column_types[str(c)] = inspection_service._infer_column_type(df[c])

        # Slice rows
        slice_df = df.iloc[offset : offset + limit]
        
        # Clean null values and NaN for JSON
        rows = []
        for _, row_series in slice_df.iterrows():
            row_dict = {}
            for col in columns:
                val = row_series[col]
                row_dict[col] = inspection_service._safe_json_value(val)
            rows.append(row_dict)

        return DatasetPreviewResponse(
            dataset_id=dataset_id,
            columns=columns,
            column_types=column_types,
            rows=rows,
            total_rows=total_rows,
            offset=offset,
            limit=limit
        )

    def delete_dataset(self, dataset_id: str) -> bool:
        """Safely delete dataset, preventing arbitrary filesystem traversal."""
        record = dataset_repository.get_by_id(dataset_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset with ID '{dataset_id}' was not found."
            )

        # Validate path is inside datasets directory to prevent path traversal
        storage_path = Path(record["storage_path"]).resolve()
        safe_base = self.settings.datasets_dir.resolve()

        if not str(storage_path).startswith(str(safe_base)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Storage path resides outside datasets directory."
            )

        # Remove dataset folder
        dataset_folder = storage_path.parent
        if dataset_folder.exists() and dataset_folder.is_dir() and str(dataset_folder).startswith(str(safe_base)):
            shutil.rmtree(dataset_folder, ignore_errors=True)

        # Delete database record
        dataset_repository.delete(dataset_id)
        return True

    def _detect_encoding(self, buffer: bytearray) -> str:
        """Detect standard UTF-8 / UTF-8 with BOM."""
        if buffer.startswith(b"\xef\xbb\xbf"):
            return "utf-8-sig"
        try:
            buffer[:65536].decode("utf-8")
            return "utf-8"
        except UnicodeDecodeError:
            return "latin-1"

    def _sniff_delimiter(self, sample_text: str) -> str:
        """Sniff delimiter from sample, falling back to comma."""
        try:
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample_text, delimiters=",\t;|")
            return dialect.delimiter
        except Exception:
            return ","


dataset_service = DatasetService()
