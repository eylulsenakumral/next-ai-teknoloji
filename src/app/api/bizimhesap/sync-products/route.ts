import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { syncProducts, getBizimhesapToken } from "@/services/bizimhesap.service"

export const maxDuration = 300

// ============================================================================
// POST /api/bizimhesap/sync-products
// BizimHesap'tan ürünleri çeker ve DB'ye senkronize eder
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
    const result = await syncProducts(token)

    return NextResponse.json({
      success: true,
      message: `${result.synced} ürün senkronize edildi.`,
      data: {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
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
