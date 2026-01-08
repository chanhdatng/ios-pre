"""Scraper for Hacking with Swift articles."""

import hashlib
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from ..utils.logging import get_logger
from .base_scraper import BaseScraper
from .models import ScrapedDocument

logger = get_logger(__name__)


class HWSScraper(BaseScraper):
    """Scraper for Hacking with Swift educational content."""

    BASE_URL = "https://www.hackingwithswift.com"

    # Key articles for Senior iOS interviews (with article IDs)
    ARTICLE_PATHS = [
        "/articles/269/whats-new-in-swift-6",
        "/articles/277/whats-new-in-swift-6-2",
        "/articles/258/whats-new-in-swift-5-9",
        "/articles/247/whats-new-in-swift-5-6",
        "/articles/281/what-to-fix-in-ai-generated-swift-code",
        "/articles/245/build-your-first-swiftui-app-with-swift-playgrounds",
    ]

    def get_urls(self) -> list[str]:
        """Get list of HWS URLs."""
        return [f"{self.BASE_URL}{path}" for path in self.ARTICLE_PATHS]

    async def scrape(self) -> list[ScrapedDocument]:
        """Scrape Hacking with Swift articles.

        Returns:
            List of scraped documents
        """
        documents = []

        for path in self.ARTICLE_PATHS:
            url = f"{self.BASE_URL}{path}"
            try:
                html = await self.fetch(url)
                doc = self._parse_article(html, url)
                if doc:
                    documents.append(doc)
                    logger.info(f"Scraped: {doc.title}")
            except Exception as e:
                logger.error(f"Failed to scrape {url}: {e}")

        logger.info(f"Total HWS docs scraped: {len(documents)}")
        return documents

    def _parse_article(self, html: str, url: str) -> ScrapedDocument | None:
        """Parse HWS article page.

        Args:
            html: Raw HTML content
            url: Page URL

        Returns:
            Parsed document or None
        """
        soup = BeautifulSoup(html, "html.parser")

        # Find main content - HWS uses div.cd-section for article content
        content_el = (
            soup.find("div", class_="cd-section")
            or soup.find("article")
            or soup.find("main")
        )

        if not content_el:
            logger.warning(f"No article content found for {url}")
            return None

        # Get title
        title_el = soup.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Unknown Article"

        # Clean content
        for el in content_el.find_all(["script", "style", "nav", "aside", "footer", "header"]):
            el.decompose()

        content = content_el.get_text(separator="\n", strip=True)

        if len(content) < 100:
            return None

        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        return ScrapedDocument(
            id=f"hws_{doc_id}",
            title=title,
            content=content[:50000],
            url=url,
            source="hws",
            topic=self._infer_topic(url),
            scraped_at=datetime.now(timezone.utc),
        )

    def _infer_topic(self, url: str) -> str:
        """Infer topic from URL."""
        url_lower = url.lower()

        if "concurrency" in url_lower:
            return "concurrency"
        if "swiftui" in url_lower:
            return "swiftui"
        if "testing" in url_lower:
            return "testing"
        return "swift"
