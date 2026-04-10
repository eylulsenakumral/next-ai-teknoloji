"""Base parser class for B2B site scrapers."""

import time
import logging
from abc import ABC, abstractmethod
from typing import Any

from scrapling import StealthyFetcher

from ..models import ScrapedProduct, ScrapedCategory
from ..config import SITES
from ..auth import get_cookies

logger = logging.getLogger("b2b-scraper.base")


class BaseParser(ABC):
    """Base class for all B2B site parsers."""

    site_code: str = ""

    def __init__(self):
        if not self.site_code:
            raise ValueError("site_code must be set by subclass")
        self.config = SITES[self.site_code]
        self.cookies = get_cookies(self.site_code)
        if not self.cookies:
            raise RuntimeError(
                f"No {self.config.name} cookies found - run bayi-login.py first"
            )
        self.fetcher = StealthyFetcher(auto_match=False)

    def _fetch(self, url: str) -> Any | None:
        """Fetch page with Scrapling using injected cookies."""
        try:
            page = self.fetcher.fetch(
                url,
                headless=True,
                network_idle=True,
                cookies=self.cookies,
            )
            if page is None:
                logger.warning("Failed to fetch: %s", url)
                return None
            return page
        except Exception as e:
            logger.error("Fetch error %s: %s", url, e)
            return None
        finally:
            time.sleep(self.config.delay)

    def _fetch_text(self, url: str) -> str:
        """Fetch page and return full text content."""
        page = self._fetch(url)
        if page is None:
            return ""
        return page.get_all_text(separator="\n")

    @abstractmethod
    def get_categories(self) -> list[ScrapedCategory]:
        """Discover and return all category URLs."""
        ...

    @abstractmethod
    def get_products(self, category_url: str) -> list[ScrapedProduct]:
        """Parse products from a category page."""
        ...

    def get_product_detail(self, product_url: str) -> ScrapedProduct | None:
        """Fetch and parse a single product detail page. Optional."""
        return None
