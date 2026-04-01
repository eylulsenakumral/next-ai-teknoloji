import { NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { syncProducts } from "@/services/b2bdepo-xml.service"

// ============================================================================
// POST /api/b2bdepo/sync-products
// B2BDepo ProductList XML'den tam urun senkronizasyonu
// Gunde 3 kez, sadece 22:00-07:00 arasi
// ============================================================================

export async function POST() {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const result = await syncProducts()

    return NextResponse.json({
      success: true,
      message: `${result.synced} ürün senkronize edildi (${result.created} yeni, ${result.updated} güncellenen).`,
      data: {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        durationMs: result.durationMs,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
