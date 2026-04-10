"""BayiKanali parser.

Scrapes categories and products from bayikanali.com.
Uses FlareSolverr for Cloudflare bypass + Scrapling.

Site structure:
- Angular SPA (JavaScript-rendered)
- Cloudflare protected
- Login required for prices
- Categories: SPA navigation
- Products: dynamically loaded cards
- Prices: TL format
"""

import re
import logging

from ..models import ScrapedProduct, ScrapedCategory
from ..config import SITES, FLARESOLVERR_URL
from ..auth import get_cookies, solve_cloudflare
from .base import BaseParser

logger = logging.getLogger("b2b-scraper.bayikanali")

BAYIKANALI = SITES["bayikanali"]


class BayikanaliParser(BaseParser):
    """Parser for bayikanali.com (Angular SPA + Cloudflare)."""

    site_code = "bayikanali"

    def _fetch_html(self, url: str) -> str:
        """Fetch page HTML via FlareSolverr for Cloudflare bypass."""
        solution = solve_cloudflare(url)
        if solution:
            return solution.get("response", "")
        logger.warning("FlareSolverr failed for %s", url)
        return ""

    def get_categories(self) -> list[ScrapedCategory]:
        """Discover categories from the homepage."""
        categories = []

        # BayiKanali is an Angular SPA - need FlareSolverr
        html = self._fetch_html(BAYIKANALI.base_url)
        if not html:
            logger.error("Cannot fetch BayiKanali homepage")
            return categories

        # Parse HTML for category links
        # Angular SPA typically uses routerLink or href with #/ patterns
        category_patterns = [
            r'href="([^"]*(?:kategori|category|urun|product)[^"]*)"',
            r'href="(/(?:bilgisayar|telefon|tablet|tv|oyun|aksesuar|ev-elektronigi|kisisel-bakim|giyim)[^"]*)"',
        ]

        seen = set()
        for pattern in category_patterns:
            matches = re.findall(pattern, html, re.I)
            for href in matches:
                if href in seen or len(href) < 3:
                    continue
                seen.add(href)

                # Extract name from URL slug
                name = href.rstrip("/").split("/")[-1].replace("-", " ").title()
                if not name:
                    continue

                full_url = f"{BAYIKANALI.base_url}{href}" if href.startswith("/") else href
                categories.append(ScrapedCategory(
                    name=name,
                    url=full_url,
                    site="bayikanali",
                ))

        logger.info("Found %d categories", len(categories))
        return categories

    def get_products(self, category_url: str) -> list[ScrapedProduct]:
        """Parse products from a category page."""
        products = []

        html = self._fetch_html(category_url)
        if not html:
            return products

        # Try to extract product data from HTML
        # Angular SPA may have JSON data embedded in script tags
        # or rendered HTML with product cards

        # Method 1: Look for JSON data in script tags
        json_products = self._extract_from_json(html, category_url)
        if json_products:
            products.extend(json_products)
            logger.info("Parsed %d products (JSON) from %s", len(products), category_url)
            return products

        # Method 2: Parse rendered HTML
        text_products = self._extract_from_html(html, category_url)
        products.extend(text_products)

        logger.info("Parsed %d products from %s", len(products), category_url)
        return products

    def _extract_from_json(self, html: str, category_url: str) -> list[ScrapedProduct]:
        """Extract products from embedded JSON data."""
        products = []

        # Look for product JSON in script tags or state transfer
        json_patterns = [
            r'window\["transferCache"\]\s*=\s*(\{.+?\});',
            r'"products"\s*:\s*(\[.+?\])',
            r'"items"\s*:\s*(\[.+?\])',
        ]

        import json
        for pattern in json_patterns:
            matches = re.findall(pattern, html, re.DOTALL)
            for match in matches:
                try:
                    data = json.loads(match)
                    if isinstance(data, list):
                        for item in data[:200]:
                            name = item.get("name", item.get("productName", item.get("title", "")))
                            if not name:
                                continue

                            price_str = str(item.get("price", item.get("unitPrice", "")))
                            price = None
                            if price_str and price_str != "None":
                                try:
                                    price = float(str(price_str).replace(",", ".").replace(" TL", ""))
                                except (ValueError, TypeError):
                                    pass

                            products.append(ScrapedProduct(
                                productCode=item.get("code", item.get("sku", f"BK-{len(products)}")),
                                productName=str(name)[:100],
                                brand=item.get("brand", {}).get("name") if isinstance(item.get("brand"), dict) else item.get("brand"),
                                categoryName=category_url.split("/")[-1].replace("-", " ").title(),
                                imageUrl=item.get("image", item.get("imageUrl")),
                                price=price,
                                currency=item.get("currency", "TL"),
                                stock=item.get("stock", item.get("quantity", 0)),
                                stockOk=bool(item.get("inStock", item.get("available", False))),
                                site="bayikanali",
                                detailUrl=item.get("url", item.get("detailUrl", category_url)),
                            ))
                except (json.JSONDecodeError, TypeError):
                    continue

        return products

    def _extract_from_html(self, html: str, category_url: str) -> list[ScrapedProduct]:
        """Extract products from rendered HTML text."""
        products = []

        # Strip tags and get text
        text = re.sub(r"<[^>]+>", "\n", html)
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]

            # Look for product-like lines
            if len(line) < 20 or len(line) > 200:
                i += 1
                continue

            price = None
            price_line = None

            # Scan ahead for price
            for j in range(i + 1, min(i + 10, len(lines))):
                l = lines[j]
                pm = re.match(r"^([\d.,]+)\s*(TL|USD|EUR)$", l, re.I)
                if pm:
                    try:
                        price = float(pm.group(1).replace(".", "").replace(",", "."))
                        price_line = j
                    except ValueError:
                        pass
                    break
                if len(l) > 30:
                    break

            if price and 10 < price < 500000:
                brand_match = re.match(
                    r"^(DELL|HP|LENOVO|ASUS|MSI|ACER|APPLE|SAMSUNG)\s", line, re.I
                )
                brand = brand_match.group(1).upper() if brand_match else None

                sku_match = re.search(r"\b([A-Z]{2,5}[\w-]*\d{3,})\b", line)
                sku = sku_match.group(0) if sku_match else f"BK-{len(products)}"

                products.append(ScrapedProduct(
                    productCode=sku,
                    productName=line[:100],
                    brand=brand,
                    categoryName=category_url.split("/")[-1].replace("-", " ").title(),
                    price=price,
                    currency="TL",
                    site="bayikanali",
                    detailUrl=category_url,
                ))
                i = price_line + 1 if price_line else i + 1
                continue

            i += 1

        return products
