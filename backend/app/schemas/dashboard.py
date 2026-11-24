from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class JobSummary(BaseModel):
    """Summary of a generative or training job."""
    id: str = Field(..., description="Unique job ID")
    title: str = Field(..., description="Name or description of the job")
    job_type: str = Field(..., description="Type of job, e.g. synthesis, training, validation")
    status: str = Field(..., description="Status: pending, running, completed, failed")
    progress: float = Field(default=0.0, ge=0.0, le=100.0, description="Percentage progress")
    created_at: datetime = Field(..., description="Job start/creation timestamp")
    completed_at: Optional[datetime] = Field(default=None, description="Job completion timestamp")


class DashboardSummaryResponse(BaseModel):
    """Aggregate statistics and recent activities for the MedSynth dashboard."""
    total_datasets: int = Field(default=0, description="Total ingested source datasets")
    total_synthetic_samples: int = Field(default=0, description="Total generated synthetic samples (tabular + imaging)")
    total_models_trained: int = Field(default=0, description="Total generative AI models trained")
    active_training_jobs: int = Field(default=0, description="Currently running synthesis or training tasks")
    storage_used_bytes: int = Field(default=0, description="Total storage consumed by datasets and models in bytes")
    system_status: str = Field(default="operational", description="Core pipeline status")
    recent_jobs: List[JobSummary] = Field(default_factory=list, description="Recent generation or training jobs")
    dataset_breakdown: Dict[str, int] = Field(
        default_factory=lambda: {"tabular_records": 0, "medical_imaging": 0},
        description="Dataset counts by modality"
    )
    last_updated: datetime = Field(..., description="Timestamp of the summary report")
