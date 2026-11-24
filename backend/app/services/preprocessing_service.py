import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
from fastapi import HTTPException, status
from backend.app.config import get_settings
from backend.app.schemas.dataset import PreprocessingRequest, PreprocessingResult
from backend.app.services.dataset_repository import dataset_repository
from backend.app.services.inspection_service import inspection_service


class PreprocessingService:
    """Executes tabular transformations, recording scaler parameters and mappings."""

    def __init__(self):
        self.settings = get_settings()

    def preprocess_dataset(
        self, parent_dataset_id: str, request: PreprocessingRequest
    ) -> PreprocessingResult:
        """Apply requested transformations and persist as a new derived dataset."""
        parent_record = dataset_repository.get_by_id(parent_dataset_id)
        if not parent_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset with ID '{parent_dataset_id}' not found."
            )

        source_file = Path(parent_record["storage_path"])
        if not source_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source file for dataset '{parent_dataset_id}' not found on disk."
            )

        # Read original dataset
        try:
            df = pd.read_csv(source_file, low_memory=False)
        except UnicodeDecodeError:
            df = pd.read_csv(source_file, encoding="latin-1", low_memory=False)

        original_rows = len(df)
        original_cols = len(df.columns)
        transformations_applied: List[str] = []
        transformation_metadata: Dict[str, Any] = {
            "scalers": {},
            "encodings": {},
            "imputations": {}
        }

        # 1. Column Selection / Filtering
        if request.selected_columns:
            valid_cols = [c for c in request.selected_columns if c in df.columns]
            if len(valid_cols) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="None of the requested selected columns exist in the dataset."
                )
            df = df[valid_cols].copy()
            transformations_applied.append(f"Retained {len(valid_cols)} of {original_cols} columns")

        # 2. Duplicate Removal
        if request.drop_duplicates:
            dup_count = int(df.duplicated().sum())
            if dup_count > 0:
                df = df.drop_duplicates().reset_index(drop=True)
                transformations_applied.append(f"Dropped {dup_count} duplicate rows")

        # 3. Missing Value Handling
        strategy = request.missing_value_strategy.lower()
        if strategy == "drop_rows":
            rows_before = len(df)
            df = df.dropna().reset_index(drop=True)
            dropped = rows_before - len(df)
            transformations_applied.append(f"Dropped {dropped} rows with missing values")
        elif strategy in ["mean", "median"]:
            for col in df.columns:
                if pd.api.types.is_numeric_dtype(df[col]) and df[col].isna().any():
                    if strategy == "mean":
                        fill_val = float(df[col].mean())
                    else:
                        fill_val = float(df[col].median())
                    df[col] = df[col].fillna(fill_val)
                    transformation_metadata["imputations"][col] = {
                        "strategy": strategy,
                        "value": round(fill_val, 4)
                    }
            transformations_applied.append(f"Imputed missing numeric values using {strategy}")
        elif strategy == "mode":
            for col in df.columns:
                if df[col].isna().any():
                    modes = df[col].mode()
                    fill_val = modes.iloc[0] if len(modes) > 0 else "Unknown"
                    df[col] = df[col].fillna(fill_val)
                    transformation_metadata["imputations"][col] = {
                        "strategy": "mode",
                        "value": str(fill_val)
                    }
            transformations_applied.append("Imputed missing values using column mode (most frequent)")
        elif strategy == "constant":
            const_val = request.missing_value_constant if request.missing_value_constant is not None else 0
            df = df.fillna(const_val)
            transformations_applied.append(f"Imputed missing values using constant '{const_val}'")

        # 4. Numeric Normalization / Scaling
        scaling = request.numeric_scaling.lower()
        if scaling in ["minmax", "standard", "robust"]:
            target_cols = request.scaling_columns or [
                c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])
            ]
            for col in target_cols:
                if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                    series = df[col].astype(float)
                    if scaling == "minmax":
                        c_min = float(series.min())
                        c_max = float(series.max())
                        denom = (c_max - c_min) if (c_max - c_min) != 0 else 1.0
                        df[col] = (series - c_min) / denom
                        transformation_metadata["scalers"][col] = {
                            "type": "minmax",
                            "min": round(c_min, 4),
                            "max": round(c_max, 4)
                        }
                    elif scaling == "standard":
                        c_mean = float(series.mean())
                        c_std = float(series.std()) if len(series) > 1 else 1.0
                        c_std = c_std if c_std != 0 else 1.0
                        df[col] = (series - c_mean) / c_std
                        transformation_metadata["scalers"][col] = {
                            "type": "standard",
                            "mean": round(c_mean, 4),
                            "std": round(c_std, 4)
                        }
                    elif scaling == "robust":
                        c_med = float(series.median())
                        q25 = float(series.quantile(0.25))
                        q75 = float(series.quantile(0.75))
                        iqr = (q75 - q25) if (q75 - q25) != 0 else 1.0
                        df[col] = (series - c_med) / iqr
                        transformation_metadata["scalers"][col] = {
                            "type": "robust",
                            "median": round(c_med, 4),
                            "iqr": round(iqr, 4)
                        }
            transformations_applied.append(f"Applied {scaling} scaling to {len(target_cols)} numeric columns")

        # 5. Categorical Encoding
        encoding = request.categorical_encoding.lower()
        if encoding == "label":
            target_cols = request.encoding_columns or [
                c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])
            ]
            for col in target_cols:
                if col in df.columns:
                    unique_categories = sorted(df[col].dropna().astype(str).unique().tolist())
                    cat_map = {cat: idx for idx, cat in enumerate(unique_categories)}
                    df[col] = df[col].astype(str).map(cat_map).fillna(-1).astype(int)
                    transformation_metadata["encodings"][col] = {
                        "type": "label",
                        "mapping": cat_map
                    }
            transformations_applied.append(f"Applied label encoding to {len(target_cols)} categorical columns")
        elif encoding == "onehot":
            target_cols = request.encoding_columns or [
                c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])
            ]
            cols_to_encode = [c for c in target_cols if c in df.columns]
            if cols_to_encode:
                df = pd.get_dummies(df, columns=cols_to_encode, drop_first=False, dtype=int)
                transformations_applied.append(f"Applied one-hot encoding to {len(cols_to_encode)} columns")

        final_rows = len(df)
        final_cols = len(df.columns)
        dropped_rows = original_rows - final_rows
        dropped_columns = original_cols - final_cols

        # 6. Save derived CSV artifact
        derived_id = f"ds_prep_{uuid.uuid4().hex[:10]}"
        derived_dir = self.settings.datasets_dir / derived_id
        derived_dir.mkdir(parents=True, exist_ok=True)
        artifact_path = derived_dir / "preprocessed.csv"
        df.to_csv(artifact_path, index=False)

        # Profile the derived dataset
        derived_profile = inspection_service.profile_csv(artifact_path)
        now_iso = datetime.now(timezone.utc).isoformat()
        derived_name = f"preprocessed_{parent_record['name']}"

        # Register in SQLite
        derived_record = {
            "id": derived_id,
            "name": derived_name,
            "filename": "preprocessed.csv",
            "storage_path": str(artifact_path),
            "file_size_bytes": artifact_path.stat().st_size,
            "row_count": final_rows,
            "column_count": final_cols,
            "columns_json": json.dumps([c.model_dump() for c in derived_profile.columns]),
            "status": "preprocessed",
            "is_derived": 1,
            "parent_dataset_id": parent_dataset_id,
            "preprocessing_config": json.dumps({
                "request": request.model_dump(),
                "transformations": transformations_applied,
                "metadata": transformation_metadata
            }),
            "artifact_path": str(artifact_path),
            "created_at": now_iso,
            "updated_at": now_iso
        }
        dataset_repository.create(derived_record)

        return PreprocessingResult(
            derived_dataset_id=derived_id,
            parent_dataset_id=parent_dataset_id,
            name=derived_name,
            original_rows=original_rows,
            final_rows=final_rows,
            original_columns=original_cols,
            final_columns=final_cols,
            transformations_applied=transformations_applied,
            dropped_rows=dropped_rows,
            dropped_columns=dropped_columns,
            created_at=now_iso,
            artifact_path=str(artifact_path)
        )


preprocessing_service = PreprocessingService()
