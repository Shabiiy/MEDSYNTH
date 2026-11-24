import sys
from pathlib import Path

# Ensure root workspace is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app
from backend.app.config import get_settings
from backend.app.db.database import init_db
from backend.app.services.dataset_repository import dataset_repository


@pytest.fixture(autouse=True)
def isolated_test_storage(monkeypatch, tmp_path):
    """Automatically isolate database and datasets storage in a temporary directory during tests."""
    settings = get_settings()
    monkeypatch.setattr(settings, "STORAGE_DIR", tmp_path)
    test_db_path = tmp_path / "test_medsynth.db"
    init_db(test_db_path)
    monkeypatch.setattr(dataset_repository, "db_path", test_db_path)
    yield tmp_path


@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
