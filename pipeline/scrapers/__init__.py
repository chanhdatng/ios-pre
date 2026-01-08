"""Source scrapers for iOS documentation."""

from .apple_docs_scraper import AppleDocsScraper
from .base_scraper import BaseScraper
from .hws_scraper import HWSScraper
from .kodeco_scraper import KodecoScraper
from .models import ScrapedDocument
from .objcio_scraper import ObjcIOScraper
from .swift_org_scraper import SwiftOrgScraper
from .swiftlee_scraper import SwiftLeeScraper

__all__ = [
    "AppleDocsScraper",
    "BaseScraper",
    "HWSScraper",
    "KodecoScraper",
    "ObjcIOScraper",
    "ScrapedDocument",
    "SwiftLeeScraper",
    "SwiftOrgScraper",
]
