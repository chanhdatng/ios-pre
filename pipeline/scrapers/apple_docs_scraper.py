"""Scraper for Apple Developer Documentation."""

import hashlib
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from ..utils.logging import get_logger
from .base_scraper import BaseScraper
from .models import ScrapedDocument

logger = get_logger(__name__)


class AppleDocsScraper(BaseScraper):
    """Scraper for Apple Developer Documentation.

    Note: Apple docs use heavy JavaScript rendering. This scraper works
    with the limited static content available. For full content, consider
    using Apple's DocC archives or manual curation.
    """

    BASE_URL = "https://developer.apple.com"

    # Apple tutorials and articles (more static content)
    SECTIONS = [
        "/tutorials/swiftui",
        "/tutorials/app-dev-training",
        "/news/",
    ]

    def get_urls(self) -> list[str]:
        """Get list of Apple documentation URLs."""
        return [f"{self.BASE_URL}{section}" for section in self.SECTIONS]

    async def scrape(self) -> list[ScrapedDocument]:
        """Scrape Apple Developer Documentation.

        Returns:
            List of scraped documents
        """
        documents = []

        for section in self.SECTIONS:
            url = f"{self.BASE_URL}{section}"
            try:
                html = await self.fetch(url)
                docs = self._parse_section(html, url, section)
                documents.extend(docs)
                logger.info(f"Scraped {len(docs)} docs from {section}")
            except Exception as e:
                logger.error(f"Failed to scrape {url}: {e}")

        logger.info(f"Total Apple docs scraped: {len(documents)}")
        return documents

    def _parse_section(
        self, html: str, url: str, section: str
    ) -> list[ScrapedDocument]:
        """Parse Apple page.

        Args:
            html: Raw HTML content
            url: Page URL
            section: Section path

        Returns:
            List of parsed documents
        """
        soup = BeautifulSoup(html, "html.parser")
        documents = []

        # Try multiple content selectors (Apple uses various structures)
        content_div = (
            soup.find("main")
            or soup.find("article")
            or soup.find("div", class_="main")
            or soup.find("div", class_="content")
            or soup.find("body")  # Fallback
        )

        if not content_div:
            logger.warning(f"No content found for {url}")
            return []

        # Get title
        title_el = soup.find("h1") or soup.find("title")
        title = title_el.get_text(strip=True) if title_el else section.split("/")[-1]

        # Remove non-content elements
        for el in content_div.find_all(["script", "style", "nav", "footer", "aside", "header"]):
            el.decompose()

        # Extract clean text
        content = content_div.get_text(separator="\n", strip=True)

        # Skip if content too short (likely JS-rendered)
        if len(content) < 200:
            logger.debug(f"Skipping {url} - content too short ({len(content)} chars)")
            return []

        # Generate unique ID
        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        documents.append(
            ScrapedDocument(
                id=f"apple_{doc_id}",
                title=title,
                content=content[:50000],
                url=url,
                source="apple",
                topic=self._infer_topic(section),
                scraped_at=datetime.now(timezone.utc),
                metadata={"section": section},
            )
        )

        return documents

    def _infer_topic(self, section: str) -> str:
        """Infer topic from section path."""
        section_lower = section.lower()

        if "concurrency" in section_lower or "combine" in section_lower:
            return "concurrency"
        if "swiftui" in section_lower:
            return "swiftui"
        if "uikit" in section_lower:
            return "uikit"
        if "test" in section_lower:
            return "testing"
        if "swift" in section_lower:
            return "swift"
        return "ios-core"
