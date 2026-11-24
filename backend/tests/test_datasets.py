import io
import pytest
from backend.app.config import get_settings
from backend.app.services.dataset_repository import DatasetRepository


SAMPLE_CSV = """patient_id,age,gender,cholesterol,blood_pressure,outcome
P001,45,M,220.5,130,0
P002,54,F,195.0,125,1
P003,62,M,245.2,140,1
P004,38,F,180.0,118,0
P005,59,M,210.8,135,1
"""

CSV_WITH_MISSING_AND_DUPLICATES = """name,age,gender,cholesterol,diagnosis
Alice,50,F,200.0,normal
Bob,60,M,,hypertension
Charlie,70,M,250.0,
Alice,50,F,200.0,normal
David,,M,210.0,normal
"""


@pytest.mark.anyio
async def test_valid_csv_upload(async_client):
    files = {"file": ("patients.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    response = await async_client.post("/api/datasets/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "patients.csv"
    assert data["row_count"] == 5
    assert data["column_count"] == 6
    assert data["status"] == "ready"
    assert "id" in data
    assert data["id"].startswith("ds_")


@pytest.mark.anyio
async def test_empty_file_upload(async_client):
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = await async_client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["message"].lower()


@pytest.mark.anyio
async def test_invalid_file_extension(async_client):
    files = {"file": ("malicious.exe", io.BytesIO(b"print('hack')"), "application/octet-stream")}
    response = await async_client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400
    assert "extension" in response.json()["message"].lower()


@pytest.mark.anyio
async def test_malformed_csv(async_client):
    files = {"file": ("corrupt.csv", io.BytesIO(b""), "text/csv")}
    response = await async_client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400


@pytest.mark.anyio
async def test_file_size_limit_enforcement(async_client, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_BYTES", 50)  # Set limit to 50 bytes
    large_content = b"a,b,c\n" + (b"1,2,3\n" * 20)
    files = {"file": ("toolarge.csv", io.BytesIO(large_content), "text/csv")}
    response = await async_client.post("/api/datasets/upload", files=files)
    assert response.status_code == 413
    assert "exceeds" in response.json()["message"].lower()


@pytest.mark.anyio
async def test_dataset_listing(async_client):
    files1 = {"file": ("data1.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    files2 = {"file": ("data2.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    await async_client.post("/api/datasets/upload", files=files1)
    await async_client.post("/api/datasets/upload", files=files2)

    response = await async_client.get("/api/datasets?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["page"] == 1


@pytest.mark.anyio
async def test_dataset_detail_retrieval(async_client):
    files = {"file": ("sample.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    upload_res = await async_client.post("/api/datasets/upload", files=files)
    dataset_id = upload_res.json()["id"]

    response = await async_client.get(f"/api/datasets/{dataset_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset"]["id"] == dataset_id
    assert len(data["columns"]) == 6
    assert data["profile"]["row_count"] == 5
    assert data["profile"]["column_count"] == 6


@pytest.mark.anyio
async def test_dataset_preview_limits(async_client):
    files = {"file": ("preview_test.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    upload_res = await async_client.post("/api/datasets/upload", files=files)
    dataset_id = upload_res.json()["id"]

    response = await async_client.get(f"/api/datasets/{dataset_id}/preview?offset=0&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["rows"]) == 2
    assert data["total_rows"] == 5
    assert data["offset"] == 0
    assert data["limit"] == 2


@pytest.mark.anyio
async def test_dataset_profile_calculations(async_client):
    files = {"file": ("profile_test.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    upload_res = await async_client.post("/api/datasets/upload", files=files)
    dataset_id = upload_res.json()["id"]

    response = await async_client.get(f"/api/datasets/{dataset_id}")
    assert response.status_code == 200
    profile = response.json()["profile"]

    # Check numeric stats for 'age'
    assert "age" in profile["numeric_stats"]
    age_stats = profile["numeric_stats"]["age"]
    assert age_stats["min"] == 38.0
    assert age_stats["max"] == 62.0
    assert age_stats["median"] == 54.0

    # Check correlation
    assert "correlation_matrix" in profile
    assert "age" in profile["correlation_matrix"]


@pytest.mark.anyio
async def test_missing_value_reporting_and_pii_warning(async_client):
    files = {"file": ("missing.csv", io.BytesIO(CSV_WITH_MISSING_AND_DUPLICATES.encode("utf-8")), "text/csv")}
    upload_res = await async_client.post("/api/datasets/upload", files=files)
    dataset_id = upload_res.json()["id"]

    response = await async_client.get(f"/api/datasets/{dataset_id}")
    assert response.status_code == 200
    profile = response.json()["profile"]

    # Check total missing cells
    assert profile["total_missing_cells"] == 3

    # Check PII Warning for 'name'
    warning_codes = [w["code"] for w in profile["warnings"]]
    assert "POTENTIAL_PII_IDENTIFIER" in warning_codes


@pytest.mark.anyio
async def test_duplicate_detection(async_client):
    files = {"file": ("dups.csv", io.BytesIO(CSV_WITH_MISSING_AND_DUPLICATES.encode("utf-8")), "text/csv")}
    upload_res = await async_client.post("/api/datasets/upload", files=files)
    dataset_id = upload_res.json()["id"]

    response = await async_client.get(f"/api/datasets/{dataset_id}")
    assert response.status_code == 200
    profile = response.json()["profile"]

    assert profile["duplicate_rows"] == 1
    assert profile["duplicate_percentage"] == 20.0
    warning_codes = [w["code"] for w in profile["warnings"]]
    assert "DUPLICATE_ROWS" in warning_codes


@pytest.mark.anyio
async def test_preprocessing_and_artifact_creation(async_client):
    files = {"file": ("to_prep.csv", io.BytesIO(CSV_WITH_MISSING_AND_DUPLICATES.encode("utf-8")), "text/csv")}
    upload_res = await async_client.post("/api/datasets/upload", files=files)
    parent_id = upload_res.json()["id"]

    prep_payload = {
        "selected_columns": ["age", "cholesterol", "diagnosis"],
        "drop_duplicates": True,
        "missing_value_strategy": "mean",
        "numeric_scaling": "minmax",
        "categorical_encoding": "label"
    }

    response = await async_client.post(f"/api/datasets/{parent_id}/preprocess", json=prep_payload)
    assert response.status_code == 201
    prep_data = response.json()

    assert prep_data["parent_dataset_id"] == parent_id
    assert prep_data["derived_dataset_id"].startswith("ds_prep_")
    assert prep_data["final_columns"] == 3
    assert len(prep_data["transformations_applied"]) >= 3

    # Check that derived dataset exists in listing
    list_res = await async_client.get("/api/datasets")
    derived_ids = [d["id"] for d in list_res.json()["items"]]
    assert prep_data["derived_dataset_id"] in derived_ids

    # Check that parent original dataset remains unchanged
    parent_detail = await async_client.get(f"/api/datasets/{parent_id}")
    assert parent_detail.json()["profile"]["row_count"] == 5
    assert parent_detail.json()["profile"]["column_count"] == 5


@pytest.mark.anyio
async def test_dataset_deletion(async_client):
    files = {"file": ("to_delete.csv", io.BytesIO(SAMPLE_CSV.encode("utf-8")), "text/csv")}
    upload_res = await async_client.post("/api/datasets/upload", files=files)
    dataset_id = upload_res.json()["id"]

    del_res = await async_client.delete(f"/api/datasets/{dataset_id}")
    assert del_res.status_code == 200

    # Ensure 404 when querying deleted dataset
    get_res = await async_client.get(f"/api/datasets/{dataset_id}")
    assert get_res.status_code == 404


@pytest.mark.anyio
async def test_unknown_dataset_ids(async_client):
    response = await async_client.get("/api/datasets/ds_non_existent_id")
    assert response.status_code == 404

    del_response = await async_client.delete("/api/datasets/ds_non_existent_id")
    assert del_response.status_code == 404

    prep_response = await async_client.post(
        "/api/datasets/ds_non_existent_id/preprocess",
        json={"missing_value_strategy": "none"}
    )
    assert prep_response.status_code in [400, 404, 500]


def test_registry_persistence(tmp_path):
    """Verify registry persists across repository reconnections and backend restarts."""
    test_db = tmp_path / "persistent_test.db"
    repo1 = DatasetRepository(db_path=test_db)
    sample_record = {
        "id": "ds_persist_01",
        "name": "EHR Cohort",
        "filename": "ehr.csv",
        "storage_path": str(tmp_path / "ehr.csv"),
        "file_size_bytes": 1024,
        "row_count": 100,
        "column_count": 5,
        "columns_json": "[]",
        "status": "ready",
        "is_derived": 0,
        "parent_dataset_id": None,
        "preprocessing_config": None,
        "artifact_path": None,
        "created_at": "2026-10-23T00:00:00Z",
        "updated_at": "2026-10-23T00:00:00Z"
    }
    repo1.create(sample_record)

    # Reconnect using new repo instance
    repo2 = DatasetRepository(db_path=test_db)
    fetched = repo2.get_by_id("ds_persist_01")
    assert fetched is not None
    assert fetched["name"] == "EHR Cohort"
    assert fetched["row_count"] == 100
