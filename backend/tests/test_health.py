import pytest


@pytest.mark.anyio
async def test_health_check(async_client):
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "MedSynth API"
    assert "version" in data
    assert "timestamp" in data
