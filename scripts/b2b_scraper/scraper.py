#!/usr/bin/env python3
"""B2B Catalog Scraper CLI.

Usage:
  b2b-scraper ergen                    # Scrape Ergen full catalog
  b2b-scraper bayikanali              # Scrape BayiKanali
  b2b-scraper all                    # Scrape all sites
  b2b-scraper ergen --discover      # Discover site structure first
  b2b-scraper ergen --json          # Output as JSON
  b2b-scraper ergen --csv           # Output as CSV
"""

import sys
import json
import argparse
import logging
import time
from datetime import datetime
from pathlib import Path

# Add parent to path so we can import as package
sys.path.insert(0, str(Path(__file__).parent.parent))

from b2b_scraper.config import SITES
from b2b_scraper.models import ScrapedProduct, ScrapedCategory, ScraperResult
from b2b_scraper.storage import save_json, save_csv, products_to_dict
from b2b_scraper.auth import get_cookies, is_session_valid
from b2b_scraper.parsers.ergen import ErgenParser
from b2b_scraper.parsers.bayikanali import BayikanaliParser
from b2b_scraper.parsers.b2bdepo import B2BDepoParser
from b2b_scraper.parsers.tesan import TesanParser
from b2b_scraper.parsers.edenge import EdengeParser
from b2b_scraper.parsers.inox import InoxParser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("b2b-scraper")

PARSERS = {
    "ergen": ErgenParser,
    "bayikanali": BayikanaliParser,
    "b2bdepo": B2BDepoParser,
    "tesan": TesanParser,
    "edenge": EdengeParser,
    "inox": InoxParser,
}

# Default API URL for sync
DEFAULT_SYNC_API = "http://localhost:3000/api/admin/scrapers/sync"


def sync_to_api(products: list[ScrapedProduct], site: str, api_url: str = DEFAULT_SYNC_API) -> dict:
    """Send scraped products to the Next.js sync API endpoint."""
    import requests as http_requests

    payload = {
        "supplierCode": site,
        "products": products_to_dict(products),
    }

    logger.info("Syncing %d products from %s to API...", len(products), site)

    try:
        resp = http_requests.post(
            api_url,
            json=payload,
            timeout=300,
            headers={"Content-Type": "application/json"},
        )
        data = resp.json()

        if resp.status_code == 200 and data.get("success"):
            result = data.get("data", {})
            logger.info("Sync SUCCESS: %d new, %d updated, %d errors (%dms)",
                        result.get("productsNew", 0),
                        result.get("productsUpdated", 0),
                        result.get("errorsCount", 0),
                        result.get("durationMs", 0))
            return {"success": True, "data": result}
        else:
            logger.error("Sync FAILED: %s", data.get("error", resp.text))
            return {"success": False, "error": data.get("error", resp.text)}

    except Exception as e:
        logger.error("Sync API error: %s", e)
        return {"success": False, "error": str(e)}


def scrape_site(site: str, output_format: str = "json", do_sync: bool = False, api_url: str = DEFAULT_SYNC_API) -> ScraperResult:
    """Scrape all products from a single site."""
    config = SITES.get(site)
    if not config:
        logger.error("Unknown site: %s", site)
        sys.exit(1)

    result = ScraperResult(site=site)

    # Check session
    if not is_session_valid(site):
        logger.error("No valid session for %s - run bayi-login.py setup", site)
        result.status = "failed"
        result.errors.append("No valid session")
        return result

    # Get parser
    parser_cls = PARSERS.get(site)
    if not parser_cls:
        logger.error("No parser for %s yet", site)
        result.status = "failed"
        result.errors.append("No parser implemented")
        return result

    parser = parser_cls()

    # Step 1: Get categories
    logger.info("Discovering categories for %s...", config.name)
    categories = parser.get_categories()
    result.categories = categories
    logger.info("Found %d categories", len(categories))

    if not categories:
        logger.warning("No categories found - try --discover mode")
        result.status = "completed"
        return result

    # Step 2: Scrape products from each category
    all_products: list[ScrapedProduct] = []
    for i, cat in enumerate(categories, 1):
        logger.info("[%d/%d] Scraping %s: %s", i, len(categories), config.name, cat.name)
        products = parser.get_products(cat.url)
        if products:
            logger.info("  -> %d products", len(products))
            all_products.extend(products)
        else:
            logger.warning("  -> No products found")
        time.sleep(config.delay)

    result.products = all_products
    result.status = "completed"
    result.finishedAt = datetime.now().isoformat()

    # Step 3: Save output
    if all_products:
        if output_format in ("json", "both"):
            json_file = save_json(all_products, site)
            logger.info("Saved JSON: %s (%d products)", json_file, len(all_products))

        if output_format in ("csv", "both"):
            csv_file = save_csv(all_products, site)
            logger.info("Saved CSV: %s", csv_file)

        # Summary
        logger.info("=" * 60)
        logger.info("SCRAPING COMPLETE: %s", config.name)
        logger.info("  Categories: %d", len(categories))
        logger.info("  Products:  %d", len(all_products))
        if all_products:
            prices = [p.price for p in all_products if p.price]
            if prices:
                logger.info("  Price range: $%.0f - $%.0f", min(prices), max(prices))
            in_stock = sum(1 for p in all_products if p.stockOk)
            logger.info("  In stock:   %d / %d", in_stock, len(all_products))
        logger.info("=" * 60)

        # Step 4: Sync to API if requested
        if do_sync:
            sync_result = sync_to_api(all_products, site, api_url)
            if sync_result.get("success"):
                logger.info("API Sync: SUCCESS")
            else:
                logger.error("API Sync: FAILED - %s", sync_result.get("error"))
    else:
        logger.warning("No products scraped from %s", config.name)

    return result


def discover_site(site: str) -> None:
    """Discover site structure - fetch pages and print what we find."""
    config = SITES.get(site)
    if not config:
        logger.error("Unknown site: %s", site)
        return

    cookies = get_cookies(site)
    if not cookies:
        logger.error("No cookies - run bayi-login.py first")
        return

    from scrapling import StealthyFetcher
    fetcher = StealthyFetcher(auto_match=False)

    urls_to_test = [
        config.base_url,
        config.login_url,
    ]

    # Add category-like URLs
    for path in ["/kategori", "/kategoriler", "/urunler", "/products",
                 "/bildirim/yeni_urunler", "/bildirim/populer_urunler"]:
        urls_to_test.append(f"{config.base_url}{path}")

    for url in urls_to_test:
        logger.info("\n--- Fetching: %s ---", url)
        try:
            page = fetcher.fetch(
                url,
                headless=True,
                network_idle=True,
                cookies=cookies,
            )
            if page:
                text = page.get_all_text(separator="\n")
                logger.info("Status: OK (%d chars)", len(text))
                # Print first 50 lines
                for line in text.split("\n")[:50]:
                    line = line.strip()
                    if line:
                        print(f"  {line[:120]}")
            else:
                logger.warning("Status: FAILED (no page)")
        except Exception as e:
            logger.error("Error: %s", e)
        time.sleep(2)


def main():
    parser = argparse.ArgumentParser(
        description="B2B Catalog Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("site", help="Site to scrape (ergen, bayikanali, b2bdepo, tesan, edenge, inox) or 'all'")
    parser.add_argument("--discover", action="store_true", help="Discover site structure")
    parser.add_argument("--format", choices=["json", "csv", "both"], default="json", help="Output format")
    parser.add_argument("--json", action="store_true", help="Shorthand for --format json")
    parser.add_argument("--csv", action="store_true", help="Shorthand for --format csv")
    parser.add_argument("--sync", action="store_true", help="Sync scraped products to Next.js API")
    parser.add_argument("--api-url", default=DEFAULT_SYNC_API, help="Sync API endpoint URL")

    args = parser.parse_args()

    fmt = args.format
    if args.csv:
        fmt = "csv"
    elif args.json:
        fmt = "json"

    if args.discover:
        if args.site == "all":
            for site in SITES:
                discover_site(site)
        else:
            discover_site(args.site)
        return

    if args.site == "all":
        results = {}
        for site in SITES:
            if site in PARSERS:
                logger.info("\n" + "=" * 60)
                logger.info("SCRAPING: %s", SITES[site].name)
                logger.info("=" * 60)
                try:
                    result = scrape_site(site, fmt, args.sync, args.api_url)
                    results[site] = {
                        "status": result.status,
                        "products": len(result.products),
                        "categories": len(result.categories),
                        "errors": result.errors,
                    }
                except Exception as e:
                    logger.error("Failed: %s", e)
                    results[site] = {"status": "error", "error": str(e)}
                time.sleep(5)

        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("ALL SITES SUMMARY")
        logger.info("=" * 60)
        for site, info in results.items():
            logger.info("  %-15s: %s (%d products)", site, info.get("status"), info.get("products", 0))
    else:
        result = scrape_site(args.site, fmt, args.sync, args.api_url)


if __name__ == "__main__":
    main()
