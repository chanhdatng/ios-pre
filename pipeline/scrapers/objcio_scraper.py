"""Scraper for objc.io articles and books."""

import hashlib
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from ..utils.logging import get_logger
from .base_scraper import BaseScraper
from .models import ScrapedDocument

logger = get_logger(__name__)


class ObjcIOScraper(BaseScraper):
    """Scraper for objc.io advanced iOS content."""

    BASE_URL = "https://www.objc.io"

    # Key articles from objc.io issues (deep technical content)
    ARTICLE_PATHS = [
        "/issues/2-concurrency/concurrency-apis-and-pitfalls/",
        "/issues/2-concurrency/common-background-practices/",
        "/issues/4-core-data/core-data-overview/",
        "/issues/4-core-data/core-data-fetch-requests/",
        "/issues/8-quadcopter/functional-reactive-programming/",
        "/issues/13-architecture/viper/",
        "/issues/13-architecture/mvvm/",
        "/issues/15-testing/xctest/",
        "/issues/15-testing/dependency-injection/",
        "/issues/16-swift/swift-functions/",
        "/issues/16-swift/power-of-swift/",
        "/issues/18-games/functional-swift/",
        "/issues/25-audio/audio-api-overview/",
        "/issues/28-animations/animations-explained/",
    ]

    def get_urls(self) -> list[str]:
        """Get list of objc.io URLs."""
        return [f"{self.BASE_URL}{path}" for path in self.ARTICLE_PATHS]

    async def scrape(self) -> list[ScrapedDocument]:
        """Scrape objc.io articles."""
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

        logger.info(f"Total objc.io docs scraped: {len(documents)}")
        return documents

    def _parse_article(self, html: str, url: str) -> ScrapedDocument | None:
        """Parse objc.io article page."""
        soup = BeautifulSoup(html, "html.parser")

        # objc.io uses article or main content containers
        content_el = (
            soup.find("article")
            or soup.find("div", class_="article-content")
            or soup.find("main")
            or soup.find("div", class_="content")
        )

        if not content_el:
            logger.warning(f"No content found for {url}")
            return None

        # Get title
        title_el = soup.find("h1") or soup.find("title")
        title = title_el.get_text(strip=True) if title_el else "Unknown Article"
        title = title.replace(" - objc.io", "")

        # Clean content
        for el in content_el.find_all(["script", "style", "nav", "aside", "footer"]):
            el.decompose()

        content = content_el.get_text(separator="\n", strip=True)

        if len(content) < 100:
            return None

        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        return ScrapedDocument(
            id=f"objcio_{doc_id}",
            title=title,
            content=content[:50000],
            url=url,
            source="objcio",
            topic=self._infer_topic(url, title),
            scraped_at=datetime.now(timezone.utc),
        )

    def _infer_topic(self, url: str, title: str) -> str:
        """Infer topic from URL and title."""
        text = f"{url} {title}".lower()

        if any(k in text for k in ["concurrency", "background", "gcd", "operation"]):
            return "concurrency"
        if any(k in text for k in ["core-data", "coredata", "fetch"]):
            return "data_persistence"
        if any(k in text for k in ["reactive", "functional"]):
            return "combine"
        if any(k in text for k in ["viper", "mvvm", "architecture", "injection"]):
            return "architecture"
        if any(k in text for k in ["test", "xctest"]):
            return "testing"
        if any(k in text for k in ["animation"]):
            return "uikit"
        return "swift"
