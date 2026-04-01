import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { syncInventory, getBizimhesapToken } from "@/services/bizimhesap.service"

// ============================================================================
// POST /api/bizimhesap/sync-inventory
// BizimHesap depo stoklarını çeker ve SupplierProduct tablosunu günceller
// Body (opsiyonel): { token?: string }
// ============================================================================

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  let bodyToken: string | undefined
  try {
    const body = (await req.json()) as { token?: string }
    bodyToken = body.token
  } catch {
    // body opsiyonel
  }

  const token = bodyToken ?? (await getBizimhesapToken())

  if (!token) {
    return NextResponse.json(
      { success: false, error: "BizimHesap API token bulunamadı. Entegrasyonlar sayfasından kaydedin." },
      { status: 400 }
    )
  }

  try {
    const result = await syncInventory(token)

    return NextResponse.json({
      success: true,
      message: `${result.synced} stok kaydı güncellendi.`,
      data: {
        synced: result.synced,
        errors: result.errors,
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
