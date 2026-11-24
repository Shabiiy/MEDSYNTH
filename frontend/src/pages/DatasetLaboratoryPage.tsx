import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  Sliders,
  RefreshCw,
  Table,
  BarChart2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Database,
  Info,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import type {
  DatasetSummary,
  DatasetDetailResponse,
  DatasetPreviewResponse,
  PreprocessingRequest,
  PreprocessingResult,
} from '../types/api';
import { EmptyState } from '../components/EmptyState';

type SubView = 'library' | 'inspect' | 'preprocess';
type InspectTab = 'preview' | 'schema' | 'stats' | 'categories' | 'correlation';

export const DatasetLaboratoryPage: React.FC = () => {
  // Main state
  const [subView, setSubView] = useState<SubView>('library');
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [totalDatasets, setTotalDatasets] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(8);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);

  // Selected dataset for inspection & preprocessing
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [datasetDetail, setDatasetDetail] = useState<DatasetDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [inspectTab, setInspectTab] = useState<InspectTab>('preview');

  // Preview state
  const [previewData, setPreviewData] = useState<DatasetPreviewResponse | null>(null);
  const [previewOffset, setPreviewOffset] = useState<number>(0);
  const [previewLimit, setPreviewLimit] = useState<number>(15);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preprocessing state
  const [prepSelectedCols, setPrepSelectedCols] = useState<string[]>([]);
  const [prepMissingStrategy, setPrepMissingStrategy] = useState<
    'none' | 'drop_rows' | 'mean' | 'median' | 'mode' | 'constant'
  >('none');
  const [prepConstantVal, setPrepConstantVal] = useState<string>('0');
  const [prepDropDuplicates, setPrepDropDuplicates] = useState<boolean>(false);
  const [prepScaling, setPrepScaling] = useState<'none' | 'minmax' | 'standard' | 'robust'>('none');
  const [prepEncoding, setPrepEncoding] = useState<'none' | 'onehot' | 'label'>('none');
  const [isExecutingPrep, setIsExecutingPrep] = useState<boolean>(false);
  const [prepResult, setPrepResult] = useState<PreprocessingResult | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);

  // Fetch dataset list
  const loadDatasets = useCallback(async (targetPage = page) => {
    setIsLoadingList(true);
    const result = await api.listDatasets(targetPage, pageSize);
    if (result.data) {
      setDatasets(result.data.items);
      setTotalDatasets(result.data.total);
    }
    setIsLoadingList(false);
  }, [page, pageSize]);

  useEffect(() => {
    loadDatasets(page);
  }, [loadDatasets, page]);

  // Fetch dataset details & profile
  const loadDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    const res = await api.getDatasetDetail(id);
    if (res.data) {
      setDatasetDetail(res.data);
      // Initialize selected columns for preprocessing
      setPrepSelectedCols(res.data.columns.map((c) => c.name));
    }
    setIsLoadingDetail(false);
  }, []);

  // Fetch preview data
  const loadPreview = useCallback(async (id: string, offset = previewOffset, limit = previewLimit) => {
    setIsLoadingPreview(true);
    const res = await api.getDatasetPreview(id, offset, limit);
    if (res.data) {
      setPreviewData(res.data);
    }
    setIsLoadingPreview(false);
  }, [previewOffset, previewLimit]);

  // When selectedDatasetId changes, load details & preview
  useEffect(() => {
    if (selectedDatasetId) {
      loadDetail(selectedDatasetId);
      loadPreview(selectedDatasetId, 0, previewLimit);
      setPreviewOffset(0);
    }
  }, [selectedDatasetId, loadDetail, loadPreview, previewLimit]);

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        setUploadFile(file);
        setUploadError(null);
      } else {
        setUploadError('Invalid file type: Please upload a standard .csv file.');
      }
    }
  };

  // Handle upload submit
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const result = await api.uploadDataset(uploadFile, customName);
    setIsUploading(false);

    if (result.error) {
      setUploadError(result.error);
    } else if (result.data) {
      setUploadSuccess(`Successfully ingested '${result.data.name}' (${result.data.row_count} rows, ${result.data.column_count} columns)`);
      setUploadFile(null);
      setCustomName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadDatasets(1);
      setPage(1);
      // Auto inspect newly uploaded dataset
      setSelectedDatasetId(result.data.id);
      setSubView('inspect');
    }
  };

  // Handle delete
  const handleDelete = async (dataset: DatasetSummary) => {
    if (window.confirm(`Are you sure you want to delete dataset '${dataset.name}'? All files and derived artifacts will be permanently removed.`)) {
      const res = await api.deleteDataset(dataset.id);
      if (res.success) {
        if (selectedDatasetId === dataset.id) {
          setSelectedDatasetId(null);
          setDatasetDetail(null);
          setSubView('library');
        }
        loadDatasets(page);
      } else {
        alert(res.error || 'Failed to delete dataset');
      }
    }
  };

  // Handle execute preprocessing
  const handleExecutePreprocessing = async () => {
    if (!selectedDatasetId) return;

    setIsExecutingPrep(true);
    setPrepError(null);
    setPrepResult(null);

    const payload: PreprocessingRequest = {
      selected_columns: prepSelectedCols,
      missing_value_strategy: prepMissingStrategy,
      missing_value_constant: prepMissingStrategy === 'constant' ? prepConstantVal : undefined,
      drop_duplicates: prepDropDuplicates,
      numeric_scaling: prepScaling,
      categorical_encoding: prepEncoding,
    };

    const res = await api.preprocessDataset(selectedDatasetId, payload);
    setIsExecutingPrep(false);

    if (res.error) {
      setPrepError(res.error);
    } else if (res.data) {
      setPrepResult(res.data);
      loadDatasets(1);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubView('library')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              subView === 'library'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            Dataset Library ({totalDatasets})
          </button>

          {selectedDatasetId && (
            <>
              <button
                onClick={() => setSubView('inspect')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  subView === 'inspect'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                Profile & Inspection
              </button>

              <button
                onClick={() => setSubView('preprocess')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  subView === 'preprocess'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                Preprocessing Pipeline
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => loadDatasets(page)}
          disabled={isLoadingList}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors self-end sm:self-auto"
          title="Refresh library"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin text-teal-600' : ''}`} />
        </button>
      </div>

      {/* VIEW 1: DATASET LIBRARY & UPLOAD */}
      {subView === 'library' && (
        <div className="space-y-6">
          {/* Upload Panel (Section A) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <UploadCloud className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Ingest Tabular Medical Dataset (CSV)</h2>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                Max 50 MB
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 max-w-3xl leading-relaxed">
              Upload clinical cohorts (EHR tables, lab biomarkers, diagnosis matrices) in CSV format.
              Files are validated for UTF-8/Latin-1 encoding, syntax integrity, and sanitization before being assigned an isolated server ID.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50/50'
                    : uploadFile
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                      setUploadError(null);
                    }
                  }}
                />
                <FileSpreadsheet className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                {uploadFile ? (
                  <div>
                    <span className="text-xs font-semibold text-slate-800">{uploadFile.name}</span>
                    <span className="text-xs text-slate-500 ml-2">({formatBytes(uploadFile.size)})</span>
                    <p className="text-[11px] text-teal-700 mt-1">Ready for intake. Click to change file.</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Drag and drop your CSV file here, or <span className="text-teal-700 font-semibold underline">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Standard RFC 4180 CSV, comma or semicolon separated</p>
                  </div>
                )}
              </div>

              {/* Custom Label and Upload Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Optional custom display name (e.g. Kaggle Heart Disease Cohort)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className={`px-5 py-2 text-xs font-semibold rounded-lg text-white shadow-xs transition-colors flex items-center justify-center gap-2 ${
                    !uploadFile || isUploading
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                >
                  {isUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isUploading ? 'Validating & Uploading...' : 'Upload & Profile Dataset'}
                </button>
              </div>

              {/* Feedback Banners */}
              {uploadError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
              {uploadSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </form>
          </div>

          {/* Dataset Library Table (Section B) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Datasets Library</h3>
                <p className="text-xs text-slate-500">
                  Persistent cohort registry. Datasets remain securely stored across backend reboots.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {totalDatasets} total
              </span>
            </div>

            {datasets.length === 0 ? (
              <EmptyState
                icon={Database}
                badge="Storage Ready"
                title="No Datasets Ingested Yet"
                description="Upload an Electronic Health Record (EHR) CSV above to inspect distributions, detect anomalies, and prepare training matrices."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Dataset Name</th>
                      <th className="py-2.5 px-3">Modality / Type</th>
                      <th className="py-2.5 px-3">Rows</th>
                      <th className="py-2.5 px-3">Columns</th>
                      <th className="py-2.5 px-3">File Size</th>
                      <th className="py-2.5 px-3">Ingested</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {datasets.map((ds) => (
                      <tr key={ds.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{ds.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ds.id}</div>
                        </td>
                        <td className="py-3 px-3">
                          {ds.is_derived ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              <Sparkles className="w-3 h-3" /> Preprocessed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                              <FileSpreadsheet className="w-3 h-3" /> Raw EHR Seed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">{ds.row_count.toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">{ds.column_count}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{formatBytes(ds.file_size_bytes)}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {new Date(ds.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedDatasetId(ds.id);
                              setSubView('inspect');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDatasetId(ds.id);
                              setSubView('preprocess');
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md transition-colors"
                          >
                            Preprocess
                          </button>
                          <button
                            onClick={() => handleDelete(ds)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete dataset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalDatasets > pageSize && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Page {page} of {Math.ceil(totalDatasets / pageSize)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= Math.ceil(totalDatasets / pageSize)}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DATASET INSPECTION & PROFILING (Section C) */}
      {subView === 'inspect' && isLoadingDetail && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Computing full statistical profile & quality metrics...</p>
        </div>
      )}

      {subView === 'inspect' && !isLoadingDetail && datasetDetail && (
        <div className="space-y-6">
          {/* Header & Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{datasetDetail.dataset.name}</h2>
                  {datasetDetail.dataset.is_derived && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Derived Artifact
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {datasetDetail.dataset.id} | Filename: {datasetDetail.dataset.filename}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubView('preprocess')}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" /> Preprocess Cohort
                </button>
                <button
                  onClick={() => setSubView('library')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
                >
                  Back to Library
                </button>
              </div>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Total Rows</div>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {datasetDetail.profile.row_count.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Total Columns</div>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {datasetDetail.profile.column_count}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Duplicate Rows</div>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {datasetDetail.profile.duplicate_rows} ({datasetDetail.profile.duplicate_percentage}%)
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Missing Cells</div>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {datasetDetail.profile.total_missing_cells} ({datasetDetail.profile.overall_missing_percentage}%)
                </div>
              </div>
            </div>

            {/* Quality Warnings Banner */}
            {datasetDetail.profile.warnings && datasetDetail.profile.warnings.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  Data Quality & Governance Audit ({datasetDetail.profile.warnings.length} notices)
                </div>
                <ul className="space-y-1.5 text-amber-800 text-[11px]">
                  {datasetDetail.profile.warnings.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold">•</span>
                      <span>{w.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Inspection Sub-tabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-wrap border-b border-slate-200 mb-4 gap-2">
              <button
                onClick={() => setInspectTab('preview')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectTab === 'preview'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Table className="w-3.5 h-3.5" /> Data Preview
              </button>
              <button
                onClick={() => setInspectTab('schema')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectTab === 'schema'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Column Schema ({datasetDetail.columns.length})
              </button>
              <button
                onClick={() => setInspectTab('stats')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectTab === 'stats'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Numeric Statistics
              </button>
              <button
                onClick={() => setInspectTab('categories')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectTab === 'categories'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Categorical Distributions
              </button>
              <button
                onClick={() => setInspectTab('correlation')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectTab === 'correlation'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Correlation Matrix
              </button>
            </div>

            {/* TAB 1: PREVIEW TABLE */}
            {inspectTab === 'preview' && (
              <div className="space-y-4">
                {isLoadingPreview ? (
                  <div className="p-8 text-center text-xs text-slate-500">Loading preview records...</div>
                ) : previewData && previewData.rows.length > 0 ? (
                  <>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-600 text-[11px] font-semibold">
                          <tr>
                            <th className="py-2 px-3 border-b border-slate-200 w-12 text-slate-400">#</th>
                            {previewData.columns.map((col) => (
                              <th key={col} className="py-2 px-3 border-b border-slate-200 whitespace-nowrap">
                                <div>{col}</div>
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono text-slate-500 bg-slate-200/60 font-normal">
                                  {previewData.column_types[col] || 'val'}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {previewData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 text-slate-400">{previewOffset + rIdx + 1}</td>
                              {previewData.columns.map((col) => {
                                const val = row[col];
                                return (
                                  <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-800">
                                    {val === null || val === undefined ? (
                                      <span className="text-slate-300 italic">null</span>
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Preview Pagination */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Showing rows {previewOffset + 1} to{' '}
                        {Math.min(previewOffset + previewLimit, previewData.total_rows)} of {previewData.total_rows}
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          value={previewLimit}
                          onChange={(e) => {
                            const newLim = parseInt(e.target.value);
                            setPreviewLimit(newLim);
                            loadPreview(datasetDetail.dataset.id, previewOffset, newLim);
                          }}
                          className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                        >
                          <option value={10}>10 rows</option>
                          <option value={15}>15 rows</option>
                          <option value={25}>25 rows</option>
                          <option value={50}>50 rows</option>
                        </select>
                        <button
                          onClick={() => {
                            const newOff = Math.max(0, previewOffset - previewLimit);
                            setPreviewOffset(newOff);
                            loadPreview(datasetDetail.dataset.id, newOff, previewLimit);
                          }}
                          disabled={previewOffset === 0}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => {
                            const newOff = previewOffset + previewLimit;
                            setPreviewOffset(newOff);
                            loadPreview(datasetDetail.dataset.id, newOff, previewLimit);
                          }}
                          disabled={previewOffset + previewLimit >= previewData.total_rows}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">No rows available in preview.</div>
                )}
              </div>
            )}

            {/* TAB 2: COLUMN SCHEMA & MISSINGNESS */}
            {inspectTab === 'schema' && (
              <div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Column Name</th>
                        <th className="py-2.5 px-3">Inferred Type</th>
                        <th className="py-2.5 px-3">Missing Count</th>
                        <th className="py-2.5 px-3">Missing (%)</th>
                        <th className="py-2.5 px-3">Unique Values</th>
                        <th className="py-2.5 px-3">Sample Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {datasetDetail.columns.map((col) => (
                        <tr key={col.name} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{col.name}</span>
                              {col.is_likely_identifier && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 uppercase tracking-wide">
                                  Likely Identifier
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {col.inferred_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">{col.missing_count}</td>
                          <td className="py-2.5 px-3 font-mono">
                            <span
                              className={
                                col.missing_percentage >= 20 ? 'text-amber-600 font-semibold' : 'text-slate-600'
                              }
                            >
                              {col.missing_percentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">{col.unique_count}</td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono truncate max-w-xs">
                            {col.sample_values.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {datasetDetail.profile.identifier_columns.length > 0 && (
                  <p className="mt-2 text-[11px] text-slate-500 italic">
                    Identifier columns are excluded from distributions and correlations.
                  </p>
                )}
              </div>
            )}

            {/* TAB 3: NUMERIC STATISTICS */}
            {inspectTab === 'stats' && (
              <div>
                {Object.keys(datasetDetail.profile.numeric_stats).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No numeric columns found in this dataset.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 font-sans">Feature</th>
                          <th className="py-2.5 px-3">Count</th>
                          <th className="py-2.5 px-3">Mean</th>
                          <th className="py-2.5 px-3">Std Dev</th>
                          <th className="py-2.5 px-3">Min</th>
                          <th className="py-2.5 px-3">25%</th>
                          <th className="py-2.5 px-3">Median</th>
                          <th className="py-2.5 px-3">75%</th>
                          <th className="py-2.5 px-3">Max</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {Object.entries(datasetDetail.profile.numeric_stats).map(([col, st]) => (
                          <tr key={col} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{col}</td>
                            <td className="py-2.5 px-3">{st.count}</td>
                            <td className="py-2.5 px-3">{st.mean ?? 'N/A'}</td>
                            <td className="py-2.5 px-3">{st.std ?? 'N/A'}</td>
                            <td className="py-2.5 px-3">{st.min ?? 'N/A'}</td>
                            <td className="py-2.5 px-3">{st.q25 ?? 'N/A'}</td>
                            <td className="py-2.5 px-3 font-semibold text-teal-800">{st.median ?? 'N/A'}</td>
                            <td className="py-2.5 px-3">{st.q75 ?? 'N/A'}</td>
                            <td className="py-2.5 px-3">{st.max ?? 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CATEGORICAL DISTRIBUTIONS */}
            {inspectTab === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(datasetDetail.profile.categorical_stats).length === 0 ? (
                  <p className="text-xs text-slate-500 col-span-2 text-center py-6">
                    No categorical features detected.
                  </p>
                ) : (
                  Object.entries(datasetDetail.profile.categorical_stats).map(([col, catInfo]) => (
                    <div key={col} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-slate-800">{col}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{catInfo.unique_count} classes</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {catInfo.top_categories.map((c) => (
                          <div key={c.category} className="flex items-center justify-between text-[11px]">
                            <span className="truncate max-w-[180px] text-slate-700">{c.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-mono">{c.count}</span>
                              <span className="font-mono text-teal-700 font-semibold w-10 text-right">
                                {c.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: CORRELATION MATRIX */}
            {inspectTab === 'correlation' && (
              <div>
                {Object.keys(datasetDetail.profile.correlation_matrix).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Correlation matrix requires at least 2 numeric features.
                  </p>
                ) : (
                  <>
                    {datasetDetail.profile.correlation_note && (
                      <p className="text-[11px] text-slate-500 italic mb-3">
                        {datasetDetail.profile.correlation_note}
                      </p>
                    )}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-center text-xs font-mono">
                        <thead className="bg-slate-50 text-[10px] font-semibold text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3 text-left">Feature</th>
                            {Object.keys(datasetDetail.profile.correlation_matrix).map((c) => (
                              <th key={c} className="py-2 px-3 whitespace-nowrap">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {Object.entries(datasetDetail.profile.correlation_matrix).map(([rowKey, colDict]) => (
                            <tr key={rowKey}>
                              <td className="py-2 px-3 text-left font-sans font-semibold text-slate-800">{rowKey}</td>
                              {Object.keys(datasetDetail.profile.correlation_matrix).map((colKey) => {
                                const rawVal = colDict[colKey];
                                const val = rawVal ?? null;
                                return (
                                  <td
                                    key={colKey}
                                    className={`py-2 px-3 ${
                                      val === null
                                        ? 'text-slate-400'
                                        : val === 1
                                        ? 'bg-slate-100 text-slate-700 font-bold'
                                        : val > 0.4
                                        ? 'bg-teal-50 text-teal-800 font-semibold'
                                        : val < -0.4
                                        ? 'bg-rose-50 text-rose-800 font-semibold'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    {val === null ? '—' : val.toFixed(2)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: PREPROCESSING PIPELINE (Section D) */}
      {subView === 'preprocess' && datasetDetail && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Configure Tabular Preprocessing Pipeline</h2>
                <p className="text-xs text-slate-500">
                  Target: <span className="font-semibold text-slate-700">{datasetDetail.dataset.name}</span>.
                  The original source CSV is preserved. Output is saved as a verified derived artifact.
                </p>
              </div>
              <button
                onClick={() => setSubView('inspect')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors self-start"
              >
                Cancel / Return
              </button>
            </div>

            {/* Configuration Form */}
            <div className="space-y-5 text-xs">
              {/* Step 1: Column Selection */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 inline-flex items-center justify-center text-[10px] font-bold">1</span>
                    Select Features to Retain ({prepSelectedCols.length} of {datasetDetail.columns.length} chosen)
                  </span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setPrepSelectedCols(datasetDetail.columns.map((c) => c.name))}
                      className="text-teal-700 hover:underline text-[11px]"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setPrepSelectedCols([])}
                      className="text-slate-500 hover:underline text-[11px]"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                  {datasetDetail.columns.map((col) => {
                    const isChecked = prepSelectedCols.includes(col.name);
                    return (
                      <label key={col.name} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPrepSelectedCols([...prepSelectedCols, col.name]);
                            } else {
                              setPrepSelectedCols(prepSelectedCols.filter((c) => c !== col.name));
                            }
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="truncate">{col.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Missing Values & Duplicates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 inline-flex items-center justify-center text-[10px] font-bold">2</span>
                    Missing Value Strategy
                  </span>
                  <select
                    value={prepMissingStrategy}
                    onChange={(e) => setPrepMissingStrategy(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs mb-2"
                  >
                    <option value="none">Retain missing values as NaN</option>
                    <option value="drop_rows">Drop rows with missing values</option>
                    <option value="mean">Impute with Column Mean (numeric only)</option>
                    <option value="median">Impute with Column Median (numeric only)</option>
                    <option value="mode">Impute with Mode (most frequent value)</option>
                    <option value="constant">Impute with Constant Value</option>
                  </select>
                  {prepMissingStrategy === 'constant' && (
                    <input
                      type="text"
                      placeholder="Constant value (e.g. 0 or Unknown)"
                      value={prepConstantVal}
                      onChange={(e) => setPrepConstantVal(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 inline-flex items-center justify-center text-[10px] font-bold">3</span>
                    Duplicate Row Handling
                  </span>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prepDropDuplicates}
                      onChange={(e) => setPrepDropDuplicates(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-slate-700">Drop identical duplicate rows automatically</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Current dataset has {datasetDetail.profile.duplicate_rows} duplicate rows detected.
                  </p>
                </div>
              </div>

              {/* Step 3: Normalization & Encoding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 inline-flex items-center justify-center text-[10px] font-bold">4</span>
                    Numeric Scaling / Normalization
                  </span>
                  <select
                    value={prepScaling}
                    onChange={(e) => setPrepScaling(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    <option value="none">None (keep raw numerical values)</option>
                    <option value="minmax">Min-Max Normalization [0, 1]</option>
                    <option value="standard">Standard Z-Score (Mean=0, Std=1)</option>
                    <option value="robust">Robust Scaling (Median & IQR)</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 inline-flex items-center justify-center text-[10px] font-bold">5</span>
                    Categorical Encoding
                  </span>
                  <select
                    value={prepEncoding}
                    onChange={(e) => setPrepEncoding(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    <option value="none">None (keep string categories)</option>
                    <option value="label">Label Encoding (converts to integer IDs)</option>
                    <option value="onehot">One-Hot Encoding (generates binary dummy columns)</option>
                  </select>
                </div>
              </div>

              {/* Preview Transformation Plan */}
              <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-200/80">
                <div className="font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-700" />
                  Transformation Plan Summary
                </div>
                <div className="text-[11px] text-teal-800 space-y-1">
                  <div>• Retaining {prepSelectedCols.length} features out of {datasetDetail.columns.length}.</div>
                  <div>• Missing values: {prepMissingStrategy}.</div>
                  <div>• Duplicates: {prepDropDuplicates ? 'Remove duplicates' : 'Keep duplicates'}.</div>
                  <div>• Numeric scaling: {prepScaling}.</div>
                  <div>• Categorical encoding: {prepEncoding}.</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExecutePreprocessing}
                  disabled={isExecutingPrep || prepSelectedCols.length === 0}
                  className={`px-5 py-2 text-xs font-semibold rounded-lg text-white shadow-xs transition-colors flex items-center gap-2 ${
                    isExecutingPrep || prepSelectedCols.length === 0
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                >
                  {isExecutingPrep && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isExecutingPrep ? 'Executing Pipeline...' : 'Execute Preprocessing'}
                </button>
              </div>

              {/* Error Display */}
              {prepError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {prepError}
                </div>
              )}

              {/* Success Result Card */}
              {prepResult && (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Preprocessing Succeeded — Derived Dataset Created
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/80 p-2.5 rounded border border-emerald-200">
                      <span className="text-slate-500 text-[10px]">Derived ID</span>
                      <div className="font-mono font-bold text-slate-800 text-[11px]">{prepResult.derived_dataset_id}</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded border border-emerald-200">
                      <span className="text-slate-500 text-[10px]">Row Changes</span>
                      <div className="font-mono font-bold text-slate-800 text-[11px]">
                        {prepResult.original_rows} → {prepResult.final_rows}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded border border-emerald-200">
                      <span className="text-slate-500 text-[10px]">Column Changes</span>
                      <div className="font-mono font-bold text-slate-800 text-[11px]">
                        {prepResult.original_columns} → {prepResult.final_columns}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded border border-emerald-200">
                      <span className="text-slate-500 text-[10px]">Transformations</span>
                      <div className="font-mono font-bold text-slate-800 text-[11px]">
                        {prepResult.transformations_applied.length} applied
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-emerald-800">
                      Artifact saved: <code className="font-mono text-[10px]">{prepResult.artifact_path}</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDatasetId(prepResult.derived_dataset_id);
                        setSubView('inspect');
                      }}
                      className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      Inspect Derived Cohort <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
