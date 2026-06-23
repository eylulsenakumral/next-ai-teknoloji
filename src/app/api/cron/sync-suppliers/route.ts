/**
 * GET /api/cron/sync-suppliers
 *
 * Vercel Cron (veya external cron service) tarafından çağrılır.
 * Aktif tedarikçileri syncIntervalMinutes kontrolüyle sırayla senkronize eder.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 */

import { runScheduledSync } from "@/lib/supplier-sync-runner"

export const dynamic = "force-dynamic"
// Long supplier syncs can take several minutes.
export const maxDuration = 300

export async function GET(request: Request) {
  // ── Auth kontrolü ────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[cron/sync-suppliers] CRON_SECRET env değişkeni tanımlı değil")
    return new Response("Server misconfiguration", { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron/sync-suppliers] Yetkisiz erişim denemesi")
    return new Response("Unauthorized", { status: 401 })
  }

  // ── Sync çalıştır ────────────────────────────────────────────────────────
  const startedAt = Date.now()

  console.log("[cron/sync-suppliers] Zamanlanmış sync başladı")

  try {
    const summary = await runScheduledSync()

    const durationMs = Date.now() - startedAt

    console.log(
      `[cron/sync-suppliers] Tamamlandı — tedarikçi: ${summary.totalSuppliers},` +
        ` sync: ${summary.synced}, atlanan: ${summary.skipped}, süre: ${durationMs}ms`
    )

    return Response.json({
      ok: true,
      durationMs,
      totalSuppliers: summary.totalSuppliers,
      synced: summary.synced,
      skipped: summary.skipped,
      results: summary.results.map((r) => ({
        supplier: r.supplierCode,
        status: r.status,
        totalProducts: r.totalProducts,
        created: r.created,
        updated: r.updated,
        errors: r.errors,
        durationMs: r.durationMs,
        attempts: r.attempts,
        ...(r.skippedReason ? { skippedReason: r.skippedReason } : {}),
        ...(r.errorMessage ? { errorMessage: r.errorMessage } : {}),
      })),
    })
  } catch (err) {
    const durationMs = Date.now() - startedAt
    const message = err instanceof Error ? err.message : String(err)

    console.error("[cron/sync-suppliers] Kritik hata:", message)

    return Response.json(
      {
        ok: false,
        durationMs,
        error: "Sync başarısız",
      },
      { status: 500 }
    )
  }
}
