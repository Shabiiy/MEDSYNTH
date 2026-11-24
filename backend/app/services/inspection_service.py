import math
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Set
import numpy as np
import pandas as pd
from backend.app.schemas.dataset import (
    DatasetColumnInfo,
    NumericStats,
    CategoricalStats,
    CategoryFrequency,
    DataQualityWarning,
    DatasetProfile,
)

PII_PATTERNS = [
    r"name", r"patient_?name", r"first_?name", r"last_?name",
    r"ssn", r"social_?security", r"mrn", r"medical_?record",
    r"phone", r"telephone", r"email", r"address", r"zip_?code",
    r"dob", r"birth_?date", r"date_?of_?birth"
]

_IDENTIFIER_SUFFIXES = ("_id", "_code", "_key", "_num", "_number", "_index")
_IDENTIFIER_PREFIXES = ("id_",)
_IDENTIFIER_EXACT = {"id", "index", "row_id", "rowid"}

CORRELATION_NOTE = (
    "Correlation measures linear association between pairs of features using pairwise-complete "
    "observations. Correlation does not imply causation."
)


def _detect_identifier_columns(df: pd.DataFrame) -> Set[str]:
    """Detect columns that are likely identifiers via name and value heuristics."""
    identifiers: Set[str] = set()

    for col in df.columns:
        col_lower = str(col).lower()

        # Name-based heuristic
        name_match = (
            col_lower in _IDENTIFIER_EXACT
            or any(col_lower.endswith(s) for s in _IDENTIFIER_SUFFIXES)
            or any(col_lower.startswith(p) for p in _IDENTIFIER_PREFIXES)
        )

        # Value-based heuristic: all non-null values are unique.
        # Only applied to non-numeric (object/string) columns to avoid false-positives
        # on small numeric feature columns (e.g. age=[45,54,62,38,59] in a 5-row dataset).
        series = df[col]
        non_null = series.dropna()
        is_string_col = pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series)
        value_match = (
            is_string_col
            and len(non_null) > 0
            and non_null.nunique() == len(df)
        )

        if name_match or value_match:
            identifiers.add(str(col))

    return identifiers


class DatasetInspectionService:
    """Service to compute comprehensive statistical profiles and quality audits for tabular CSVs."""

    def profile_csv(self, file_path: Path) -> DatasetProfile:
        """Read CSV and generate complete statistical profile."""
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Read CSV with pandas
        try:
            df = pd.read_csv(file_path, low_memory=False)
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding="latin-1", low_memory=False)

        # Detect identifier columns early
        identifier_set = _detect_identifier_columns(df)

        total_rows = len(df)
        total_cols = len(df.columns)

        # Duplicate rows
        duplicate_rows = int(df.duplicated().sum()) if total_rows > 0 else 0
        duplicate_pct = round((duplicate_rows / total_rows * 100), 2) if total_rows > 0 else 0.0

        # Total missing cells
        total_cells = total_rows * total_cols
        total_missing = int(df.isna().sum().sum())
        overall_missing_pct = round((total_missing / total_cells * 100), 2) if total_cells > 0 else 0.0

        columns_info: List[DatasetColumnInfo] = []
        numeric_stats: Dict[str, NumericStats] = {}
        categorical_stats: Dict[str, CategoricalStats] = {}
        warnings: List[DataQualityWarning] = []

        # 1. Inspect each column
        for col_name in df.columns:
            series = df[col_name]
            inferred_type = self._infer_column_type(series)
            missing_count = int(series.isna().sum())
            missing_pct = round((missing_count / total_rows * 100), 2) if total_rows > 0 else 0.0

            # Non-null values for statistics
            valid_series = series.dropna()
            unique_count = int(valid_series.nunique())

            # Sample values (first 5 unique non-null values, json serializable)
            sample_vals = [
                self._safe_json_value(v)
                for v in valid_series.drop_duplicates().head(5).tolist()
            ]

            is_identifier = str(col_name) in identifier_set

            columns_info.append(
                DatasetColumnInfo(
                    name=str(col_name),
                    inferred_type=inferred_type,
                    missing_count=missing_count,
                    missing_percentage=missing_pct,
                    unique_count=unique_count,
                    sample_values=sample_vals,
                    is_likely_identifier=is_identifier,
                )
            )

            # Identifier column warning
            if is_identifier:
                warnings.append(
                    DataQualityWarning(
                        code="LIKELY_IDENTIFIER",
                        level="info",
                        column=str(col_name),
                        message=(
                            f"Column '{col_name}' appears to be an identifier "
                            "(excluded from distributions and correlations). "
                            "You can override this classification."
                        ),
                    )
                )

            # High missingness warning
            if missing_pct >= 50.0:
                warnings.append(
                    DataQualityWarning(
                        code="HIGH_MISSINGNESS_CRITICAL",
                        level="critical",
                        column=str(col_name),
                        message=f"Column '{col_name}' has {missing_pct}% missing values (≥50%). Imputation may distort distribution."
                    )
                )
            elif missing_pct >= 20.0:
                warnings.append(
                    DataQualityWarning(
                        code="HIGH_MISSINGNESS_WARNING",
                        level="warning",
                        column=str(col_name),
                        message=f"Column '{col_name}' has {missing_pct}% missing values (≥20%)."
                    )
                )

            # Constant column warning
            if unique_count == 1:
                warnings.append(
                    DataQualityWarning(
                        code="ZERO_VARIANCE",
                        level="warning",
                        column=str(col_name),
                        message=f"Column '{col_name}' contains a constant value with zero variance."
                    )
                )

            # Potential ID / High Cardinality warning (legacy, kept for non-identifier path)
            if not is_identifier and inferred_type in ["text", "categorical"] and total_rows > 20 and unique_count == total_rows:
                warnings.append(
                    DataQualityWarning(
                        code="HIGH_CARDINALITY_ID",
                        level="info",
                        column=str(col_name),
                        message=f"Column '{col_name}' has 100% unique values. It may be an arbitrary index or record identifier."
                    )
                )

            # PII Warning check
            col_lower = str(col_name).lower()
            for pii_pat in PII_PATTERNS:
                if re.search(pii_pat, col_lower):
                    warnings.append(
                        DataQualityWarning(
                            code="POTENTIAL_PII_IDENTIFIER",
                            level="warning",
                            column=str(col_name),
                            message=(
                                f"Potential identifiable attribute detected in column '{col_name}'. "
                                "Avoid uploading direct patient identifiers. Removing names alone does not guarantee anonymity."
                            )
                        )
                    )
                    break

            # Numeric statistics (skip identifiers)
            if not is_identifier and inferred_type == "numeric" and len(valid_series) > 0:
                numeric_stats[str(col_name)] = self._calculate_numeric_stats(valid_series)

            # Categorical statistics (skip identifiers)
            elif not is_identifier and inferred_type in ["categorical", "boolean"] and len(valid_series) > 0:
                categorical_stats[str(col_name)] = self._calculate_categorical_stats(valid_series, total_rows)

        # 2. Duplicate rows warning
        if duplicate_rows > 0:
            warnings.append(
                DataQualityWarning(
                    code="DUPLICATE_ROWS",
                    level="warning",
                    column=None,
                    message=f"Dataset contains {duplicate_rows} duplicate rows ({duplicate_pct}%)."
                )
            )

        # 3. Small cohort warning
        if total_rows < 50:
            warnings.append(
                DataQualityWarning(
                    code="SMALL_SAMPLE_SIZE",
                    level="warning",
                    column=None,
                    message=f"Sample size ({total_rows} rows) is very small. Generative models may overfit rare clinical traits."
                )
            )

        # 4. Correlation matrix for numeric columns (bounded to top 25 columns to avoid memory explosion)
        correlation_matrix = self._calculate_correlation_matrix(df, columns_info, identifier_set)

        return DatasetProfile(
            row_count=total_rows,
            column_count=total_cols,
            duplicate_rows=duplicate_rows,
            duplicate_percentage=duplicate_pct,
            total_missing_cells=total_missing,
            overall_missing_percentage=overall_missing_pct,
            columns=columns_info,
            numeric_stats=numeric_stats,
            categorical_stats=categorical_stats,
            correlation_matrix=correlation_matrix,
            warnings=warnings,
            identifier_columns=sorted(identifier_set),
            correlation_note=CORRELATION_NOTE,
        )

    def _infer_column_type(self, series: pd.Series) -> str:
        """Infer type among 'numeric', 'categorical', 'boolean', 'datetime', 'text'."""
        valid = series.dropna()
        if len(valid) == 0:
            return "categorical"

        if pd.api.types.is_bool_dtype(series):
            return "boolean"

        # Check boolean values represented as strings or numbers {0, 1}
        if pd.api.types.is_numeric_dtype(series):
            unique_vals = set(valid.unique())
            if unique_vals.issubset({0, 1}) and len(unique_vals) <= 2:
                # If named like is_*, has_*, flag, binary diagnosis, treat as boolean/categorical
                name_lower = str(series.name).lower()
                if name_lower.startswith(("is_", "has_", "flag_")) or name_lower in ["sex", "gender"]:
                    return "boolean"
            return "numeric"

        # Check if values are boolean strings
        str_vals = valid.astype(str).str.lower().str.strip()
        unique_str = set(str_vals.unique())
        if unique_str.issubset({"true", "false", "yes", "no", "t", "f", "1", "0"}) and len(unique_str) <= 2:
            return "boolean"

        # Check datetime
        if len(valid) > 0 and pd.api.types.is_string_dtype(series):
            first_sample = str(valid.iloc[0])
            if len(first_sample) >= 8 and any(char in first_sample for char in ["-", "/", ":"]):
                try:
                    pd.to_datetime(valid.head(20), errors="raise")
                    return "datetime"
                except Exception:
                    pass

        # Distinguish categorical vs free text
        unique_ratio = valid.nunique() / len(valid)
        if valid.nunique() <= 50 or unique_ratio < 0.2:
            return "categorical"

        return "text"

    def _calculate_numeric_stats(self, valid_series: pd.Series) -> NumericStats:
        """Compute standard numeric moments and quartiles."""
        try:
            numeric_vals = pd.to_numeric(valid_series, errors="coerce").dropna()
            if len(numeric_vals) == 0:
                return NumericStats(count=0)

            mean_val = float(numeric_vals.mean())
            std_val = float(numeric_vals.std()) if len(numeric_vals) > 1 else 0.0
            min_val = float(numeric_vals.min())
            q25_val = float(numeric_vals.quantile(0.25))
            median_val = float(numeric_vals.median())
            q75_val = float(numeric_vals.quantile(0.75))
            max_val = float(numeric_vals.max())

            return NumericStats(
                count=int(len(numeric_vals)),
                mean=self._clean_float(mean_val),
                std=self._clean_float(std_val),
                min=self._clean_float(min_val),
                q25=self._clean_float(q25_val),
                median=self._clean_float(median_val),
                q75=self._clean_float(q75_val),
                max=self._clean_float(max_val),
            )
        except Exception:
            return NumericStats(count=len(valid_series))

    def _calculate_categorical_stats(self, valid_series: pd.Series, total_rows: int) -> CategoricalStats:
        """Calculate frequency distribution of top categories."""
        unique_count = int(valid_series.nunique())
        value_counts = valid_series.astype(str).value_counts().head(10)

        top_cats: List[CategoryFrequency] = []
        for cat_name, count in value_counts.items():
            pct = round((count / total_rows * 100), 2) if total_rows > 0 else 0.0
            top_cats.append(
                CategoryFrequency(
                    category=str(cat_name),
                    count=int(count),
                    percentage=pct
                )
            )

        return CategoricalStats(
            unique_count=unique_count,
            top_categories=top_cats
        )

    def _calculate_correlation_matrix(
        self, df: pd.DataFrame, columns_info: List[DatasetColumnInfo], identifier_set: Set[str]
    ) -> Dict[str, Dict[str, Optional[float]]]:
        """Calculate Pearson correlation matrix for numeric columns, excluding identifiers and constants."""
        numeric_col_names = [
            c.name for c in columns_info
            if c.inferred_type == "numeric" and c.name not in identifier_set
        ][:20]  # Limit to 20 columns for UI readability and fast compute

        if len(numeric_col_names) < 2:
            return {}

        try:
            numeric_df = df[numeric_col_names].apply(pd.to_numeric, errors="coerce")

            # Drop constant columns (std == 0 across non-null values) — they produce NaN correlations
            non_constant_cols = [
                col for col in numeric_col_names
                if numeric_df[col].dropna().std() != 0 and len(numeric_df[col].dropna()) > 0
            ]

            if len(non_constant_cols) < 2:
                return {}

            numeric_df = numeric_df[non_constant_cols]
            corr = numeric_df.corr(method="pearson")

            matrix: Dict[str, Dict[str, Optional[float]]] = {}
            for col_a in non_constant_cols:
                matrix[col_a] = {}
                for col_b in non_constant_cols:
                    val = corr.loc[col_a, col_b]
                    if pd.isna(val) or (isinstance(val, float) and math.isnan(val)):
                        matrix[col_a][col_b] = None
                    else:
                        matrix[col_a][col_b] = round(float(val), 3)
            return matrix
        except Exception:
            return {}

    def _clean_float(self, val: float) -> Optional[float]:
        """Ensure float is finite and JSON serializable."""
        if math.isnan(val) or math.isinf(val):
            return None
        return round(val, 4)

    def _safe_json_value(self, val: Any) -> Any:
        """Convert numpy / pandas scalar to standard Python primitive."""
        if pd.isna(val):
            return None
        if isinstance(val, (np.integer, int)):
            return int(val)
        if isinstance(val, (np.floating, float)):
            if math.isnan(val) or math.isinf(val):
                return None
            return round(float(val), 4)
        if isinstance(val, (np.bool_, bool)):
            return bool(val)
        return str(val)


inspection_service = DatasetInspectionService()
