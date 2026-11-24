from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DatasetColumnInfo(BaseModel):
    name: str
    inferred_type: str  # 'numeric', 'categorical', 'boolean', 'datetime', 'text'
    missing_count: int
    missing_percentage: float
    unique_count: int
    sample_values: List[Any] = Field(default_factory=list)
    is_likely_identifier: bool = Field(default=False)


class DatasetSummary(BaseModel):
    id: str
    name: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    status: str
    is_derived: bool
    parent_dataset_id: Optional[str] = None
    created_at: str
    updated_at: str


class DatasetListResponse(BaseModel):
    items: List[DatasetSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class DatasetPreviewResponse(BaseModel):
    dataset_id: str
    columns: List[str]
    column_types: Dict[str, str]
    rows: List[Dict[str, Any]]
    total_rows: int
    offset: int
    limit: int


class NumericStats(BaseModel):
    count: int
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    q25: Optional[float] = None
    median: Optional[float] = None
    q75: Optional[float] = None
    max: Optional[float] = None


class CategoryFrequency(BaseModel):
    category: str
    count: int
    percentage: float


class CategoricalStats(BaseModel):
    unique_count: int
    top_categories: List[CategoryFrequency]


class DataQualityWarning(BaseModel):
    code: str
    level: str  # 'info', 'warning', 'critical'
    column: Optional[str] = None
    message: str


class DatasetProfile(BaseModel):
    row_count: int
    column_count: int
    duplicate_rows: int
    duplicate_percentage: float
    total_missing_cells: int
    overall_missing_percentage: float
    columns: List[DatasetColumnInfo]
    numeric_stats: Dict[str, NumericStats] = Field(default_factory=dict)
    categorical_stats: Dict[str, CategoricalStats] = Field(default_factory=dict)
    correlation_matrix: Dict[str, Dict[str, Optional[float]]] = Field(default_factory=dict)
    warnings: List[DataQualityWarning] = Field(default_factory=list)
    identifier_columns: List[str] = Field(default_factory=list)
    correlation_note: str = Field(default="")


class DatasetDetailResponse(BaseModel):
    dataset: DatasetSummary
    columns: List[DatasetColumnInfo]
    profile: DatasetProfile
    preprocessing_config: Optional[Dict[str, Any]] = None


class PreprocessingRequest(BaseModel):
    selected_columns: Optional[List[str]] = None
    missing_value_strategy: str = Field(
        default="none",
        description="Strategy: 'none', 'drop_rows', 'mean', 'median', 'mode', 'constant'"
    )
    missing_value_constant: Optional[Any] = None
    drop_duplicates: bool = Field(default=False, description="Remove duplicate rows")
    numeric_scaling: str = Field(
        default="none",
        description="Scaling: 'none', 'minmax', 'standard', 'robust'"
    )
    scaling_columns: Optional[List[str]] = None
    categorical_encoding: str = Field(
        default="none",
        description="Encoding: 'none', 'onehot', 'label'"
    )
    encoding_columns: Optional[List[str]] = None


class PreprocessingResult(BaseModel):
    derived_dataset_id: str
    parent_dataset_id: str
    name: str
    original_rows: int
    final_rows: int
    original_columns: int
    final_columns: int
    transformations_applied: List[str]
    dropped_rows: int
    dropped_columns: int
    created_at: str
    artifact_path: str
