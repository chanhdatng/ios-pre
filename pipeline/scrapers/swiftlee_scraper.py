"""Scraper for SwiftLee blog articles."""

import hashlib
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from ..utils.logging import get_logger
from .base_scraper import BaseScraper
from .models import ScrapedDocument

logger = get_logger(__name__)


class SwiftLeeScraper(BaseScraper):
    """Scraper for SwiftLee iOS development blog."""

    BASE_URL = "https://www.avanderlee.com"

    # Key articles for Senior iOS interviews
    ARTICLE_PATHS = [
        "/swift/actors-in-swift-how-to-use-and-prevent-data-races/",
        "/swift/nonisolated-isolated-keywords-swift-concurrency/",
        "/concurrency/concurrency-in-swift/",
        "/swift/async-await-in-swift-explained-with-code-examples/",
        "/swift/mainactor-usage-in-swift-explained/",
        "/swift/sendable-protocol-explained/",
        "/combine/getting-started-with-combine/",
        "/combine/publishers-in-combine-explained-with-code-examples/",
        "/swift/core-data/",
        "/swift/nspersistentcontainer/",
        "/swiftdata/swiftdata-in-swift-explained/",
        "/swift/dependency-injection-swift/",
        "/testing/unit-testing-best-practices-in-swift/",
        "/testing/xctassertequal-and-other-xctest-assertions/",
        "/swift/optionals-in-swift-explained/",
        "/swift/result-in-swift-explained/",
        "/debugging/memory-leaks-in-swift/",
        "/swift/weak-self-in-closures-swift/",
    ]

    def get_urls(self) -> list[str]:
        """Get list of SwiftLee URLs."""
        return [f"{self.BASE_URL}{path}" for path in self.ARTICLE_PATHS]

    async def scrape(self) -> list[ScrapedDocument]:
        """Scrape SwiftLee articles."""
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

        logger.info(f"Total SwiftLee docs scraped: {len(documents)}")
        return documents

    def _parse_article(self, html: str, url: str) -> ScrapedDocument | None:
        """Parse SwiftLee article page."""
        soup = BeautifulSoup(html, "html.parser")

        # SwiftLee uses article.post-content
        content_el = (
            soup.find("article", class_="post-content")
            or soup.find("div", class_="post-content")
            or soup.find("article")
            or soup.find("main")
        )

        if not content_el:
            logger.warning(f"No content found for {url}")
            return None

        # Get title
        title_el = soup.find("h1", class_="post-title") or soup.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Unknown Article"

        # Clean content
        for el in content_el.find_all(["script", "style", "nav", "aside", "footer"]):
            el.decompose()

        content = content_el.get_text(separator="\n", strip=True)

        if len(content) < 100:
            return None

        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        return ScrapedDocument(
            id=f"swiftlee_{doc_id}",
            title=title,
            content=content[:50000],
            url=url,
            source="swiftlee",
            topic=self._infer_topic(url, title),
            scraped_at=datetime.now(timezone.utc),
        )

    def _infer_topic(self, url: str, title: str) -> str:
        """Infer topic from URL and title."""
        text = f"{url} {title}".lower()

        if any(k in text for k in ["actor", "concurrency", "async", "await", "sendable", "mainactor"]):
            return "concurrency"
        if any(k in text for k in ["combine", "publisher", "subscriber"]):
            return "combine"
        if any(k in text for k in ["core-data", "swiftdata", "persistent"]):
            return "data_persistence"
        if any(k in text for k in ["test", "xctest"]):
            return "testing"
        if any(k in text for k in ["memory", "leak", "weak"]):
            return "performance"
        if any(k in text for k in ["dependency", "injection", "architecture"]):
            return "architecture"
        return "swift"
