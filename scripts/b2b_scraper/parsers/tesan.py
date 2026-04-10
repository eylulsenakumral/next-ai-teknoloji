"""Tesan parser.

Scrapes categories and products from isortagim.tesan.com.tr.
Uses CDP cookies + Scrapling (no Cloudflare).

Site structure:
- Next.js + Auth.js
- Login required for prices
- Categories: API-driven navigation
- Product list: SSR or API-loaded
- Prices: TL + USD format
"""

import re
import json
import logging

from ..models import ScrapedProduct, ScrapedCategory
from ..config import SITES
from ..auth import get_cookies
from .base import BaseParser

logger = logging.getLogger("b2b-scraper.tesan")

TESAN = SITES["tesan"]


class TesanParser(BaseParser):
    """Parser for isortagim.tesan.com.tr (Next.js)."""

    site_code = "tesan"

    def get_categories(self) -> list[ScrapedCategory]:
        """Discover categories from the homepage."""
        categories = []

        page = self._fetch(TESAN.base_url)
        if not page:
            logger.error("Cannot fetch Tesan homepage")
            return []

        # Extract navigation links
        try:
            links = page.css("a[href]")
            seen = set()
            for link in links:
                href = link.attrib.get("href", "")
                text = link.text.strip() if link.text else ""

                if not href or href in ("#", "/", "/login", "/logout"):
                    continue
                if len(text) < 3 or len(text) > 60:
                    continue

                # Category patterns
                is_cat = any(
                    p in href.lower()
                    for p in ["/kategori", "/category", "/urun", "/product", "/catalog", "/katalog"]
                )

                # Also match Next.js-style routes like /products/[slug]
                if not is_cat and re.search(r"/(products|urunler|kategori)/", href, re.I):
                    is_cat = True

                if is_cat and href not in seen:
                    seen.add(href)
                    full_url = f"{TESAN.base_url}{href}" if href.startswith("/") else href
                    categories.append(ScrapedCategory(
                        name=text,
                        url=full_url,
                        site="tesan",
                    ))
        except Exception as e:
            logger.error("Category extraction error: %s", e)

        # Fallback: Try to fetch API endpoint for categories
        if not categories:
            categories = self._try_api_categories()

        logger.info("Found %d categories", len(categories))
        return categories

    def _try_api_categories(self) -> list[ScrapedCategory]:
        """Try fetching categories from Tesan API endpoint."""
        categories = []

        api_urls = [
            f"{TESAN.base_url}/api/categories",
            f"{TESAN.base_url}/api/products/categories",
        ]

        for api_url in api_urls:
            try:
                import requests
                cookies = get_cookies("tesan")
                cookie_jar = {c["name"]: c["value"] for c in cookies} if cookies else {}
                resp = requests.get(api_url, cookies=cookie_jar, timeout=15)
                if resp.status_code == 200:
                    data = resp.json()
                    items = data if isinstance(data, list) else data.get("categories", data.get("data", []))
                    for item in items[:100]:
                        name = item.get("name", item.get("title", ""))
                        slug = item.get("slug", item.get("url", ""))
                        if name and slug:
                            url = f"{TESAN.base_url}/kategori/{slug}" if slug.startswith("/") is False else f"{TESAN.base_url}{slug}"
                            categories.append(ScrapedCategory(
                                name=name,
                                url=url,
                                code=str(item.get("id", "")),
                                site="tesan",
                            ))
                    if categories:
                        break
            except Exception as e:
                logger.debug("API category fetch failed: %s", e)

        return categories

    def get_products(self, category_url: str) -> list[ScrapedProduct]:
        """Parse products from a category page."""
        products = []

        # Try API first (Next.js sites often have API routes)
        api_products = self._try_api_products(category_url)
        if api_products:
            return api_products

        # Fallback: Parse HTML
        page = self._fetch(category_url)
        if not page:
            return products

        text = page.get_all_text(separator="\n")
        lines = text.split("\n")

        i = 0
        while i < len(lines):
            line = lines[i].strip()

            if len(line) < 20 or len(line) > 200:
                i += 1
                continue

            product_name = None

            # Look for product + price pattern
            has_price = False
            for j in range(i + 1, min(i + 12, len(lines))):
                ahead = lines[j].strip()
                if re.match(r"^[\d.,]+\s*(TL|USD|EUR|\$)", ahead, re.I):
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
                        pm = re.match(r"^([\d.,]+)\s*(TL|USD|EUR|\$)", l, re.I)
                        if pm:
                            try:
                                price = float(pm.group(1).replace(".", "").replace(",", "."))
                                currency = pm.group(2).upper().replace("$", "USD")
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
                        r"^(DELL|HP|LENOVO|ASUS|MSI|ACER|APPLE|SAMSUNG)\s",
                        product_name,
                        re.I,
                    )
                    brand = brand_match.group(1).upper() if brand_match else None

                    sku_match = re.search(r"\b([A-Z]{2,5}[\w-]*\d{3,})\b", product_name)
                    sku = sku_match.group(0) if sku_match else f"TES-{len(products)}"

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
                        site="tesan",
                        detailUrl=category_url,
                    ))

            i += 1

        logger.info("Parsed %d products from %s", len(products), category_url)
        return products

    def _try_api_products(self, category_url: str) -> list[ScrapedProduct]:
        """Try fetching products from Tesan API."""
        products = []

        # Extract slug from URL
        slug = category_url.rstrip("/").split("/")[-1]

        api_urls = [
            f"{TESAN.base_url}/api/products?category={slug}",
            f"{TESAN.base_url}/api/categories/{slug}/products",
        ]

        for api_url in api_urls:
            try:
                import requests
                cookies = get_cookies("tesan")
                cookie_jar = {c["name"]: c["value"] for c in cookies} if cookies else {}
                resp = requests.get(api_url, cookies=cookie_jar, timeout=15)
                if resp.status_code == 200:
                    data = resp.json()
                    items = data if isinstance(data, list) else data.get("products", data.get("data", []))
                    for item in items[:200]:
                        name = item.get("name", item.get("productName", item.get("title", "")))
                        if not name:
                            continue

                        price_str = str(item.get("price", item.get("unitPrice", "")))
                        price = None
                        if price_str and price_str not in ("None", ""):
                            try:
                                price = float(str(price_str).replace(",", "."))
                            except (ValueError, TypeError):
                                pass

                        products.append(ScrapedProduct(
                            productCode=item.get("code", item.get("sku", f"TES-{len(products)}")),
                            productName=str(name)[:100],
                            brand=item.get("brand"),
                            categoryName=item.get("categoryName", slug.replace("-", " ").title()),
                            imageUrl=item.get("image", item.get("imageUrl")),
                            price=price,
                            currency=item.get("currency", "TL"),
                            stock=item.get("stock", item.get("quantity", 0)),
                            stockOk=bool(item.get("inStock", item.get("available", False))),
                            site="tesan",
                            detailUrl=item.get("url", category_url),
                        ))
                    if products:
                        break
            except Exception as e:
                logger.debug("API product fetch failed: %s", e)

        return products
