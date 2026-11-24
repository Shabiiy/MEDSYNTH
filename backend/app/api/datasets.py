from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Query, status
from backend.app.schemas.dataset import (
    DatasetSummary,
    DatasetListResponse,
    DatasetDetailResponse,
    DatasetPreviewResponse,
    PreprocessingRequest,
    PreprocessingResult,
)
from backend.app.services.dataset_service import dataset_service
from backend.app.services.preprocessing_service import preprocessing_service

router = APIRouter(prefix="/datasets", tags=["Dataset Laboratory"])


@router.post(
    "/upload",
    response_model=DatasetSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Tabular Medical Dataset",
    description="Accepts multipart CSV files up to 50 MB, validates encoding, structure and registers in persistent storage."
)
async def upload_dataset(
    file: UploadFile = File(..., description="CSV dataset file"),
    name: Optional[str] = Form(default=None, description="Optional custom name for dataset"),
) -> DatasetSummary:
    return await dataset_service.upload_csv(file, custom_name=name)


@router.get(
    "",
    response_model=DatasetListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Datasets",
    description="Retrieve paginated list of registered seed and preprocessed datasets."
)
async def list_datasets(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=50, description="Items per page"),
) -> DatasetListResponse:
    return dataset_service.list_datasets(page=page, page_size=page_size)


@router.get(
    "/{dataset_id}",
    response_model=DatasetDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Dataset Details and Profile",
    description="Retrieve full statistical profile, column schema, missingness distribution, and data quality warnings."
)
async def get_dataset_detail(dataset_id: str) -> DatasetDetailResponse:
    return dataset_service.get_dataset_detail(dataset_id)


@router.get(
    "/{dataset_id}/preview",
    response_model=DatasetPreviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Preview Dataset Rows",
    description="Retrieve bounded, paginated sample rows and inferred types."
)
async def get_dataset_preview(
    dataset_id: str,
    offset: int = Query(default=0, ge=0, description="Starting row offset"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of rows to fetch (max 100)"),
) -> DatasetPreviewResponse:
    return dataset_service.get_dataset_preview(dataset_id, offset=offset, limit=limit)


@router.delete(
    "/{dataset_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Dataset",
    description="Safely remove dataset files and metadata from the registry."
)
async def delete_dataset(dataset_id: str):
    success = dataset_service.delete_dataset(dataset_id)
    return {"status": "deleted", "dataset_id": dataset_id, "success": success}


@router.post(
    "/{dataset_id}/preprocess",
    response_model=PreprocessingResult,
    status_code=status.HTTP_201_CREATED,
    summary="Preprocess Tabular Dataset",
    description="Apply imputation, duplicate removal, scaling, or encoding, preserving original data and generating a derived artifact."
)
async def preprocess_dataset(
    dataset_id: str,
    request: PreprocessingRequest,
) -> PreprocessingResult:
    return preprocessing_service.preprocess_dataset(dataset_id, request)
