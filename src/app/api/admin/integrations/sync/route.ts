/**
 * POST /api/admin/integrations/sync
 *
 * Belirli bir tedarikçi için manuel senkronizasyonu tetikler.
 * Body: { supplierCode: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// Tedarikçi kodu → ilgili sync API yolu
const SUPPLIER_SYNC_ROUTES: Record<string, string> = {
  B2BDEPO: "/api/b2bdepo/sync-products",
  BIZIMHESAP: "/api/bizimhesap/sync-products",
  INDEXGRUP: "/api/indexgrup/sync",
  NETEX: "/api/netex/sync",
  OKISAN: "/api/okisan/sync",
  TESAN: "/api/tesan/sync",
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  let supplierCode: string | undefined

  try {
    const body = (await req.json()) as { supplierCode?: string }
    supplierCode = body?.supplierCode?.toUpperCase()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  if (!supplierCode) {
    return NextResponse.json({ error: "supplierCode zorunludur." }, { status: 400 })
  }

  const syncPath = SUPPLIER_SYNC_ROUTES[supplierCode]

  if (!syncPath) {
    return NextResponse.json(
      { error: `Bilinmeyen tedarikçi kodu: ${supplierCode}` },
      { status: 400 }
    )
  }

  // Sync route'unu aynı origin üzerinden çağır
  const origin = req.nextUrl.origin
  const syncUrl = `${origin}${syncPath}`

  try {
    const syncRes = await fetch(syncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Cookie'yi ilet ki session korumalı route'lar çalışsın
        cookie: req.headers.get("cookie") ?? "",
      },
    })

    const data = await syncRes.json()

    if (!syncRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error ?? "Senkronizasyon başarısız." },
        { status: syncRes.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
