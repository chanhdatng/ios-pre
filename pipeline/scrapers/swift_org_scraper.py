"""Scraper for Swift.org documentation."""

import hashlib
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from ..utils.logging import get_logger
from .base_scraper import BaseScraper
from .models import ScrapedDocument

logger = get_logger(__name__)


class SwiftOrgScraper(BaseScraper):
    """Scraper for Swift.org official documentation."""

    BASE_URL = "https://www.swift.org"

    # Swift.org static pages
    DOC_PATHS = [
        "/about/",
        "/getting-started/",
        "/documentation/",
        "/swift-evolution/",
        "/contributing/",
    ]

    def get_urls(self) -> list[str]:
        """Get list of Swift.org URLs."""
        return [f"{self.BASE_URL}{path}" for path in self.DOC_PATHS]

    async def scrape(self) -> list[ScrapedDocument]:
        """Scrape Swift.org documentation.

        Returns:
            List of scraped documents
        """
        documents = []

        for path in self.DOC_PATHS:
            url = f"{self.BASE_URL}{path}"
            try:
                html = await self.fetch(url)
                doc = self._parse_doc(html, url)
                if doc:
                    documents.append(doc)
                    logger.info(f"Scraped: {doc.title}")
            except Exception as e:
                logger.error(f"Failed to scrape {url}: {e}")

        logger.info(f"Total Swift.org docs scraped: {len(documents)}")
        return documents

    def _parse_doc(self, html: str, url: str) -> ScrapedDocument | None:
        """Parse Swift.org documentation page.

        Args:
            html: Raw HTML content
            url: Page URL

        Returns:
            Parsed document or None
        """
        soup = BeautifulSoup(html, "html.parser")

        # Find main content
        content_div = soup.find("main") or soup.find("article")
        if not content_div:
            logger.warning(f"No main content found for {url}")
            return None

        # Get title - H1 may be empty, use title tag as fallback
        title_el = soup.find("h1")
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            title_tag = soup.find("title")
            title = title_tag.get_text(strip=True) if title_tag else "Swift Documentation"
            # Clean up " | Swift.org" suffix
            title = title.replace(" | Swift.org", "")

        # Clean content
        for el in content_div.find_all(["script", "style", "nav", "footer"]):
            el.decompose()

        content = content_div.get_text(separator="\n", strip=True)

        if len(content) < 100:
            return None

        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        # Infer topic from URL path
        topic = "swift"
        if "concurrency" in url.lower():
            topic = "concurrency"

        return ScrapedDocument(
            id=f"swift_{doc_id}",
            title=title,
            content=content[:50000],
            url=url,
            source="swift_org",
            topic=topic,
            scraped_at=datetime.now(timezone.utc),
        )
