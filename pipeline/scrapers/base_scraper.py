"""Base scraper class with rate limiting and retry logic."""

import asyncio
from abc import ABC, abstractmethod

import httpx

from ..utils.logging import get_logger
from .models import ScrapedDocument

logger = get_logger(__name__)


class BaseScraper(ABC):
    """Abstract base class for documentation scrapers."""

    def __init__(self, rate_limit: float = 1.0, timeout: float = 30.0):
        """Initialize scraper.

        Args:
            rate_limit: Seconds between requests
            timeout: Request timeout in seconds
        """
        self.rate_limit = rate_limit
        self.timeout = timeout
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                headers={
                    "User-Agent": "iOS-Prep-Pipeline/1.0 (Educational Content Scraper)",
                    "Accept": "text/html,application/xhtml+xml",
                },
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def fetch(self, url: str, retries: int = 3) -> str:
        """Fetch URL with rate limiting and retry.

        Args:
            url: URL to fetch
            retries: Number of retry attempts

        Returns:
            Response text

        Raises:
            httpx.HTTPError: If all retries fail
        """
        client = await self._get_client()

        for attempt in range(retries):
            try:
                # Rate limit
                await asyncio.sleep(self.rate_limit)

                logger.debug(f"Fetching: {url}")
                response = await client.get(url)
                response.raise_for_status()
                return response.text

            except httpx.HTTPStatusError as e:
                logger.warning(f"HTTP {e.response.status_code} for {url}")
                if e.response.status_code == 429:
                    # Rate limited - wait longer
                    wait = 2 ** (attempt + 2)
                    logger.info(f"Rate limited, waiting {wait}s")
                    await asyncio.sleep(wait)
                elif e.response.status_code >= 500:
                    # Server error - retry
                    await asyncio.sleep(2**attempt)
                else:
                    # Client error - don't retry
                    raise

            except (httpx.ConnectError, httpx.TimeoutException) as e:
                logger.warning(f"Connection error for {url}: {e}")
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(2**attempt)

        raise httpx.RequestError(f"Failed to fetch {url} after {retries} retries")

    @abstractmethod
    async def scrape(self) -> list[ScrapedDocument]:
        """Scrape all documents from this source.

        Returns:
            List of scraped documents
        """
        pass

    @abstractmethod
    def get_urls(self) -> list[str]:
        """Get list of URLs to scrape.

        Returns:
            List of URLs
        """
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
        return False
