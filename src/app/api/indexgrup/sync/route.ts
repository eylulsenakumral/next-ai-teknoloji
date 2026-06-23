import { NextResponse } from "next/server"
import { SupplierSyncStatus } from "@prisma/client"
import { IndexGrupXmlClient } from "@/workers/scraper/suppliers/indexgrup-xml-v2"
import type { SupplierProductInput } from "@/lib/import-supplier-products"
import {
  upsertSupplier,
  importProducts,
  updateSupplierSyncStatus,
} from "@/lib/import-supplier-products"
import { loadMappings } from "@/lib/category-mapping"
import type { IndexGrupProduct } from "@/workers/scraper/suppliers/indexgrup-xml-v2"

export const maxDuration = 300

// ---------------------------------------------------------------------------
// Transform IndexGrup ürünü → SupplierProductInput
// ---------------------------------------------------------------------------

function transformIndexGrupProduct(p: IndexGrupProduct): SupplierProductInput {
  return {
    externalCode: p.productCode,
    name: p.productName,
    brand: p.brand,
    // Kategori + grup birleşik anahtar (category-mapping'de bu format kullanılıyor)
    categoryName:
      p.categoryName && p.groupName
        ? `${p.categoryName} > ${p.groupName}`
        : (p.categoryName ?? undefined),
    price: p.price,
    vatRate: p.tax ? parseFloat(p.tax) : undefined,
    stock: p.stock,
    imageUrl: p.imageUrl,
    specifications: p.specifications,
    rawData: {
      productCode: p.productCode,
      productName: p.productName,
      brand: p.brand,
      categoryCode: p.categoryCode,
      categoryName: p.categoryName,
      groupCode: p.groupCode,
      groupName: p.groupName,
      companyCode: p.companyCode,
      globalCode: p.globalCode,
      imageUrl: p.imageUrl,
      imageDetailUrl: p.imageDetailUrl,
      tax: p.tax,
      price: p.price,
      currency: p.currency,
      stock: p.stock,
    },
  }
}

// ---------------------------------------------------------------------------
// POST /api/indexgrup/sync
// ---------------------------------------------------------------------------

export async function POST() {
  const startedAt = Date.now()

  let supplierId: string | null = null

  try {
    // 1. Supplier upsert
    supplierId = await upsertSupplier({
      code: "INDEXGRUP",
      name: "Index Grup",
    })

    // Sync başladı
    await updateSupplierSyncStatus(supplierId, SupplierSyncStatus.RUNNING)

    // 2. Veriyi çek
    const client = new IndexGrupXmlClient()
    const raw = await client.getAllProducts()

    console.log(`[indexgrup] ${raw.length} urun cekildi`)

    // 3. Category mappings yükle
    const categoryMappings = loadMappings()

    // 4. Transform + import
    const products = raw.map(transformIndexGrupProduct)

    const result = await importProducts({
      supplierId,
      supplierCode: "indexgrup",
      products,
      categoryMappings,
    })

    // 5. Supplier durumu güncelle
    const finalStatus =
      result.errors.length === 0
        ? SupplierSyncStatus.SUCCESS
        : SupplierSyncStatus.PARTIAL

    await updateSupplierSyncStatus(supplierId, finalStatus)

    const durationMs = Date.now() - startedAt

    return NextResponse.json({
      success: true,
      message: "Index Grup senkronizasyonu tamamlandı",
      data: {
        supplierId,
        productsFound: result.total,
        created: result.created,
        updated: result.updated,
        errors: result.errors.length,
        errorDetails: result.errors.slice(0, 10),
        durationMs,
      },
    })
  } catch (error) {
    console.error("[indexgrup] Sync hatası:", error)

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
