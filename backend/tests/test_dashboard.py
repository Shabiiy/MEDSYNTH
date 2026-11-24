import pytest


@pytest.mark.anyio
async def test_dashboard_summary_initial_state(async_client):
    response = await async_client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_datasets"] == 0
    assert data["total_synthetic_samples"] == 0
    assert data["total_models_trained"] == 0
    assert data["active_training_jobs"] == 0
    assert data["storage_used_bytes"] == 0
    assert data["system_status"] == "operational"
    assert isinstance(data["recent_jobs"], list)
    assert len(data["recent_jobs"]) == 0
    assert "dataset_breakdown" in data
    assert data["dataset_breakdown"]["tabular_records"] == 0
    assert data["dataset_breakdown"]["medical_imaging"] == 0
