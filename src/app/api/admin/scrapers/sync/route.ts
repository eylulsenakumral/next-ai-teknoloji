/**
 * B2B Catalog Scraper Sync API
 *
 * POST /api/admin/scrapers/sync
 *
 * Body: { supplierCode: string, products: ImportProduct[] }
 *
 * Receives scraped products from the Python B2B scraper
 * and upserts them into SupplierProduct table.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface ImportProduct {
  productCode: string
  productName: string
  brand?: string
  categoryCode?: string
  categoryName?: string
  groupCode?: string
  groupName?: string
  imageUrl?: string
  imageUrls?: string[]
  specifications?: Record<string, string>
  stock?: number
  stockOk?: boolean
  price?: number
  currency?: string
  site?: string
  detailUrl?: string
}

const SUPPLIER_NAMES: Record<string, string> = {
  ergen: "Ergen Elektronik",
  bayikanali: "BayiKanali",
  b2bdepo: "B2B Depo",
  tesan: "Tesan",
  edenge: "Edenge B2B",
  inox: "Inox B2B",
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { supplierCode, products } = body as {
      supplierCode: string
      products: ImportProduct[]
    }

    if (!supplierCode || !products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: "supplierCode and products[] are required" },
        { status: 400 }
      )
    }

    const supplierName =
      SUPPLIER_NAMES[supplierCode] || supplierCode.toUpperCase()

    // 1. Upsert supplier
    let supplier = await prisma.supplier.findUnique({
      where: { code: supplierCode },
    })

    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          code: supplierCode,
          name: supplierName,
          scraperType: "WEB_SCRAPER",
          isActive: true,
          syncIntervalMinutes: 360,
        },
      })
    } else if (supplier.scraperType !== "WEB_SCRAPER") {
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: { scraperType: "WEB_SCRAPER" },
      })
    }

    // 2. Create ScraperLog
    const scraperLog = await prisma.scraperLog.create({
      data: {
        supplierId: supplier.id,
        status: "RUNNING",
        productsFound: products.length,
      },
    })

    await prisma.supplier.update({
      where: { id: supplier.id },
      data: { syncStatus: "RUNNING" },
    })

    // 3. Upsert products
    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < products.length; i++) {
      const p = products[i]

      try {
        if ((i + 1) % 100 === 0) {
          console.log(`  Sync: ${i + 1}/${products.length}`)
        }

        // Upsert brand if available
        let brandId: string | null = null
        if (p.brand) {
          const slug = p.brand
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")

          const brand = await prisma.brand.upsert({
            where: { slug },
            create: { name: p.brand, slug },
            update: { name: p.brand },
          })
          brandId = brand.id
        }

        // Check existing by supplier + SKU
        const existing = await prisma.supplierProduct.findFirst({
          where: {
            supplierId: supplier!.id,
            externalSku: p.productCode,
          },
        })

        const productData = {
          externalName: p.productName,
          externalSku: p.productCode,
          externalUrl: p.detailUrl,
          purchasePrice: p.price != null ? p.price : undefined,
          currency: p.currency ?? "USD",
          stockQuantity: p.stock ?? 0,
          isAvailable: (p.stock ?? 0) > 0,
          rawData: {
            brand: p.brand,
            brandId,
            categoryName: p.categoryName,
            imageUrl: p.imageUrl,
            imageUrls: p.imageUrls,
            specifications: p.specifications,
            stockOk: p.stockOk,
          } as any,
          lastScrapedAt: new Date(),
        }

        if (existing) {
          await prisma.supplierProduct.update({
            where: { id: existing.id },
            data: productData,
          })
          updated++
        } else {
          await prisma.supplierProduct.create({
            data: {
              supplierId: supplier!.id,
              ...productData,
            },
          })
          created++
        }
      } catch (error) {
        errors.push(
          `${p.productCode}: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        skipped++
      }
    }

    // 4. Update ScraperLog
    const durationMs = Date.now() - startTime
    const hasErrors = errors.length > 0

    await prisma.scraperLog.update({
      where: { id: scraperLog.id },
      data: {
        status: hasErrors ? "PARTIAL" : "SUCCESS",
        finishedAt: new Date(),
        productsFound: products.length,
        productsUpdated: updated,
        productsNew: created,
        errorsCount: skipped,
        errorMessage:
          errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
        durationMs,
      },
    })

    // 5. Update supplier sync status
    await prisma.supplier.update({
      where: { id: supplier!.id },
      data: {
        syncStatus: hasErrors ? "PARTIAL" : "SUCCESS",
        lastSyncAt: new Date(),
        syncError:
          errors.length > 0
            ? `${errors.length} errors during sync`
            : null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        supplierId: supplier!.id,
        supplierCode,
        productsFound: products.length,
        productsNew: created,
        productsUpdated: updated,
        productsSkipped: skipped,
        errorsCount: errors.length,
        durationMs,
        scraperLogId: scraperLog.id,
      },
    })
  } catch (error) {
    console.error("Scraper sync error:", error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 500 }
    )
  }
}
