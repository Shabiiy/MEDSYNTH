from fastapi import APIRouter
from backend.app.api.health import router as health_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.datasets import router as datasets_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(datasets_router)
