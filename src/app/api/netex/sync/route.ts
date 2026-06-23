import { NextResponse } from "next/server"
import { SupplierSyncStatus } from "@prisma/client"
import { NetexXmlClient } from "@/workers/scraper/suppliers/netex-xml-v2"
import type { SupplierProductInput } from "@/lib/import-supplier-products"
import {
  upsertSupplier,
  importProducts,
  updateSupplierSyncStatus,
} from "@/lib/import-supplier-products"
import { loadMappings } from "@/lib/category-mapping"
// netex-xml-v2 exports the same interface shape under the name IndexGrupProduct
import type { IndexGrupProduct as NetexProduct } from "@/workers/scraper/suppliers/netex-xml-v2"

export const maxDuration = 300

// ---------------------------------------------------------------------------
// Transform Netex ürünü → SupplierProductInput
// ---------------------------------------------------------------------------

function transformNetexProduct(p: NetexProduct): SupplierProductInput {
  return {
    externalCode: p.productCode,
    name: p.productName,
    brand: p.brand,
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
// POST /api/netex/sync
// ---------------------------------------------------------------------------

export async function POST() {
  const startedAt = Date.now()

  let supplierId: string | null = null

  try {
    supplierId = await upsertSupplier({
      code: "NETEX",
      name: "Netex",
    })

    await updateSupplierSyncStatus(supplierId, SupplierSyncStatus.RUNNING)

    const client = new NetexXmlClient()
    const raw = await client.getAllProducts()

    console.log(`[netex] ${raw.length} urun cekildi`)

    const categoryMappings = loadMappings()
    const products = raw.map(transformNetexProduct)

    const result = await importProducts({
      supplierId,
      supplierCode: "netex",
      products,
      categoryMappings,
    })

    const finalStatus =
      result.errors.length === 0
        ? SupplierSyncStatus.SUCCESS
        : SupplierSyncStatus.PARTIAL

    await updateSupplierSyncStatus(supplierId, finalStatus)

    const durationMs = Date.now() - startedAt

    return NextResponse.json({
      success: true,
      message: "Netex senkronizasyonu tamamlandı",
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
    console.error("[netex] Sync hatası:", error)

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
