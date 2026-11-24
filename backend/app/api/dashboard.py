from fastapi import APIRouter, status
from backend.app.schemas.dashboard import DashboardSummaryResponse
from backend.app.services.dashboard_service import dashboard_service

router = APIRouter(tags=["Dashboard"])


@router.get(
    "/dashboard/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Dashboard Metrics Summary",
    description="Provides real aggregated counts of datasets, synthetic samples, trained models, and recent jobs."
)
async def get_dashboard_summary() -> DashboardSummaryResponse:
    return dashboard_service.get_summary()
