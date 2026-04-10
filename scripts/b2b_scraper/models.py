"""Data models for B2B catalog scraper."""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ScrapedProduct:
    productCode: str
    productName: str
    brand: str | None = None
    categoryCode: str | None = None
    categoryName: str | None = None
    groupCode: str | None = None
    groupName: str | None = None
    imageUrl: str | None = None
    imageUrls: list[str] = field(default_factory=list)
    detailUrl: str | None = None
    specifications: dict = field(default_factory=dict)
    stock: int = 0
    stockOk: bool = False
    price: float | None = None
    currency: str = "USD"
    site: str = ""


@dataclass
class ScrapedCategory:
    name: str
    url: str
    code: str | None = None
    productCount: int = 0
    site: str = ""


@dataclass
class ScraperResult:
    site: str
    categories: list[ScrapedCategory] = field(default_factory=list)
    products: list[ScrapedProduct] = field(default_factory=list)
    startedAt: str = field(default_factory=lambda: datetime.now().isoformat())
    finishedAt: str | None = None
    errors: list[str] = field(default_factory=list)
    status: str = "running"  # running, completed, failed
