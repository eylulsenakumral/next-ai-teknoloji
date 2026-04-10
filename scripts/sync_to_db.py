#!/usr/bin/env python3
"""Sync scraped products directly to PostgreSQL DB.

Bypasses the Next.js API and writes directly to the database.
Uses the same SupplierProduct table structure.
"""

import json
import re
import sys
import uuid
import logging
from pathlib import Path
from datetime import datetime

import psycopg2
import psycopg2.extras

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sync-db")

DB_URL = "postgresql://postgres:postgres@localhost:5432/nextai"

SUPPLIER_NAMES = {
    "ergen": "Ergen Elektronik",
    "bayikanali": "BayiKanali",
    "b2bdepo": "B2B Depo",
    "tesan": "Tesan",
    "edenge": "Edenge B2B",
    "inox": "Inox B2B",
}


def get_or_create_supplier(cur, code: str, name: str) -> str:
    """Get or create supplier, return ID."""
    cur.execute("SELECT id FROM suppliers WHERE code = %s AND deleted_at IS NULL", (code,))
    row = cur.fetchone()
    if row:
        return row[0]

    now = datetime.utcnow().isoformat()
    cur.execute("""
        INSERT INTO suppliers (id, code, name, scraper_type, is_active, sync_interval_minutes, created_at, updated_at)
        VALUES (%s, %s, %s, 'WEB_SCRAPER', true, 360, %s, %s)
        RETURNING id
    """, (str(uuid.uuid4()), code, name, now, now))
    return cur.fetchone()[0]


def upsert_brand(cur, brand_name: str) -> str | None:
    """Upsert brand, return ID."""
    if not brand_name:
        return None
    slug = brand_name.lower().replace(" ", "-").replace("--", "-")
    import re
    slug = re.sub(r'[^a-z0-9-]', '', slug).strip('-')

    cur.execute("SELECT id FROM brands WHERE slug = %s AND deleted_at IS NULL", (slug,))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE brands SET name = %s WHERE id = %s", (brand_name, row[0]))
        return row[0]

    now = datetime.utcnow().isoformat()
    cur.execute("""
        INSERT INTO brands (id, name, slug, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (str(uuid.uuid4()), brand_name, slug, now, now))
    return cur.fetchone()[0]


def sync_products(site: str, products_file: str):
    """Sync products from JSON file to DB."""
    logger.info("Loading products from %s", products_file)
    products = json.loads(Path(products_file).read_text())
    logger.info("Loaded %d products", len(products))

    supplier_name = SUPPLIER_NAMES.get(site, site.upper())
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False

    try:
        cur = conn.cursor()

        # 1. Get/create supplier
        supplier_id = get_or_create_supplier(cur, site, supplier_name)
        logger.info("Supplier: %s (%s)", supplier_name, supplier_id)

        # 2. Create scraper log
        import uuid as _uuid
        log_id = str(_uuid.uuid4())
        cur.execute("""
            INSERT INTO scraper_logs (id, supplier_id, status, products_found)
            VALUES (%s, %s, 'RUNNING', %s)
            RETURNING id
        """, (log_id, supplier_id, len(products)))
        log_id = cur.fetchone()[0]

        cur.execute("""
            UPDATE suppliers SET sync_status = 'RUNNING' WHERE id = %s
        """, (supplier_id,))
        conn.commit()

        # 3. Upsert products
        created = 0
        updated = 0
        errors = 0
        start_time = datetime.now()

        for i, p in enumerate(products):
            try:
                if (i + 1) % 200 == 0:
                    logger.info("  Sync: %d/%d", i + 1, len(products))

                # Upsert brand
                brand_id = upsert_brand(cur, p.get('brand'))

                # Check existing
                sku = p.get('productCode', '')
                cur.execute("""
                    SELECT id FROM supplier_products
                    WHERE supplier_id = %s AND external_sku = %s
                """, (supplier_id, sku))
                existing = cur.fetchone()

                raw_data = {
                    "brand": p.get('brand'),
                    "brandId": brand_id,
                    "categoryName": p.get('categoryName'),
                    "imageUrl": p.get('imageUrl'),
                    "imageUrls": p.get('imageUrls'),
                    "specifications": p.get('specifications'),
                    "stockOk": p.get('stockOk'),
                }

                price = p.get('price')
                stock = p.get('stock', 0)
                now = datetime.utcnow().isoformat()
                product_data = {
                    "external_name": p.get('productName'),
                    "external_sku": sku,
                    "external_url": p.get('detailUrl'),
                    "purchase_price": price,
                    "currency": p.get('currency', 'USD'),
                    "stock_quantity": stock,
                    "is_available": stock > 0,
                    "raw_data": json.dumps(raw_data, ensure_ascii=False),
                    "last_scraped_at": now,
                    "updated_at": now,
                }

                if existing:
                    set_clause = ", ".join(f"{k} = %s" for k in product_data)
                    cur.execute(f"""
                        UPDATE supplier_products SET {set_clause}
                        WHERE id = %s
                    """, list(product_data.values()) + [existing[0]])
                    updated += 1
                else:
                    cols = ["id", "supplier_id"] + list(product_data.keys())
                    vals = [str(uuid.uuid4()), supplier_id] + list(product_data.values())
                    placeholders = ", ".join(["%s"] * len(vals))
                    col_names = ", ".join(cols)
                    cur.execute(f"""
                        INSERT INTO supplier_products ({col_names})
                        VALUES ({placeholders})
                    """, vals)
                    created += 1

            except Exception as e:
                errors += 1
                if errors <= 5:
                    logger.error("  Error on %s: %s", p.get('productCode', '?'), e)
                conn.rollback()
                continue

        # 4. Update scraper log
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        cur.execute("""
            UPDATE scraper_logs SET
                status = %s,
                finished_at = NOW(),
                products_found = %s,
                products_updated = %s,
                products_new = %s,
                errors_count = %s,
                duration_ms = %s
            WHERE id = %s
        """, ('SUCCESS' if errors == 0 else 'PARTIAL',
              len(products), updated, created, errors, duration_ms, log_id))

        # 5. Update supplier
        cur.execute("""
            UPDATE suppliers SET
                sync_status = %s,
                last_sync_at = NOW(),
                sync_error = %s
            WHERE id = %s
        """, ('SUCCESS' if errors == 0 else 'PARTIAL',
              f'{errors} errors' if errors else None,
              supplier_id))

        conn.commit()
        logger.info("=" * 50)
        logger.info("SYNC COMPLETE: %s", supplier_name)
        logger.info("  Products: %d", len(products))
        logger.info("  New: %d", created)
        logger.info("  Updated: %d", updated)
        logger.info("  Errors: %d", errors)
        logger.info("  Duration: %dms", duration_ms)
        logger.info("=" * 50)

    except Exception as e:
        conn.rollback()
        logger.error("Sync failed: %s", e)
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: sync_to_db.py <site> <products.json>")
        sys.exit(1)

    sync_products(sys.argv[1], sys.argv[2])
