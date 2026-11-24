from functools import lru_cache
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment or defaults."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "MedSynth API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server host & port
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Allowed CORS origins (comma-separated or list)
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Base workspace storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"

    # Upload & parsing limits
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    MAX_PREVIEW_ROWS: int = 100
    DEFAULT_PREVIEW_ROWS: int = 20

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def datasets_dir(self) -> Path:
        path = self.STORAGE_DIR / "datasets"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def database_path(self) -> Path:
        self.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        return self.STORAGE_DIR / "medsynth.db"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
