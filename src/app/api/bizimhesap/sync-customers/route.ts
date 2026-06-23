import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { syncCustomers, getBizimhesapToken } from "@/services/bizimhesap.service"

export const maxDuration = 300

// ============================================================================
// POST /api/bizimhesap/sync-customers
// BizimHesap'tan müşterileri çeker ve Customer tablosuna senkronize eder
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
    const result = await syncCustomers(token)

    return NextResponse.json({
      success: true,
      message: `${result.synced} müşteri senkronize edildi. (${result.created} yeni, ${result.updated} güncellendi)`,
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
