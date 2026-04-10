"""Inox B2B parser.

Scrapes categories and products from bayi.inox.com.tr.
Uses FlareSolverr for Cloudflare bypass + Scrapling.

Site structure:
- ASP.NET WebForms
- Cloudflare protected
- Login required for prices
- Categories: navigation/menu links
- Product list: grid view
- Prices: TL format
"""

import re
import logging

from ..models import ScrapedProduct, ScrapedCategory
from ..config import SITES
from ..auth import solve_cloudflare
from .base import BaseParser

logger = logging.getLogger("b2b-scraper.inox")

INOX = SITES["inox"]


class InoxParser(BaseParser):
    """Parser for bayi.inox.com.tr (ASP.NET + Cloudflare)."""

    site_code = "inox"

    def _fetch_html(self, url: str) -> str:
        """Fetch page HTML via FlareSolverr."""
        solution = solve_cloudflare(url)
        if solution:
            return solution.get("response", "")
        logger.warning("FlareSolverr failed for %s", url)
        return ""

    def get_categories(self) -> list[ScrapedCategory]:
        """Discover categories from the homepage."""
        categories = []

        html = self._fetch_html(INOX.base_url)
        if not html:
            logger.error("Cannot fetch Inox homepage")
            return categories

        seen = set()

        # Method 1: Extract from navigation links
        href_pattern = r'href="([^"]*)"'
        matches = re.findall(href_pattern, html)

        for href in matches:
            if not href or href in ("#", "/", "javascript:void(0)"):
                continue

            is_cat = any(
                p in href.lower()
                for p in ["/kategori", "/category", "/urun", "/product", "/kampanya", "/yeni"]
            )

            if not is_cat and re.search(r"/(?:Kategori|Urun)/\d+", href, re.I):
                is_cat = True

            if is_cat and href not in seen:
                seen.add(href)
                name = href.rstrip("/").split("/")[-1].replace("-", " ").title()

                # Try to find link text
                text_match = re.search(
                    rf'href="{re.escape(href)}"[^>]*>([^<]+)', html
                )
                if text_match and text_match.group(1).strip():
                    name = text_match.group(1).strip()

                full_url = f"{INOX.base_url}{href}" if href.startswith("/") else href
                categories.append(ScrapedCategory(
                    name=name,
                    url=full_url,
                    site="inox",
                ))

        logger.info("Found %d categories", len(categories))
        return categories

    def get_products(self, category_url: str) -> list[ScrapedProduct]:
        """Parse products from a category page."""
        products = []

        html = self._fetch_html(category_url)
        if not html:
            return products

        # Strip HTML for text parsing
        text = re.sub(r"<[^>]+>", "\n", html)
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]

            product_name = None

            if 20 < len(line) < 200:
                has_price = False
                for j in range(i + 1, min(i + 12, len(lines))):
                    ahead = lines[j].strip()
                    if re.match(r"^[\d.,]+\s*(TL|USD|EUR)", ahead, re.I):
                        has_price = True
                        break
                    if 20 < len(ahead) < 200 and ahead != line:
                        break

                if has_price:
                    product_name = line

            if product_name:
                price = None
                stock = 0
                stock_ok = False
                currency = "TL"
                image_url = None

                for j in range(i + 1, min(i + 12, len(lines))):
                    l = lines[j].strip()

                    if 20 < len(l) < 200 and l != product_name and not re.match(r"^[\d.,]", l):
                        break

                    # Price
                    if not price:
                        pm = re.match(r"^([\d.,]+)\s*(TL|USD|EUR)", l, re.I)
                        if pm:
                            try:
                                price = float(pm.group(1).replace(".", "").replace(",", "."))
                                currency = pm.group(2).upper()
                            except ValueError:
                                pass

                    # Stock
                    sm = re.search(r"stok[:\s]*(\d+)", l, re.I)
                    if sm:
                        stock = int(sm.group(1))
                        stock_ok = stock > 0

                    # Image
                    if not image_url:
                        im = re.search(r"(https?://[^\s]+\.(?:jpg|jpeg|png|webp))", l, re.I)
                        if im:
                            image_url = im.group(0)

                if price:
                    brand_match = re.match(
                        r"^(DELL|HP|LENOVO|ASUS|MSI|ACER|APPLE|SAMSUNG|HIKVISION|DAHUA)\s",
                        product_name,
                        re.I,
                    )
                    brand = brand_match.group(1).upper() if brand_match else None

                    sku_match = re.search(r"\b([A-Z]{2,5}[\w-]*\d{3,})\b", product_name)
                    sku = sku_match.group(0) if sku_match else f"INOX-{len(products)}"

                    products.append(ScrapedProduct(
                        productCode=sku,
                        productName=product_name[:100],
                        brand=brand,
                        categoryName=category_url.split("/")[-1].replace("-", " ").title(),
                        imageUrl=image_url,
                        price=price,
                        currency=currency,
                        stock=stock,
                        stockOk=stock_ok,
                        site="inox",
                        detailUrl=category_url,
                    ))

            i += 1

        logger.info("Parsed %d products from %s", len(products), category_url)
        return products
