"""Storage utilities for scraped data."""

import json
import csv
from pathlib import Path
from datetime import datetime
from .models import ScrapedProduct


DATA_DIR = Path.home() / ".b2b-catalog"


def save_json(products: list[ScrapedProduct], site: str) -> Path:
    """Save scraped products as JSON."""
    today = datetime.now().strftime("%Y-%m-%d")
    out_dir = DATA_DIR / today
    out_dir.mkdir(parents=True, exist_ok=True)

    out_file = out_dir / f"{site}_products.json"

    data = [
        {
            "productCode": p.productCode,
            "productName": p.productName,
            "brand": p.brand,
            "categoryName": p.categoryName,
            "imageUrl": p.imageUrl,
            "imageUrls": p.imageUrls,
            "detailUrl": p.detailUrl,
            "price": p.price,
            "currency": p.currency,
            "stock": p.stock,
            "stockOk": p.stockOk,
            "specifications": p.specifications,
            "site": p.site,
        }
        for p in products
    ]

    out_file.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    return out_file


def save_csv(products: list[ScrapedProduct], site: str) -> Path:
    """Save scraped products as CSV."""
    today = datetime.now().strftime("%Y-%m-%d")
    out_dir = DATA_DIR / today
    out_dir.mkdir(parents=True, exist_ok=True)

    out_file = out_dir / f"{site}_products.csv"

    if not products:
        return out_file

    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "productCode", "productName", "brand", "categoryName",
            "price", "currency", "stock", "stockOk",
            "imageUrl", "detailUrl", "site",
        ])
        writer.writeheader()
        for p in products:
            writer.writerow({
                "productCode": p.productCode,
                "productName": p.productName,
                "brand": p.brand or "",
                "categoryName": p.categoryName or "",
                "price": p.price or "",
                "currency": p.currency,
                "stock": p.stock,
                "stockOk": p.stockOk,
                "imageUrl": p.imageUrl or "",
                "detailUrl": p.detailUrl or "",
                "site": p.site,
            })

    return out_file


def save_all_csv(products: list[ScrapedProduct]) -> Path:
    """Save all products from all sites as combined CSV."""
    today = datetime.now().strftime("%Y-%m-%d")
    out_dir = DATA_DIR / today
    out_dir.mkdir(parents=True, exist_ok=True)

    out_file = out_dir / "all_products.csv"
    return save_csv(products, "all")


def products_to_dict(products: list[ScrapedProduct]) -> list[dict]:
    """Convert products to dict list for API consumption."""
    return [
        {
            "productCode": p.productCode,
            "productName": p.productName,
            "brand": p.brand,
            "categoryCode": p.categoryCode,
            "categoryName": p.categoryName,
            "groupCode": p.groupCode,
            "groupName": p.groupName,
            "imageUrl": p.imageUrl,
            "imageUrls": p.imageUrls,
            "detailUrl": p.detailUrl,
            "specifications": p.specifications,
            "stock": p.stock,
            "stockOk": p.stockOk,
            "price": p.price,
            "currency": p.currency,
            "site": p.site,
        }
        for p in products
    ]
