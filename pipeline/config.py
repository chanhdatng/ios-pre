"""Environment configuration using pydantic-settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Pipeline configuration loaded from environment variables."""

    # API Keys (Google required, Anthropic optional)
    google_api_key: str
    anthropic_api_key: str = ""  # Optional - for Claude fallback

    # ChromaDB
    chroma_persist_dir: str = "./data/chroma"
    chroma_collection: str = "ios_docs"

    # Models
    claude_model: str = "claude-sonnet-4-20250514"
    gemini_model: str = "gemini-2.5-pro"
    embedding_model: str = "models/text-embedding-004"

    # Limits
    max_tokens: int = 4096
    embedding_batch_size: int = 100

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Global settings instance - lazy loaded
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get settings instance (lazy loaded)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
