from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicFix"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://civicfix:civicfix_secret@postgres:5432/civicfix_db"
    REDIS_URL: str = "redis://redis:6379/0"
    JWT_SECRET: str = "civicfix-production-secure-jwt-key-2026-supersecret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    AI_API_KEY: Optional[str] = None
    STORAGE_ENDPOINT: Optional[str] = None
    STORAGE_BUCKET: str = "civicfix-evidence"
    STORAGE_ACCESS_KEY: Optional[str] = None
    STORAGE_SECRET_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
