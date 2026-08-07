"""
Application configuration using Pydantic Settings.
Loads from environment variables or .env file.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ─────────────────────────────────────────
    app_name: str = "DigitalTwinSangli"
    app_env: str = "development"
    app_debug: bool = True
    app_port: int = 8000
    app_secret_key: str = "change-this-in-production"
    allowed_origins: str = "http://localhost:5173"

    # ─── JWT ─────────────────────────────────────────────────
    jwt_secret_key: str = "change-this-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # ─── PostgreSQL ──────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/digital_twin"
    database_pool_size: int = 10

    # ─── MongoDB ─────────────────────────────────────────────
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "digital_twin"

    # ─── Redis ───────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379"

    # ─── Cloudinary ──────────────────────────────────────────
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # ─── Email (Brevo) ──────────────────────────────────────
    smtp_host: str = "smtp-relay.brevo.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@digitaltwin.com"

    # ─── Gemini API ──────────────────────────────────────────
    gemini_api_key: str = ""

    # ─── Weather ─────────────────────────────────────────────
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"

    # ─── GIS ─────────────────────────────────────────────────
    nominatim_base_url: str = "https://nominatim.openstreetmap.org"
    overpass_base_url: str = "https://overpass-api.de/api"

    # ─── Cesium ──────────────────────────────────────────────
    cesium_ion_token: str = ""

    # ─── Celery ──────────────────────────────────────────────
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — created once, reused everywhere."""
    return Settings()
