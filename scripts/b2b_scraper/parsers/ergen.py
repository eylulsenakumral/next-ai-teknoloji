"""Ergen Elektronik parser.

Scrapes categories and products from ergenelektronik.com.
Uses CDP cookies + Scrapling (no Cloudflare).

Site structure:
- ASP.NET WebForms (zanuo platform)
- Login required for prices
- Categories: navbar menu links
- Product list: category pages with cards
- Prices: "611,00 USD" format (login required)
- Stock: "Stok : 10+" format
- Images: oksid.com.tr CDN + self-hosted

Real page format (product block):
  Sipariş No :26676
  HIKVISION
  (DS-2XE6445G0-IZS) 4MP 2,8-12MM MERMİ VE PATLAMAYA DAYANAKLI IP68...
  Yeni / Populer / Outlet / Hediye / Kampanya / Hediyeli / Özel Fiyat
  [price line if logged in: "611,00 USD"]
  [stock line if logged in: "Stok : 10+"]
  [image URL]
"""

import re
import logging

from ..models import ScrapedProduct, ScrapedCategory
from ..config import SITES
from .base import BaseParser

logger = logging.getLogger("b2b-scraper.ergen")

ERGEN = SITES["ergen"]

# Known brands in Ergen catalog
BRANDS = (
    "DELL|HP|LENOVO|ASUS|MSI|ACER|OXPC|DAHUA|HIKVISION|KINGSTON|LOGITECH"
    "|CANON|EPSON|BROTHER|SAMSUNG|APPLE|AMD|INTEL|NVIDIA|SEAGATE|WD"
    "|TPLINK|D-LINK|LINKSYS|NETGEAR|APC|CYBERPOWER|MICROSOFT|GENIUS"
    "|TRUST|RAPOO|CREATIVE|JBL|HARDDISK|CASPER|MONSTER|EXCALIBUR"
    "|VAKINDA|VEYA|QNAP|SYNOLOGY|BUFFALO|FRITZ|ZYXEL|UBIQUITI"
    "|CROW|ARGOX|ZEBRA|BIXOLON|DATALOGIC|OPTOMA|EPSON|VIEWSONIC|BENQ"
    "|ARLO|REOLINK|AXIS|BOSCH|PANASONIC|VIVOTEK|HANWHA|ALIBABA"
)

# Flags that appear between product name and price
PRODUCT_FLAGS = {"Yeni", "Populer", "Outlet", "Hediye", "Kampanya", "Hediyeli", "Özel Fiyat"}

# Category URLs discovered from the homepage
CATEGORY_PATTERNS = [
    "/bildirim/yeni_urunler",
    "/bildirim/populer_urunler",
    "/bildirim/outlet",
    "/bildirim/kampanyali_urunler",
]


class ErgenParser(BaseParser):
    """Parser for ergenelektronik.com"""

    site_code = "ergen"

    def get_categories(self) -> list[ScrapedCategory]:
        """Discover and return all category URLs from the site."""
        categories = []

        page = self._fetch(ERGEN.base_url)
        if not page:
            logger.error("Cannot fetch Ergen homepage")
            return []

        try:
            links = page.css("a[href]")
            seen = set()
            for link in links:
                href = link.attrib.get("href", "")
                text = (link.text or "").strip()

                if not href or href in ("#", "/", "/giris", "/home"):
                    continue
                if "javascript:" in href:
                    continue
                if len(text) < 3:
                    continue

                # Category links typically have /kategori/ or /bildirim/ pattern
                if any(p in href for p in ["/kategori/", "/bildirim/", "/urunler/"]):
                    full_url = f"{ERGEN.base_url}{href}" if href.startswith("/") else href
                    if full_url not in seen:
                        seen.add(full_url)
                        categories.append(ScrapedCategory(
                            name=text,
                            url=full_url,
                            site="ergen",
                        ))
        except Exception as e:
            logger.error("Category extraction error: %s", e)

        # Fallback: add known patterns
        if not categories:
            for pattern in CATEGORY_PATTERNS:
                categories.append(ScrapedCategory(
                    name=pattern.split("/")[-1].replace("_", " ").title(),
                    url=f"{ERGEN.base_url}{pattern}",
                    site="ergen",
                ))

        logger.info("Found %d categories", len(categories))
        return categories

    def get_products(self, category_url: str) -> list[ScrapedProduct]:
        """Parse products from a category page.

        Real Ergen page format:
            Sipariş No :26676
            HIKVISION
            (DS-2XE6445G0-IZS) 4MP 2,8-12MM MERMİ VE PATLAMAYA DAYANAKLI...
            Yeni
            Populer
            ...
            611,00 USD          <-- requires login
            Stok : 10+          <-- requires login
            image_url           <-- optional
        """
        products = []

        page = self._fetch(category_url)
        if not page:
            return []

        text = page.get_all_text(separator="\n")
        lines = text.split("\n")

        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # Look for "Sipariş No :XXXXX" pattern
            m = re.match(r"^Sipariş\s+No\s*:\s*(\d+)\s*$", line)
            if not m:
                i += 1
                continue

            order_no = m.group(1)

            # Next lines should be: BRAND, then PRODUCT NAME
            brand = None
            product_name = ""
            price = None
            stock = 0
            stock_text = "?"
            image_url = None
            currency = "USD"

            # Collect brand + product name from next lines
            name_parts = []
            j = i + 1
            while j < len(lines) and j < i + 15:
                l = lines[j].strip()

                # Stop at next product
                if re.match(r"^Sipariş\s+No\s*:", l):
                    break

                # Skip empty lines
                if not l:
                    j += 1
                    continue

                # Skip flag lines (Yeni, Populer, etc.)
                if l in PRODUCT_FLAGS:
                    j += 1
                    continue

                # Price: "545,00 USD" or "1.118,04 USD"
                if not price:
                    pm = re.match(r"^([\d.]+,\d{2})\s*(USD|TL|EUR)$", l, re.I)
                    if pm:
                        try:
                            pval = float(pm.group(1).replace(".", "").replace(",", "."))
                            if 10 < pval < 500000:
                                price = pval
                                currency = pm.group(2).upper()
                        except ValueError:
                            pass
                        j += 1
                        continue

                # Stock: "Stok : 10+" or "Stok : 0"
                sm = re.match(r"^Stok\s*:\s*(\d+\+?)", l, re.I)
                if sm:
                    stock_text = sm.group(1)
                    try:
                        stock = int(stock_text.replace("+", ""))
                    except ValueError:
                        stock = 0
                    j += 1
                    continue

                # Image URL
                if not image_url:
                    im = re.search(r"(https?://[^\s]+\.(?:jpg|jpeg|png))", l, re.I)
                    if im:
                        image_url = im.group(0)
                        j += 1
                        continue

                # Check if this is a brand line (all-caps, known brand)
                if not brand and re.match(rf"^({BRANDS})$", l, re.I):
                    brand = l.upper()
                    j += 1
                    continue

                # Otherwise it's part of the product name
                if len(l) > 5 and len(l) < 200:
                    # Skip short junk lines
                    if l not in PRODUCT_FLAGS and not re.match(r"^(Stok|Sipariş)", l):
                        name_parts.append(l)

                j += 1

            # Build product name from parts
            if name_parts:
                # First part is usually the product name, combine if short
                if len(name_parts) == 1:
                    product_name = name_parts[0]
                else:
                    # Combine brand + description if they're separate
                    product_name = " ".join(name_parts)

                # Prepend brand if not already in name
                if brand and not product_name.upper().startswith(brand):
                    product_name = f"{brand} {product_name}"

            # Clean product name
            product_name = product_name.strip()
            product_name = re.sub(r"\s+", " ", product_name)

            # Must have a reasonable name
            if len(product_name) < 10:
                i += 1
                continue

            # Extract SKU from name or use order number
            sku_match = re.search(r"\b([A-Z]{2,5}[\w-]*\d{3,})\b", product_name)
            sku = sku_match.group(0) if sku_match else f"ERG-{order_no}"

            # Extract brand from name if not already found
            if not brand:
                brand_match = re.match(rf"^({BRANDS})\s", product_name, re.I)
                brand = brand_match.group(1).upper() if brand_match else None

            # Category name from URL
            cat_name = category_url.split("/")[-1].replace("_", " ").title()

            products.append(ScrapedProduct(
                productCode=sku,
                productName=product_name[:100],
                brand=brand,
                categoryName=cat_name,
                imageUrl=image_url,
                price=price,
                currency=currency,
                stock=stock,
                stockOk=stock > 0,
                site="ergen",
                detailUrl=category_url,
            ))

            i = j  # Skip past the lines we already processed
            continue

        logger.info("Parsed %d products from %s", len(products), category_url)
        return products

    def get_product_detail(self, product_url: str) -> ScrapedProduct | None:
        """Fetch and parse a single product detail page."""
        page = self._fetch(product_url)
        if not page:
            return None

        text = page.get_all_text(separator="\n")
        lines = text.split("\n")

        name = ""
        price = None
        stock = 0
        image_urls = []

        for line in lines:
            line = line.strip()

            # Price
            pm = re.match(r"^([\d.]+,\d{2})\s*(USD|TL|EUR)$", line, re.I)
            if pm and not price:
                try:
                    pval = float(pm.group(1).replace(".", "").replace(",", "."))
                    if 10 < pval < 500000:
                        price = pval
                except ValueError:
                    pass

            # Stock
            sm = re.match(r"^Stok\s*:\s*(\d+\+?)", line, re.I)
            if sm:
                try:
                    stock = int(sm.group(1).replace("+", ""))
                except ValueError:
                    stock = 0

            # Image URLs
            img_matches = re.findall(r"(https?://[^\s]+\.(?:jpg|jpeg|png))", line, re.I)
            image_urls.extend(img_matches)

        # Deduplicate and clean image URLs
        seen = set()
        clean_images = []
        for url in image_urls:
            if url not in seen:
                seen.add(url)
                clean_url = re.sub(r"-\d+x\d+\.", ".", url)
                clean_images.append(clean_url)

        return ScrapedProduct(
            productCode="",
            productName=name[:100],
            price=price,
            currency="USD",
            stock=stock,
            stockOk=stock > 0,
            imageUrls=clean_images[:5],
            site="ergen",
            detailUrl=product_url,
        )
