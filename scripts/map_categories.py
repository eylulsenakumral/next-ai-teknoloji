#!/usr/bin/env python3
"""Kategori eslestirme script'i.

Her site icin toplanan kategorileri okur, bizim kategorilerle otomatik eslestirir
ve sonuctari DB'ye yazar.

Kullanim:
    /home/tolgabrk/.openclaw/venvs/scrapling/bin/python3 scripts/map_categories.py
    /home/tolgabrk/.openclaw/venvs/scrapling/bin/python3 scripts/map_categories.py --site ergen
    /home/tolgabrk/.openclaw/venvs/scrapling/bin/python3 scripts/map_categories.py --dry-run
"""

import sys
import json
import re
import logging
import argparse
import unicodedata
from pathlib import Path
from datetime import datetime

import psycopg2
from psycopg2.extras import execute_values

SCRIPTS_DIR = Path(__file__).resolve().parent
CATEGORIES_DIR = SCRIPTS_DIR / "categories"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("map-categories")

DB_URL = "postgresql://postgres:postgres@localhost:5432/nextai"

SITES = ["ergen", "bayikanali", "b2bdepo", "tesan", "edenge", "inox"]


def turkish_slug(text: str) -> str:
    """Turkish character'lari normalize edip slug olusturur."""
    text = text.strip()
    # Once Turkish ozel karakterleri degistir (lower/onculu)
    replacements = {
        "İ": "i", "Ğ": "g", "Ü": "u", "Ş": "s", "Ö": "o", "Ç": "c",
        "ı": "i", "ğ": "g", "ü": "u", "ş": "s", "ö": "o", "ç": "c",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = text.lower()
    # Kalan aksanlari temizle
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text)
    text = text.strip("-")
    return text[:200]


def normalize_for_match(text: str) -> str:
    """Eslestirme icin normalize edilmis metin."""
    return turkish_slug(text)


def load_our_categories(conn) -> dict:
    """Bizim kategorileri yukle. Returns {slug: {id, name, slug, path, depth}}"""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, slug, path, depth, parent_id
        FROM categories
        WHERE deleted_at IS NULL AND is_active = true
        ORDER BY depth ASC, sort_order ASC
    """)
    rows = cur.fetchall()

    categories = {}
    for row in rows:
        cat_id, name, slug, path, depth, parent_id = row
        categories[slug] = {
            "id": str(cat_id),
            "name": name,
            "slug": slug,
            "path": path or "",
            "depth": depth,
            "parent_id": str(parent_id) if parent_id else None,
        }

    logger.info("DB'den %d kategori yuklendi", len(categories))
    return categories


def load_supplier_categories(site: str) -> list[dict]:
    """Site icin toplanmis kategorileri oku."""
    path = CATEGORIES_DIR / f"{site}_categories.json"
    if not path.exists():
        logger.warning("%s: Kategori dosyasi bulunamadi: %s", site, path)
        return []

    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("categories", [])


def match_by_slug(supplier_name: str, our_categories: dict) -> tuple[str | None, int, str]:
    """Slug bazli eslestirme. Returns (category_id, confidence, method)."""
    supplier_slug = turkish_slug(supplier_name)

    # 1. Tam slug eslesmesi
    if supplier_slug in our_categories:
        return our_categories[supplier_slug]["id"], 90, "AUTO_SLUG"

    # 2. Slug contains (bizim slug supplier slug'in icinde)
    for slug, cat in our_categories.items():
        if slug in supplier_slug or supplier_slug in slug:
            # Minimum 4 karakter ortaklik
            min_len = min(len(slug), len(supplier_slug))
            if min_len >= 4:
                return cat["id"], 70, "AUTO_SLUG"

    return None, 0, ""


def match_by_keywords(supplier_name: str, our_categories: dict) -> tuple[str | None, int, str]:
    """Keyword bazli eslestirme."""
    supplier_words = set(
        w for w in normalize_for_match(supplier_name).split("-")
        if len(w) >= 3
    )

    if not supplier_words:
        return None, 0, ""

    best_match = None
    best_score = 0

    for slug, cat in our_categories.items():
        cat_words = set(
            w for w in slug.split("-")
            if len(w) >= 3
        )

        # Ortak kelime sayisi
        common = supplier_words & cat_words
        if not common:
            continue

        # Score: ortak kelime sayisi * ortalama kelime uzunlugu
        score = sum(len(w) for w in common)

        if score > best_score:
            best_score = score
            best_match = cat

    if best_match and best_score >= 6:
        confidence = min(30 + best_score * 5, 85)
        return best_match["id"], confidence, "AUTO_KEYWORD"

    return None, 0, ""


def match_by_name_similarity(supplier_name: str, our_categories: dict) -> tuple[str | None, int, str]:
    """Isim benzerligi bazli eslestirme (Jaccard-like)."""
    supplier_norm = normalize_for_match(supplier_name)
    supplier_set = set(supplier_norm.split("-"))

    if not supplier_set:
        return None, 0, ""

    best_match = None
    best_ratio = 0.0

    for slug, cat in our_categories.items():
        cat_set = set(slug.split("-"))
        if not cat_set:
            continue

        intersection = supplier_set & cat_set
        union = supplier_set | cat_set

        if not union:
            continue

        ratio = len(intersection) / len(union)
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = cat

    if best_match and best_ratio >= 0.5:
        confidence = int(30 + best_ratio * 50)
        return best_match["id"], confidence, "AUTO_KEYWORD"

    return None, 0, ""


def match_category(
    supplier_name: str,
    supplier_url: str,
    our_categories: dict,
) -> tuple[str | None, int, str]:
    """Tum yontemleri denerek en iyi eslestirmeyi bulur."""

    # 1. Slug matching (en guvenilir)
    cat_id, conf, method = match_by_slug(supplier_name, our_categories)
    if cat_id:
        return cat_id, conf, method

    # 2. Keyword matching
    cat_id, conf, method = match_by_keywords(supplier_name, our_categories)
    if cat_id:
        return cat_id, conf, method

    # 3. Name similarity
    cat_id, conf, method = match_by_name_similarity(supplier_name, our_categories)
    if cat_id:
        return cat_id, conf, method

    return None, 0, ""


def load_existing_maps(conn, supplier_code: str) -> dict:
    """Mevut eslestirmeleri yukle. Returns {supplier_cat_name: {id, category_id, confidence}}"""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, supplier_cat_name, category_id, confidence, match_method
        FROM supplier_category_maps
        WHERE supplier_code = %s AND is_active = true
    """, (supplier_code,))
    rows = cur.fetchall()

    existing = {}
    for row in rows:
        map_id, cat_name, category_id, confidence, method = row
        existing[cat_name] = {
            "id": str(map_id),
            "category_id": str(category_id) if category_id else None,
            "confidence": confidence,
            "method": method,
        }
    return existing


def upsert_maps(conn, supplier_code: str, maps: list[dict]) -> int:
    """Supplier category map'leri upsert et. Returns upserted count."""
    if not maps:
        return 0

    cur = conn.cursor()

    # ON CONFLICT ile upsert
    sql = """
        INSERT INTO supplier_category_maps
            (id, supplier_code, supplier_cat_name, supplier_cat_url,
             category_id, confidence, match_method, is_active,
             created_at, updated_at)
        VALUES %s
        ON CONFLICT (supplier_code, supplier_cat_name)
        DO UPDATE SET
            supplier_cat_url = EXCLUDED.supplier_cat_url,
            category_id = EXCLUDED.category_id,
            confidence = EXCLUDED.confidence,
            match_method = EXCLUDED.match_method,
            updated_at = NOW()
    """

    import uuid
    values = []
    for m in maps:
        map_id = str(uuid.uuid4())
        values.append((
            map_id,
            supplier_code,
            m["supplier_cat_name"],
            m["supplier_cat_url"],
            m["category_id"],
            m["confidence"],
            m["match_method"],
            True,
            datetime.now(),
            datetime.now(),
        ))

    execute_values(cur, sql, values, page_size=100)
    conn.commit()

    return len(values)


def process_site(
    site: str,
    our_categories: dict,
    conn,
    dry_run: bool = False,
) -> dict:
    """Bir site icin kategori eslestirmesi yap."""
    logger.info("--- %s icin eslestirme basliyor ---", site.upper())

    supplier_cats = load_supplier_categories(site)
    if not supplier_cats:
        logger.warning("%s: Kategori bulunamadi, atlanıyor", site)
        return {"site": site, "total": 0, "matched": 0, "unmatched": 0}

    # Mevcut map'leri kontrol et
    existing = load_existing_maps(conn, site) if not dry_run else {}

    matched = 0
    unmatched = 0
    new_maps = []

    for cat in supplier_cats:
        cat_name = cat["name"]
        cat_url = cat.get("url", "")

        # Zaten manuel eslestirilmis mi? (confidence=100 -> MANUAL)
        if cat_name in existing and existing[cat_name].get("confidence") == 100:
            logger.debug("  [SKIP] %s (manuel eslestirme mevcut)", cat_name)
            matched += 1
            continue

        # Zaten yuksek guvenilirlikli eslesme varsa atla
        if cat_name in existing and existing[cat_name].get("confidence", 0) >= 80:
            logger.debug("  [SKIP] %s (mevcut eslesme guvenilir)", cat_name)
            matched += 1
            continue

        # Eslestir
        category_id, confidence, method = match_category(cat_name, cat_url, our_categories)

        if category_id:
            matched += 1
            our_cat = our_categories.get(
                next((s for s, c in our_categories.items() if c["id"] == category_id), ""),
                {},
            )
            logger.info(
                "  [MATCH] %-50s -> %-40s (%d%%, %s)",
                cat_name[:50],
                our_cat.get("name", "?")[:40],
                confidence,
                method,
            )
        else:
            unmatched += 1
            logger.info("  [NONE]  %-50s", cat_name[:50])

        new_maps.append({
            "supplier_cat_name": cat_name,
            "supplier_cat_url": cat_url,
            "category_id": category_id,
            "confidence": confidence,
            "match_method": method or None,
        })

    # DB'ye yaz
    if not dry_run and new_maps:
        upserted = upsert_maps(conn, site, new_maps)
        logger.info("  %d map DB'ye yazildi", upserted)
    elif dry_run:
        logger.info("  [DRY RUN] %d map yazilmadi", len(new_maps))

    result = {
        "site": site,
        "total": len(supplier_cats),
        "matched": matched,
        "unmatched": unmatched,
    }
    logger.info(
        "  SONUC: %d/%d eslesti (%.0f%%)",
        matched,
        len(supplier_cats),
        (matched / len(supplier_cats) * 100) if supplier_cats else 0,
    )
    return result


def main():
    parser = argparse.ArgumentParser(description="Kategori eslestirme script'i")
    parser.add_argument(
        "--site",
        choices=SITES,
        help="Sadece belirli bir site (belirtilmezsa hepsi)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB'ye yazmadan sadece eslestirme sonuctarini goster",
    )
    args = parser.parse_args()

    sites = [args.site] if args.site else SITES

    conn = psycopg2.connect(DB_URL)

    try:
        our_categories = load_our_categories(conn)

        results = []
        for site in sites:
            result = process_site(site, our_categories, conn, dry_run=args.dry_run)
            results.append(result)

        # Ozet
        logger.info("=" * 60)
        logger.info("ESLESTIRME OZETI")
        logger.info("=" * 60)

        total_all = sum(r["total"] for r in results)
        total_matched = sum(r["matched"] for r in results)
        total_unmatched = sum(r["unmatched"] for r in results)

        for r in results:
            pct = (r["matched"] / r["total"] * 100) if r["total"] > 0 else 0
            logger.info(
                "  %-15s: %3d/%3d eslesti (%5.1f%%)",
                r["site"],
                r["matched"],
                r["total"],
                pct,
            )

        logger.info("-" * 60)
        pct_all = (total_matched / total_all * 100) if total_all > 0 else 0
        logger.info(
            "  TOPLAM:         %3d/%3d eslesti (%5.1f%%)",
            total_matched,
            total_all,
            pct_all,
        )

        if args.dry_run:
            logger.info("  [DRY RUN MODE - DB'ye yazilmadi]")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
