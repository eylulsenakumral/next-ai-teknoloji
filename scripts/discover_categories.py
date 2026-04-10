#!/usr/bin/env python3
"""Kategori kesif script'i.

Her B2B sitesinden kategori agacini toplar ve JSON olarak kaydeder.
Kullanim:
    /home/tolgabrk/.openclaw/venvs/scrapling/bin/python3 scripts/discover_categories.py
    /home/tolgabrk/.openclaw/venvs/scrapling/bin/python3 scripts/discover_categories.py --site ergen
"""

import sys
import json
import logging
import argparse
from pathlib import Path
from datetime import datetime

# scripts/ altindaki b2b_scraper modulunu import et
SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

from b2b_scraper.parsers import (
    ErgenParser,
    BayikanaliParser,
    B2BDepoParser,
    TesanParser,
    EdengeParser,
    InoxParser,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("discover-categories")

OUTPUT_DIR = SCRIPTS_DIR / "categories"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PARSER_MAP = {
    "ergen": ErgenParser,
    "bayikanali": BayikanaliParser,
    "b2bdepo": B2BDepoParser,
    "tesan": TesanParser,
    "edenge": EdengeParser,
    "inox": InoxParser,
}

# Site bazli parent kestirim kurallari (hierarchy olusturmak icin)
# Her site icin: regex pattern -> parent category name
HIERARCHY_RULES: dict[str, list[tuple[str, str]]] = {
    "ergen": [
        (r"/kategori/bilgisayar", "Bilgisayar"),
        (r"/kategori/cevre-birimleri", "Cevre Birimleri"),
        (r"/kategori/ag-network", "Ag & Network"),
        (r"/kategori/guvenlik", "Guvenlik & CCTV"),
        (r"/kategori/guc-elektronigi", "Guc Elektronigi"),
        (r"/kategori/yazici", "Yazici & Tarayici"),
        (r"/kategori/kablo", "Kablo & Aksesuar"),
        (r"/kategori/pos", "POS & Barkod"),
        (r"/kategori/yazilim", "Yazilim & Lisans"),
        (r"/kategori/akilli", "Akilli Sistemler"),
        (r"/kategori/gecis-kontrol", "Gecis Kontrol & Alarm"),
    ],
}


def discover_site(site_code: str) -> list[dict]:
    """Bir site icin kategorileri kesfet ve kaydet."""
    parser_cls = PARSER_MAP.get(site_code)
    if not parser_cls:
        logger.error("Bilinmeyen site: %s", site_code)
        return []

    logger.info("--- %s icin kategoriler kesfediliyor ---", site_code.upper())

    try:
        parser = parser_cls()
        scraped_cats = parser.get_categories()
    except Exception as e:
        logger.error("%s parser hatasi: %s", site_code, e)
        return []

    if not scraped_cats:
        logger.warning("%s: Hic kategori bulunamadi", site_code)
        return []

    # ScrapedCategory -> JSON format
    categories_json = []
    for cat in scraped_cats:
        parent_name = infer_parent(site_code, cat.name, cat.url)

        categories_json.append({
            "name": cat.name,
            "url": cat.url,
            "parentName": parent_name,
            "level": 0 if not parent_name else 1,
            "code": cat.code or "",
            "productCount": cat.productCount,
        })

    # JSON dosyasina kaydet
    output_path = OUTPUT_DIR / f"{site_code}_categories.json"
    output_data = {
        "site": site_code,
        "discoveredAt": datetime.now().isoformat(),
        "totalCategories": len(categories_json),
        "categories": categories_json,
    }

    output_path.write_text(json.dumps(output_data, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info(
        "%s: %d kategori -> %s",
        site_code,
        len(categories_json),
        output_path.name,
    )

    return categories_json


def infer_parent(site_code: str, cat_name: str, cat_url: str) -> str:
    """URL ve isim bazli parent kategori cikarimi."""
    rules = HIERARCHY_RULES.get(site_code, [])
    for pattern, parent_name in rules:
        import re
        if re.search(pattern, cat_url, re.I):
            return parent_name
    return ""


def main():
    parser = argparse.ArgumentParser(description="B2B site kategorilerini kesfet")
    parser.add_argument(
        "--site",
        choices=list(PARSER_MAP.keys()),
        help="Sadece belirli bir site (belirtilmezsa hepsi)",
    )
    args = parser.parse_args()

    sites = [args.site] if args.site else list(PARSER_MAP.keys())

    total = 0
    for site in sites:
        cats = discover_site(site)
        total += len(cats)

    logger.info("=" * 50)
    logger.info("TOPLAM: %d kategori, %d site", total, len(sites))

    # Ozet
    for site in sites:
        path = OUTPUT_DIR / f"{site}_categories.json"
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            logger.info("  %-15s: %d kategori", site, data["totalCategories"])


if __name__ == "__main__":
    main()
