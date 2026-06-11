"""
IntelliHire AI Engine Configuration

WHY THIS FILE:
Centralizes all configuration for the FastAPI application.
Makes deployment configuration explicit and environment-aware.

WHY THIS APPROACH:
Pydantic Settings provides type-safe environment variable loading
with automatic validation and sensible defaults.

ALTERNATIVES CONSIDERED:
- os.environ directly: no validation, hard to test
- JSON config file: env-specific configs require duplication
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables with defaults."""

    # Application metadata
    APP_NAME: str = "IntelliHire AI Engine"
    APP_VERSION: str = "5.0.0"
    APP_DESCRIPTION: str = "AI-powered resume analysis, skill extraction, job matching, and candidate ranking engine"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS - Allow all origins since this is an internal service
    # called by the Node.js backend proxy
    CORS_ORIGINS: list[str] = ["*"]

    # spaCy model
    SPACY_MODEL: str = "en_core_web_sm"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()