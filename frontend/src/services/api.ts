import type {
  DashboardSummaryResponse,
  HealthResponse,
  DatasetSummary,
  DatasetListResponse,
  DatasetDetailResponse,
  DatasetPreviewResponse,
  PreprocessingRequest,
  PreprocessingResult,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getHealth(): Promise<{ data: HealthResponse | null; latencyMs: number; error: string | null }> {
    const startTime = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          data: null,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: HealthResponse = await response.json();
      return { data, latencyMs, error: null };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const message = err instanceof Error ? err.message : 'Failed to connect to backend server';
      return { data: null, latencyMs, error: message };
    }
  }

  async getDashboardSummary(): Promise<{ data: DashboardSummaryResponse | null; error: string | null }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dashboard/summary`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          data: null,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: DashboardSummaryResponse = await response.json();
      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve dashboard summary';
      return { data: null, error: message };
    }
  }

  async uploadDataset(
    file: File,
    name?: string
  ): Promise<{ data: DatasetSummary | null; error: string | null }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (name && name.trim()) {
        formData.append('name', name.trim());
      }

      const response = await fetch(`${this.baseUrl}/api/datasets/upload`, {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: json.message || json.detail || `Upload failed with HTTP ${response.status}`,
        };
      }

      return { data: json as DatasetSummary, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error during dataset upload';
      return { data: null, error: message };
    }
  }

  async listDatasets(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: DatasetListResponse | null; error: string | null }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/datasets?page=${page}&page_size=${pageSize}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        return {
          data: null,
          error: json.message || json.detail || `HTTP ${response.status}: Failed to list datasets`,
        };
      }

      const data: DatasetListResponse = await response.json();
      return { data, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve datasets';
      return { data: null, error: message };
    }
  }

  async getDatasetDetail(
    datasetId: string
  ): Promise<{ data: DatasetDetailResponse | null; error: string | null }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/datasets/${encodeURIComponent(datasetId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: json.message || json.detail || `HTTP ${response.status}: Failed to get dataset detail`,
        };
      }

      return { data: json as DatasetDetailResponse, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve dataset profile';
      return { data: null, error: message };
    }
  }

  async getDatasetPreview(
    datasetId: string,
    offset: number = 0,
    limit: number = 20
  ): Promise<{ data: DatasetPreviewResponse | null; error: string | null }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/datasets/${encodeURIComponent(datasetId)}/preview?offset=${offset}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      const json = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: json.message || json.detail || `HTTP ${response.status}: Failed to preview dataset`,
        };
      }

      return { data: json as DatasetPreviewResponse, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to preview dataset rows';
      return { data: null, error: message };
    }
  }

  async deleteDataset(
    datasetId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/datasets/${encodeURIComponent(datasetId)}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        return {
          success: false,
          error: json.message || json.detail || `HTTP ${response.status}: Failed to delete dataset`,
        };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete dataset';
      return { success: false, error: message };
    }
  }

  async preprocessDataset(
    datasetId: string,
    request: PreprocessingRequest
  ): Promise<{ data: PreprocessingResult | null; error: string | null }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/datasets/${encodeURIComponent(datasetId)}/preprocess`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: json.message || json.detail || `HTTP ${response.status}: Preprocessing failed`,
        };
      }

      return { data: json as PreprocessingResult, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error during preprocessing';
      return { data: null, error: message };
    }
  }
}

export const api = new ApiClient();
