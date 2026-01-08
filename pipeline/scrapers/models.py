"""Data models for scraped documents."""

from datetime import datetime, timezone

from pydantic import BaseModel, Field


class ScrapedDocument(BaseModel):
    """Represents a scraped documentation page."""

    id: str = Field(..., description="Unique document ID")
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Cleaned text content")
    url: str = Field(..., description="Source URL")
    source: str = Field(..., description="Source identifier: apple, hws, swift_org")
    topic: str = Field(..., description="Topic: swift, swiftui, concurrency, etc.")
    scraped_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    swift_version: str | None = Field(default=None, description="Swift version if applicable")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")

    def __str__(self) -> str:
        return f"[{self.source}] {self.title} ({len(self.content)} chars)"
