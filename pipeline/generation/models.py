"""Data models for flashcard generation."""

from datetime import datetime, timezone

from pydantic import BaseModel, Field


class Flashcard(BaseModel):
    """Generated flashcard for iOS interview prep."""

    id: str
    front: str = Field(max_length=500)
    back: str = Field(max_length=8000)  # Allow very detailed answers from Pro model
    code_example: str | None = None
    difficulty: str = "senior"
    topic: str
    tags: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
    swift_version: str | None = None
    confidence: float = Field(ge=0, le=1, default=0.8)
    verified: bool = False
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def __str__(self) -> str:
        return f"[{self.topic}] {self.front[:50]}..."


class GenerationResult(BaseModel):
    """Result of flashcard generation including context."""

    flashcard: Flashcard
    raw_context: list[str] = Field(default_factory=list)
    generation_time_ms: int = 0
    verification_passed: bool = False

    def __str__(self) -> str:
        return f"{self.flashcard} ({self.generation_time_ms}ms)"
