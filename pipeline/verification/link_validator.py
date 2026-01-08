"""URL validation for flashcard sources."""

import asyncio
from dataclasses import dataclass

import httpx

from ..utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class LinkValidationResult:
    """Result of validating a single URL."""

    url: str
    valid: bool
    status_code: int | None
    error: str | None


class LinkValidator:
    """Validates URLs in flashcard sources."""

    def __init__(self, timeout: float = 10.0, concurrent: int = 10):
        """Initialize validator.

        Args:
            timeout: Request timeout in seconds
            concurrent: Max concurrent requests
        """
        self.timeout = timeout
        self.semaphore = asyncio.Semaphore(concurrent)

    async def validate_url(self, url: str) -> LinkValidationResult:
        """Validate a single URL.

        Args:
            url: URL to validate

        Returns:
            Validation result
        """
        async with self.semaphore:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    # Use HEAD request first, fallback to GET
                    try:
                        response = await client.head(url, follow_redirects=True)
                    except httpx.HTTPStatusError:
                        response = await client.get(url, follow_redirects=True)

                    return LinkValidationResult(
                        url=url,
                        valid=200 <= response.status_code < 400,
                        status_code=response.status_code,
                        error=None,
                    )
            except httpx.TimeoutException:
                return LinkValidationResult(
                    url=url, valid=False, status_code=None, error="Timeout"
                )
            except Exception as e:
                return LinkValidationResult(
                    url=url, valid=False, status_code=None, error=str(e)
                )

    async def validate_flashcard_sources(self, flashcard) -> list[LinkValidationResult]:
        """Validate all sources in a flashcard.

        Args:
            flashcard: Flashcard with sources

        Returns:
            List of validation results
        """
        if not flashcard.sources:
            return []

        tasks = [self.validate_url(url) for url in flashcard.sources]
        return await asyncio.gather(*tasks)

    async def validate_all(self, flashcards: list) -> dict:
        """Validate all unique URLs across flashcards.

        Args:
            flashcards: List of flashcards

        Returns:
            Summary dict with total, valid, invalid counts
        """
        # Collect unique URLs
        all_urls = set()
        for card in flashcards:
            if hasattr(card, "sources"):
                all_urls.update(card.sources)

        if not all_urls:
            return {"total": 0, "valid": 0, "invalid": []}

        logger.info(f"Validating {len(all_urls)} unique URLs...")

        # Validate all URLs concurrently
        results = await asyncio.gather(*[self.validate_url(url) for url in all_urls])

        valid_count = sum(1 for r in results if r.valid)
        invalid_results = [r for r in results if not r.valid]

        logger.info(f"URL validation: {valid_count}/{len(results)} valid")

        return {
            "total": len(results),
            "valid": valid_count,
            "invalid": invalid_results,
        }
