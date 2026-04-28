/**
 * GET /api/cron/sync-b2bdepo-pricestock
 *
 * B2BDepo hızlı fiyat/stok güncelleme cron'u.
 * Günde 4 kez çalışır (vercel.json'da tanımlı).
 * Auth: Authorization: Bearer <CRON_SECRET>
 */

import { syncPriceStock } from "@/services/b2bdepo-xml.service"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return new Response("Server misconfiguration", { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const result = await syncPriceStock()
    const durationMs = Date.now() - startedAt

    console.log(
      `[cron/sync-b2bdepo-pricestock] Tamamlandı — synced: ${result.synced}, updated: ${result.updated}, errors: ${result.errors}, süre: ${durationMs}ms`
    )

    return Response.json({
      ok: true,
      durationMs,
      synced: result.synced,
      updated: result.updated,
      priceChanges: result.priceChanges,
      errors: result.errors,
    })
  } catch (err) {
    const durationMs = Date.now() - startedAt
    const message = err instanceof Error ? err.message : String(err)
    console.error("[cron/sync-b2bdepo-pricestock] Kritik hata:", message)
    return Response.json({ ok: false, durationMs, error: message }, { status: 500 })
  }
}
