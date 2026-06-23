import { NextResponse } from "next/server"
import { SupplierSyncStatus } from "@prisma/client"
import { TesanSoapClient } from "@/workers/scraper/suppliers/tesan-soap"
import type {
  TesanProductCategory,
  TesanProductList,
  TesanProductImage,
  TesanStockPrice,
  TesanWareHouseStock,
} from "@/workers/scraper/suppliers/tesan-soap"
import type { SupplierProductInput } from "@/lib/import-supplier-products"
import {
  upsertSupplier,
  importProducts,
  updateSupplierSyncStatus,
} from "@/lib/import-supplier-products"

export const maxDuration = 300

// ---------------------------------------------------------------------------
// Join helpers
// ---------------------------------------------------------------------------

/** stockId → birincil görsel URL */
function buildImageMap(images: TesanProductImage[]): Map<number, string> {
  const map = new Map<number, string>()
  for (const img of images) {
    if (!map.has(img.stockId) && img.image) {
      map.set(img.stockId, img.image)
    }
  }
  return map
}

/** stockId → { price, currency } */
function buildPriceMap(
  prices: TesanStockPrice[]
): Map<number, { price: number; currency: string; vatRate?: number }> {
  const map = new Map<number, { price: number; currency: string; vatRate?: number }>()
  for (const p of prices) {
    if (!map.has(p.stockId)) {
      map.set(p.stockId, { price: p.price, currency: p.currency })
    }
  }
  return map
}

/** stockId → toplam stok miktarı */
function buildStockMap(stocks: TesanWareHouseStock[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const s of stocks) {
    map.set(s.stockId, (map.get(s.stockId) ?? 0) + s.quantity)
  }
  return map
}

/** lowerGroupId → TesanProductCategory (brand + grup bilgisi için) */
function buildCategoryMap(categories: TesanProductCategory[]): Map<number, TesanProductCategory> {
  const map = new Map<number, TesanProductCategory>()
  for (const c of categories) {
    if (!map.has(c.lowerGroupId)) {
      map.set(c.lowerGroupId, c)
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Transform Tesan veriyi → SupplierProductInput[]
// ---------------------------------------------------------------------------

function transformTesanProducts(
  products: TesanProductList[],
  categories: TesanProductCategory[],
  images: TesanProductImage[],
  prices: TesanStockPrice[],
  stocks: TesanWareHouseStock[]
): SupplierProductInput[] {
  const imageMap = buildImageMap(images)
  const priceMap = buildPriceMap(prices)
  const stockMap = buildStockMap(stocks)
  const categoryMap = buildCategoryMap(categories)

  return products.map((p) => {
    const category = categoryMap.get(p.lowerGroupId)
    const priceInfo = priceMap.get(p.stockId)
    const stockQty = stockMap.get(p.stockId) ?? 0
    const imageUrl = imageMap.get(p.stockId)

    // Kategori yolu: "MainGroup > LowerGroup" — category-mapping lookup için
    const categoryName =
      category
        ? `${category.mainGroup} > ${category.lowerGroup}`
        : undefined

    const rawData = {
      stockId: p.stockId,
      stockCode: p.stockCode,
      productCode: p.productCode,
      product: p.product,
      unit: p.unit,
      tax: p.tax,
      lowerGroupId: p.lowerGroupId,
      specialCode: p.specialCode,
      productCatId: p.productCatId,
      productTypeId: p.productTypeId,
      brandId: p.brandId,
      productId: p.productId,
      productStatus: p.productStatus,
      stockStatus: p.stockStatus,
      barcode: p.barcode,
      price: priceInfo?.price,
      currency: priceInfo?.currency,
      imageUrl,
      categoryMainGroup: category?.mainGroup,
      categoryLowerGroup: category?.lowerGroup,
      categoryBrand: category?.brand,
      departman: category?.departman,
    }

    return {
      // stockCode tedarikçi tarafındaki benzersiz ürün kodudur
      externalCode: p.stockCode || String(p.stockId),
      name: p.product,
      brand: category?.brand,
      categoryName,
      price: priceInfo?.price,
      vatRate: p.tax,
      stock: stockQty,
      imageUrl,
      rawData,
    }
  })
}

// ---------------------------------------------------------------------------
// POST /api/tesan/sync
// ---------------------------------------------------------------------------

export async function POST() {
  const startedAt = Date.now()

  let supplierId: string | null = null

  try {
    supplierId = await upsertSupplier({
      code: "TESAN",
      name: "Tesan",
    })

    await updateSupplierSyncStatus(supplierId, SupplierSyncStatus.RUNNING)

    const client = new TesanSoapClient()

    // Tüm veriyi paralel çek
    const [categories, products, images, prices, stocks] = await Promise.all([
      client.getProductCategories(),
      client.getProductLists(),
      client.getProductImages(),
      client.getStockPrices(),
      client.getWareHouseStocks(),
    ])

    console.log(
      `[tesan] Cekilen: kategoriler=${categories.length}, urunler=${products.length},` +
        ` gorseller=${images.length}, fiyatlar=${prices.length}, stoklar=${stocks.length}`
    )

    // Tesan category-mapping kullanmıyoruz (tesan key'i category-mapping dosyasında yok)
    // Ürünler yine de categoryName ile kaydedilir, ileride mapping eklenebilir
    const transformedProducts = transformTesanProducts(
      products,
      categories,
      images,
      prices,
      stocks
    )

    const result = await importProducts({
      supplierId,
      supplierCode: "tesan",
      products: transformedProducts,
      // categoryMappings: tesan için mapping henüz yok, geçilmiyor
    })

    const finalStatus =
      result.errors.length === 0
        ? SupplierSyncStatus.SUCCESS
        : SupplierSyncStatus.PARTIAL

    await updateSupplierSyncStatus(supplierId, finalStatus)

    const durationMs = Date.now() - startedAt

    return NextResponse.json({
      success: true,
      message: "Tesan senkronizasyonu tamamlandı",
      data: {
        supplierId,
        fetched: {
          categories: categories.length,
          products: products.length,
          images: images.length,
          prices: prices.length,
          stocks: stocks.length,
        },
        imported: {
          total: result.total,
          created: result.created,
          updated: result.updated,
          errors: result.errors.length,
          errorDetails: result.errors.slice(0, 10),
        },
        durationMs,
      },
    })
  } catch (error) {
    console.error("[tesan] Sync hatası:", error)

    if (supplierId) {
      await updateSupplierSyncStatus(
        supplierId,
        SupplierSyncStatus.ERROR,
        error instanceof Error ? error.message : String(error)
      ).catch(() => {})
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Senkronizasyon başarısız",
      },
      { status: 500 }
    )
  }
}
