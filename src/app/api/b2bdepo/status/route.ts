import { NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { getSyncStatus } from "@/services/b2bdepo-xml.service"

// ============================================================================
// GET /api/b2bdepo/status
// B2BDepo XML entegrasyon durumu: son sync, kalan cekim hakki
// ============================================================================

export async function GET() {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const status = await getSyncStatus()

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
