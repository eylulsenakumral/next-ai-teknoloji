import { NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { syncOkisanProducts } from "@/services/okisan.service"

export const maxDuration = 300

// ============================================================================
// POST /api/okisan/sync
// Okisan XML'den ürünleri çeker ve DB'ye senkronize eder
// ============================================================================

export async function POST() {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const result = await syncOkisanProducts()

    return NextResponse.json({
      success: true,
      message: `${result.synced} ürün senkronize edildi.`,
      data: {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
