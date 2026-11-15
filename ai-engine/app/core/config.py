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
    APP_VERSION: str = "6.0.0"
    APP_DESCRIPTION: str = "AI-powered resume analysis, skill extraction, job matching, and candidate ranking engine"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    LLM_BASE_URL: str = "http://127.0.0.1:8080"

    # CORS - Allow all origins since this is an internal service
    # called by the Node.js backend proxy
    CORS_ORIGINS: list[str] = ["*"]

    # spaCy model
    SPACY_MODEL: str = "en_core_web_sm"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # .env also carries non-Settings keys (SBERT_MODEL_PATH,
        # HF_HUB_OFFLINE, ...) consumed directly via os.environ by
        # services.sbert_embeddings; without ignore=True the engine refuses
        # to start once those keys exist.
        extra = "ignore"


settings = Settings()