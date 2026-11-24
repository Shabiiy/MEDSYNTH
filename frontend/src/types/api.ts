export type ConnectionState = 'connected' | 'connecting' | 'unavailable';

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface JobSummary {
  id: string;
  title: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string | null;
}

export interface DashboardSummaryResponse {
  total_datasets: number;
  total_synthetic_samples: number;
  total_models_trained: number;
  active_training_jobs: number;
  storage_used_bytes: number;
  system_status: string;
  recent_jobs: JobSummary[];
  dataset_breakdown: {
    tabular_records: number;
    medical_imaging: number;
  };
  last_updated: string;
}

export interface DatasetColumnInfo {
  name: string;
  inferred_type: 'numeric' | 'categorical' | 'boolean' | 'datetime' | 'text';
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  sample_values: (string | number | boolean | null)[];
  is_likely_identifier: boolean;
}

export interface DatasetSummary {
  id: string;
  name: string;
  filename: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  status: string;
  is_derived: boolean;
  parent_dataset_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatasetListResponse {
  items: DatasetSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DatasetPreviewResponse {
  dataset_id: string;
  columns: string[];
  column_types: Record<string, string>;
  rows: Record<string, any>[];
  total_rows: number;
  offset: number;
  limit: number;
}

export interface NumericStats {
  count: number;
  mean: number | null;
  std: number | null;
  min: number | null;
  q25: number | null;
  median: number | null;
  q75: number | null;
  max: number | null;
}

export interface CategoryFrequency {
  category: string;
  count: number;
  percentage: number;
}

export interface CategoricalStats {
  unique_count: number;
  top_categories: CategoryFrequency[];
}

export interface DataQualityWarning {
  code: string;
  level: 'info' | 'warning' | 'critical';
  column?: string | null;
  message: string;
}

export interface DatasetProfile {
  row_count: number;
  column_count: number;
  duplicate_rows: number;
  duplicate_percentage: number;
  total_missing_cells: number;
  overall_missing_percentage: number;
  columns: DatasetColumnInfo[];
  numeric_stats: Record<string, NumericStats>;
  categorical_stats: Record<string, CategoricalStats>;
  correlation_matrix: Record<string, Record<string, number | null>>;
  warnings: DataQualityWarning[];
  identifier_columns: string[];
  correlation_note: string;
}

export interface DatasetDetailResponse {
  dataset: DatasetSummary;
  columns: DatasetColumnInfo[];
  profile: DatasetProfile;
  preprocessing_config?: Record<string, any> | null;
}

export interface PreprocessingRequest {
  selected_columns?: string[];
  missing_value_strategy: 'none' | 'drop_rows' | 'mean' | 'median' | 'mode' | 'constant';
  missing_value_constant?: any;
  drop_duplicates: boolean;
  numeric_scaling: 'none' | 'minmax' | 'standard' | 'robust';
  scaling_columns?: string[];
  categorical_encoding: 'none' | 'onehot' | 'label';
  encoding_columns?: string[];
}

export interface PreprocessingResult {
  derived_dataset_id: string;
  parent_dataset_id: string;
  name: string;
  original_rows: number;
  final_rows: number;
  original_columns: number;
  final_columns: number;
  transformations_applied: string[];
  dropped_rows: number;
  dropped_columns: number;
  created_at: string;
  artifact_path: string;
}
