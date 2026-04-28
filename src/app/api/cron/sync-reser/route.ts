/**
 * GET /api/cron/sync-reser
 *
 * Reser Bayi XML tam ürün sync — interval kontrolü yok, her çağrıda çalışır.
 * Auth: Authorization: Bearer <CRON_SECRET>
 */

import { syncReserProducts } from "@/services/reser.service"

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
    const result = await syncReserProducts()
    const durationMs = Date.now() - startedAt

    console.log(
      `[cron/sync-reser] Tamamlandı — synced: ${result.synced}, created: ${result.created}, updated: ${result.updated}, errors: ${result.errors}, süre: ${durationMs}ms`
    )

    return Response.json({
      ok: true,
      durationMs,
      synced: result.synced,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
    })
  } catch (err) {
    const durationMs = Date.now() - startedAt
    const message = err instanceof Error ? err.message : String(err)
    console.error("[cron/sync-reser] Kritik hata:", message)
    return Response.json({ ok: false, durationMs, error: message }, { status: 500 })
  }
}
