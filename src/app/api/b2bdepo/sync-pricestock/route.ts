import { NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { syncPriceStock } from "@/services/b2bdepo-xml.service"

export const maxDuration = 300

// ============================================================================
// POST /api/b2bdepo/sync-pricestock
// B2BDepo PriceStock XML'den hizli fiyat/stok guncelleme
// Gunde 5 kez
// ============================================================================

export async function POST() {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const result = await syncPriceStock()

    return NextResponse.json({
      success: true,
      message: `${result.updated} ürün fiyat/stok güncellendi (${result.priceChanges} fiyat değişikliği).`,
      data: {
        synced: result.synced,
        updated: result.updated,
        priceChanges: result.priceChanges,
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
