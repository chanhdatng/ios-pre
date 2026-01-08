"""Scraper for Kodeco (formerly RayWenderlich) tutorials."""

import hashlib
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from ..utils.logging import get_logger
from .base_scraper import BaseScraper
from .models import ScrapedDocument

logger = get_logger(__name__)


class KodecoScraper(BaseScraper):
    """Scraper for Kodeco iOS tutorials."""

    BASE_URL = "https://www.kodeco.com"

    # Key tutorials for Senior iOS interviews
    ARTICLE_PATHS = [
        "/books/concurrency-by-tutorials",
        "/books/combine-asynchronous-programming-with-swift",
        "/books/swift-apprentice-fundamentals",
        "/38-core-data-fundamentals",
        "/38311244-an-introduction-to-swiftdata",
        "/26244793-getting-started-with-swift-concurrency",
        "/27757095-asyncsequence-asyncstream-tutorial-for-swift",
        "/43960-swiftui-state-management",
        "/29473060-getting-started-with-instruments",
        "/30422596-app-thinning-in-ios-development",
        "/6398124-dependency-injection-tutorial-for-ios",
        "/31928884-the-composable-architecture-getting-started",
        "/29478144-swift-test-doubles-patterns",
    ]

    def get_urls(self) -> list[str]:
        """Get list of Kodeco URLs."""
        return [f"{self.BASE_URL}{path}" for path in self.ARTICLE_PATHS]

    async def scrape(self) -> list[ScrapedDocument]:
        """Scrape Kodeco tutorials."""
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

        logger.info(f"Total Kodeco docs scraped: {len(documents)}")
        return documents

    def _parse_article(self, html: str, url: str) -> ScrapedDocument | None:
        """Parse Kodeco tutorial page."""
        soup = BeautifulSoup(html, "html.parser")

        # Kodeco uses various content containers
        content_el = (
            soup.find("div", class_="content-wrapper")
            or soup.find("article", class_="tutorial")
            or soup.find("div", class_="c-tutorial")
            or soup.find("article")
            or soup.find("main")
        )

        if not content_el:
            logger.warning(f"No content found for {url}")
            return None

        # Get title
        title_el = (
            soup.find("h1", class_="c-tutorial-nav__title")
            or soup.find("h1")
            or soup.find("title")
        )
        title = title_el.get_text(strip=True) if title_el else "Unknown Tutorial"
        title = title.replace(" | Kodeco", "").replace(" | raywenderlich.com", "")

        # Clean content
        for el in content_el.find_all(["script", "style", "nav", "aside", "footer", "header"]):
            el.decompose()

        content = content_el.get_text(separator="\n", strip=True)

        if len(content) < 100:
            return None

        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        return ScrapedDocument(
            id=f"kodeco_{doc_id}",
            title=title,
            content=content[:50000],
            url=url,
            source="kodeco",
            topic=self._infer_topic(url, title),
            scraped_at=datetime.now(timezone.utc),
        )

    def _infer_topic(self, url: str, title: str) -> str:
        """Infer topic from URL and title."""
        text = f"{url} {title}".lower()

        if any(k in text for k in ["concurrency", "async", "actor"]):
            return "concurrency"
        if any(k in text for k in ["combine", "publisher"]):
            return "combine"
        if any(k in text for k in ["core-data", "swiftdata", "coredata"]):
            return "data_persistence"
        if any(k in text for k in ["test", "tdd"]):
            return "testing"
        if any(k in text for k in ["instrument", "performance", "thinning"]):
            return "performance"
        if any(k in text for k in ["dependency", "composable", "architecture", "mvvm"]):
            return "architecture"
        if any(k in text for k in ["swiftui", "state"]):
            return "swiftui"
        return "swift"
