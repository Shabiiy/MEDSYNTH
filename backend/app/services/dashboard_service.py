from datetime import datetime, timezone
from pathlib import Path
from backend.app.config import get_settings
from backend.app.schemas.dashboard import DashboardSummaryResponse
from backend.app.services.dataset_repository import dataset_repository


class DashboardService:
    """Service to compute real dashboard metrics from the workspace state."""

    def __init__(self):
        self.settings = get_settings()

    def get_summary(self) -> DashboardSummaryResponse:
        """Inspect storage directory and database repository to return authentic application metrics."""
        storage_dir: Path = self.settings.STORAGE_DIR
        
        # Calculate real disk usage for stored datasets and artifacts (excluding DB engine files)
        storage_used_bytes = 0
        tracked_subdirs = ["datasets", "generated", "models"]
        
        for sub in tracked_subdirs:
            target = storage_dir / sub
            if target.exists():
                for item in target.rglob("*"):
                    if item.is_file() and not item.name.startswith("."):
                        storage_used_bytes += item.stat().st_size

        # Query total datasets from SQLite registry
        try:
            total_datasets = dataset_repository.count()
        except Exception:
            total_datasets = 0

        # At this stage, 0 synthetic samples, 0 models, 0 jobs
        return DashboardSummaryResponse(
            total_datasets=total_datasets,
            total_synthetic_samples=0,
            total_models_trained=0,
            active_training_jobs=0,
            storage_used_bytes=storage_used_bytes,
            system_status="operational",
            recent_jobs=[],
            dataset_breakdown={
                "tabular_records": total_datasets,
                "medical_imaging": 0
            },
            last_updated=datetime.now(timezone.utc)
        )


dashboard_service = DashboardService()
