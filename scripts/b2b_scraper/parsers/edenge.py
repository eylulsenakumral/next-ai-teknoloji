"""Edenge B2B parser.

Scrapes categories and products from edenge.com.tr.
Uses CDP cookies + Scrapling (no Cloudflare).

Site structure:
- ASP.NET MVC
- Login required for prices
- Categories: sidebar or top menu links
- Product list: category pages with cards/grid
- Prices: TL format
- Stock: availability indicator
"""

import re
import logging
from typing import Any

from scrapling import StealthyFetcher

from ..models import ScrapedProduct, ScrapedCategory
from ..config import SITES
from ..auth import get_cookies
from .base import BaseParser

logger = logging.getLogger("b2b-scraper.edenge")

EDENGE = SITES["edenge"]


class EdengeParser(BaseParser):
    """Parser for edenge.com.tr B2B"""

    site_code = "edenge"

    def get_categories(self) -> list[ScrapedCategory]:
        """Discover categories from the homepage."""
        categories = []

        page = self._fetch(EDENGE.base_url)
        if not page:
            logger.error("Cannot fetch Edenge homepage")
            return []

        # Extract category links from navigation
        try:
            links = page.css("a[href]")
            seen = set()
            for link in links:
                href = link.attrib.get("href", "")
                text = link.text.strip() if link.text else ""
                if not text:
                    # Try child elements for text
                    children = link.css("span, div")
                    for child in children:
                        if child.text and child.text.strip():
                            text = child.text.strip()
                            break

                # Skip non-category links
                if not href or href in ("#", "/", "/Account/Login", "/Account/LogOff"):
                    continue
                if len(text) < 3 or len(text) > 60:
                    continue

                # Category patterns: /Kategori/, /Category/, /urunler/, /products/
                is_category = any(
                    p in href.lower()
                    for p in ["/kategori", "/category", "/urunler", "/products", "/katalog", "/catalog"]
                )

                # Also check for numeric ID patterns like /Kategori/123
                if not is_category and re.search(r"/\d{2,}", href):
                    is_category = True

                if is_category and href not in seen:
                    seen.add(href)
                    full_url = f"{EDENGE.base_url}{href}" if href.startswith("/") else href
                    categories.append(ScrapedCategory(
                        name=text,
                        url=full_url,
                        site="edenge",
                    ))
        except Exception as e:
            logger.error("Category extraction error: %s", e)

        logger.info("Found %d categories", len(categories))
        return categories

    def get_products(self, category_url: str) -> list[ScrapedProduct]:
        """Parse products from a category page."""
        products = []

        page = self._fetch(category_url)
        if not page:
            return []

        text = page.get_all_text(separator="\n")
        lines = text.split("\n")

        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # Edenge product patterns:
            # Look for product name lines (typically brand + model)
            # followed by price and stock info
            product_name = None

            # Pattern: Long line with alphanumeric, likely a product name
            if (
                len(line) > 20
                and len(line) < 200
                and not line.startswith("Stok")
                and not line.startswith("Kategori")
                and not line.startswith("Sayfa")
                and not re.match(r"^[\d.,]+\s*(TL|USD|EUR)$", line, re.I)
            ):
                # Check if next lines contain price info
                has_price_ahead = False
                for j in range(i + 1, min(i + 15, len(lines))):
                    ahead = lines[j].strip()
                    if re.match(r"^[\d.,]+\s*(TL|USD|EUR)$", ahead, re.I):
                        has_price_ahead = True
                        break
                    if len(ahead) > 20 and ahead != line:
                        break

                if has_price_ahead:
                    product_name = line

            if product_name:
                price = None
                stock = 0
                stock_ok = False
                image_url = None
                currency = "TL"
                sku = ""

                for j in range(i + 1, min(i + 15, len(lines))):
                    l = lines[j].strip()

                    # Stop at next product-like line
                    if len(l) > 30 and l != product_name and not l.startswith("Stok"):
                        break

                    # Price: "1.250,00 TL" or "950,00 TL"
                    if not price:
                        pm = re.match(r"^([\d.,]+)\s*(TL|USD|EUR)$", l, re.I)
                        if pm:
                            try:
                                pval = float(pm.group(1).replace(".", "").replace(",", "."))
                                if 10 < pval < 500000:
                                    price = pval
                                    currency = pm.group(2).upper()
                            except ValueError:
                                pass

                    # Stock indicators
                    sm = re.search(r"Stok[:\s]*(\d+)", l, re.I)
                    if sm:
                        stock = int(sm.group(1))
                        stock_ok = stock > 0
                    elif re.search(r"stokta\s*(var|mevcut)", l, re.I):
                        stock_ok = True
                        stock = 1
                    elif re.search(r"tükendi|yok", l, re.I):
                        stock_ok = False

                    # Image URL
                    if not image_url:
                        im = re.search(r"(https?://[^\s]+\.(?:jpg|jpeg|png|webp))", l, re.I)
                        if im:
                            image_url = im.group(0)

                if price or stock_ok:
                    # Extract brand from name
                    brand_match = re.match(
                        r"^(DELL|HP|LENOVO|ASUS|MSI|ACER|APPLE|SAMSUNG|LOGITECH|KINGSTON|CANON|EPSON|BROTHER)\s",
                        product_name,
                        re.I,
                    )
                    brand = brand_match.group(1).upper() if brand_match else None

                    # Extract SKU/code
                    sku_match = re.search(r"\b([A-Z]{2,5}[\w-]*\d{3,})\b", product_name)
                    sku = sku_match.group(0) if sku_match else f"EDG-{len(products)}"

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
                        site="edenge",
                        detailUrl=category_url,
                    ))

            i += 1

        logger.info("Parsed %d products from %s", len(products), category_url)
        return products
