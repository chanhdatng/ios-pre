# Phase 2: Source Scrapers

## Context
- [Plan Overview](./plan.md)
- [Phase 1: Infrastructure](./phase-01-infrastructure-setup.md)

## Overview
| Priority | Status | Effort |
|----------|--------|--------|
| P1 | ✅ Complete | 4h |

**Review:** [code-reviewer-260107-1910-phase2-scrapers.md](../reports/code-reviewer-260107-1910-phase2-scrapers.md)

Implement scrapers for iOS documentation sources: Apple Developer Docs, Hacking with Swift, Swift.org.

## Requirements

### Functional
- Scrape Apple Developer Documentation (Swift, UIKit, SwiftUI, Concurrency)
- Scrape Hacking with Swift articles
- Scrape Swift.org documentation
- Extract clean text with metadata
- Rate limiting to avoid blocks

### Non-Functional
- Async HTTP requests
- Retry logic with exponential backoff
- Progress logging
- Checkpointing (resume interrupted scrapes)

## Architecture

```
scrapers/
├── __init__.py
├── base_scraper.py        # Abstract base class
├── apple_docs_scraper.py  # Apple Developer Docs
├── hws_scraper.py         # Hacking with Swift
├── swift_org_scraper.py   # Swift.org
└── models.py              # Pydantic models for scraped data
```

## Files to Create

| Action | Path | Description |
|--------|------|-------------|
| Create | `pipeline/scrapers/__init__.py` | Scrapers init |
| Create | `pipeline/scrapers/models.py` | Data models |
| Create | `pipeline/scrapers/base_scraper.py` | Base scraper class |
| Create | `pipeline/scrapers/apple_docs_scraper.py` | Apple docs scraper |
| Create | `pipeline/scrapers/hws_scraper.py` | HWS scraper |
| Create | `pipeline/scrapers/swift_org_scraper.py` | Swift.org scraper |

## Implementation Steps

### 1. Create models.py
```python
from pydantic import BaseModel
from datetime import datetime

class ScrapedDocument(BaseModel):
    id: str
    title: str
    content: str
    url: str
    source: str  # "apple", "hws", "swift_org"
    topic: str   # "swift", "swiftui", "concurrency", etc.
    scraped_at: datetime
    swift_version: str | None = None
    metadata: dict = {}
```

### 2. Create base_scraper.py
```python
from abc import ABC, abstractmethod
import httpx
import asyncio
from .models import ScrapedDocument

class BaseScraper(ABC):
    def __init__(self, rate_limit: float = 1.0):
        self.rate_limit = rate_limit  # seconds between requests
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"User-Agent": "iOS-Prep-Pipeline/1.0"}
        )

    async def fetch(self, url: str, retries: int = 3) -> str:
        for attempt in range(retries):
            try:
                await asyncio.sleep(self.rate_limit)
                response = await self.client.get(url)
                response.raise_for_status()
                return response.text
            except Exception as e:
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)

    @abstractmethod
    async def scrape(self) -> list[ScrapedDocument]:
        pass

    @abstractmethod
    def get_urls(self) -> list[str]:
        pass
```

### 3. Create apple_docs_scraper.py
```python
from bs4 import BeautifulSoup
from datetime import datetime
from .base_scraper import BaseScraper
from .models import ScrapedDocument
import hashlib

class AppleDocsScraper(BaseScraper):
    BASE_URL = "https://developer.apple.com/documentation"

    # Key documentation sections for Senior iOS
    SECTIONS = [
        "/swift",
        "/swift/swift-standard-library",
        "/swiftui",
        "/uikit",
        "/swift/concurrency",
        "/combine",
        "/foundation",
        "/xcode/testing",
    ]

    def get_urls(self) -> list[str]:
        return [f"{self.BASE_URL}{section}" for section in self.SECTIONS]

    async def scrape(self) -> list[ScrapedDocument]:
        documents = []
        for section in self.SECTIONS:
            url = f"{self.BASE_URL}{section}"
            try:
                html = await self.fetch(url)
                docs = self._parse_section(html, url, section)
                documents.extend(docs)
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")
        return documents

    def _parse_section(self, html: str, url: str, section: str) -> list[ScrapedDocument]:
        soup = BeautifulSoup(html, "html.parser")
        documents = []

        # Extract main content
        content_div = soup.find("main") or soup.find("article")
        if not content_div:
            return []

        # Get title
        title = soup.find("h1")
        title_text = title.get_text(strip=True) if title else section

        # Clean content
        for script in content_div.find_all(["script", "style", "nav"]):
            script.decompose()

        content = content_div.get_text(separator="\n", strip=True)

        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        documents.append(ScrapedDocument(
            id=f"apple_{doc_id}",
            title=title_text,
            content=content[:50000],  # Limit content size
            url=url,
            source="apple",
            topic=self._infer_topic(section),
            scraped_at=datetime.now(),
            metadata={"section": section}
        ))

        return documents

    def _infer_topic(self, section: str) -> str:
        if "swift" in section.lower() and "ui" not in section.lower():
            return "swift"
        if "swiftui" in section.lower():
            return "swiftui"
        if "uikit" in section.lower():
            return "uikit"
        if "concurrency" in section.lower():
            return "concurrency"
        if "combine" in section.lower():
            return "concurrency"
        if "test" in section.lower():
            return "testing"
        return "ios-core"
```

### 4. Create hws_scraper.py
```python
from bs4 import BeautifulSoup
from datetime import datetime
from .base_scraper import BaseScraper
from .models import ScrapedDocument
import hashlib
import re

class HWScraper(BaseScraper):
    BASE_URL = "https://www.hackingwithswift.com"

    # Key sections for Senior iOS
    ARTICLE_URLS = [
        "/quick-start/concurrency",
        "/swift/swift-versions",
        "/articles/ultimate-guide-to-swiftui",
        "/articles/testing-your-code",
    ]

    def get_urls(self) -> list[str]:
        return [f"{self.BASE_URL}{path}" for path in self.ARTICLE_URLS]

    async def scrape(self) -> list[ScrapedDocument]:
        documents = []
        for path in self.ARTICLE_URLS:
            url = f"{self.BASE_URL}{path}"
            try:
                html = await self.fetch(url)
                doc = self._parse_article(html, url)
                if doc:
                    documents.append(doc)
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")
        return documents

    def _parse_article(self, html: str, url: str) -> ScrapedDocument | None:
        soup = BeautifulSoup(html, "html.parser")

        # Find main content
        article = soup.find("article") or soup.find("main")
        if not article:
            return None

        title = soup.find("h1")
        title_text = title.get_text(strip=True) if title else "Unknown"

        # Clean
        for el in article.find_all(["script", "style", "nav", "aside"]):
            el.decompose()

        content = article.get_text(separator="\n", strip=True)

        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        return ScrapedDocument(
            id=f"hws_{doc_id}",
            title=title_text,
            content=content[:50000],
            url=url,
            source="hws",
            topic=self._infer_topic(url),
            scraped_at=datetime.now(),
        )

    def _infer_topic(self, url: str) -> str:
        if "concurrency" in url:
            return "concurrency"
        if "swiftui" in url.lower():
            return "swiftui"
        if "testing" in url:
            return "testing"
        return "swift"
```

### 5. Create swift_org_scraper.py
```python
from bs4 import BeautifulSoup
from datetime import datetime
from .base_scraper import BaseScraper
from .models import ScrapedDocument
import hashlib

class SwiftOrgScraper(BaseScraper):
    BASE_URL = "https://docs.swift.org"

    DOCS = [
        "/swift-book/documentation/the-swift-programming-language/aboutswift",
        "/swift-book/documentation/the-swift-programming-language/basicoperators",
        "/swift-book/documentation/the-swift-programming-language/closures",
        "/swift-book/documentation/the-swift-programming-language/protocols",
        "/swift-book/documentation/the-swift-programming-language/generics",
        "/swift-book/documentation/the-swift-programming-language/concurrency",
        "/swift-book/documentation/the-swift-programming-language/macros",
    ]

    def get_urls(self) -> list[str]:
        return [f"{self.BASE_URL}{doc}" for doc in self.DOCS]

    async def scrape(self) -> list[ScrapedDocument]:
        documents = []
        for doc_path in self.DOCS:
            url = f"{self.BASE_URL}{doc_path}"
            try:
                html = await self.fetch(url)
                doc = self._parse_doc(html, url)
                if doc:
                    documents.append(doc)
            except Exception as e:
                print(f"Failed to scrape {url}: {e}")
        return documents

    def _parse_doc(self, html: str, url: str) -> ScrapedDocument | None:
        soup = BeautifulSoup(html, "html.parser")

        content_div = soup.find("main") or soup.find("article")
        if not content_div:
            return None

        title = soup.find("h1")
        title_text = title.get_text(strip=True) if title else "Swift Documentation"

        for el in content_div.find_all(["script", "style", "nav"]):
            el.decompose()

        content = content_div.get_text(separator="\n", strip=True)

        doc_id = hashlib.md5(url.encode()).hexdigest()[:12]

        return ScrapedDocument(
            id=f"swift_{doc_id}",
            title=title_text,
            content=content[:50000],
            url=url,
            source="swift_org",
            topic="swift",
            scraped_at=datetime.now(),
        )
```

### 6. Create __init__.py
```python
from .apple_docs_scraper import AppleDocsScraper
from .hws_scraper import HWScraper
from .swift_org_scraper import SwiftOrgScraper
from .models import ScrapedDocument

__all__ = [
    "AppleDocsScraper",
    "HWScraper",
    "SwiftOrgScraper",
    "ScrapedDocument",
]
```

## Todo List

- [x] Create models.py with ScrapedDocument
- [x] Implement base_scraper.py with rate limiting
- [x] Implement apple_docs_scraper.py
- [x] Implement hws_scraper.py
- [x] Implement swift_org_scraper.py
- [x] Fix Priority 1 issues (datetime.utc, __aexit__, HTTPError)
- [x] Test each scraper individually
- [ ] Add checkpoint/resume support (deferred - not critical for MVP)
- [ ] Save scraped data to JSON for verification (deferred - not critical for MVP)

## Test Results

| Scraper | Documents | Status |
|---------|-----------|--------|
| HWS | 6 docs (148K chars) | ✅ Working |
| Swift.org | 5 docs (37K chars) | ✅ Working |
| Apple | 1 doc (50K chars) | ⚠️ Limited (JS rendering) |
| **Total** | **12 documents** | ✅ |

## Success Criteria

- [x] Each scraper returns valid ScrapedDocument list
- [x] Rate limiting works (no 429 errors)
- [x] Content is clean (no HTML tags, scripts)
- [x] Metadata correctly populated
- [ ] Can resume interrupted scrapes (deferred)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Site blocks scraper | Rate limit, user-agent, retry |
| HTML structure changes | Fallback selectors, error logging |
| Content too large | Truncate at 50k chars |

## Next Steps

After completion, proceed to [Phase 3: Embedding Pipeline](./phase-03-embedding-pipeline.md)
