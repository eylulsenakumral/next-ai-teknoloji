"""Scrapling fetcher with cookie injection and rate limiting."""

import time
import logging
from typing import Any

from scrapling import StealthyFetcher

from .config import SITES
from .auth import get_cookies, solve_cloudflare

logger = logging.getLogger("b2b-scraper.fetcher")


class PageFetcher:
    """Fetches pages using Scrapling with injected cookies."""

    def __init__(self):
        self.fetcher = StealthyFetcher(auto_match=False)
        logger.info("PageFetcher initialized")

    def fetch_page(self, url: str, site: str) -> Any | None:
        """Fetch a single page with cookie injection."""
        config = SITES.get(site)
        if not config:
            raise ValueError(f"Unknown site: {site}")

        cookies = get_cookies(site)
        if not cookies:
            raise ValueError(f"No cookies for {site} - run bayi-login first")

        try:
            page = self.fetcher.fetch(
                url,
                headless=True,
                network_idle=True,
                cookies=cookies,
            )
            if page is None:
                logger.warning("Failed to fetch %s", url)
                return None

            logger.info("Fetched %s (%d chars)", url, len(page.get_all_text()))
            return page
        except Exception as e:
            logger.error("Scrapling fetch error: %s", e)
            return None
        finally:
            time.sleep(config.delay)

    def fetch_page_flare(self, url: str) -> str | None:
        """Fetch page via FlareSolverr (for Cloudflare-protected sites)."""
        solution = solve_cloudflare(url)
        if solution:
            html = solution.get("response", "")
            logger.info("FlareSolverr fetched %s (%d chars)", url, len(html))
            return html
        return None

    def fetch_page_auto(self, url: str, site: str) -> Any | None:
        """Auto-select fetch method based on site config."""
        config = SITES.get(site)
        if config.cloudflare:
            return self.fetch_page_flare(url)
        return self.fetch_page(url, site)
