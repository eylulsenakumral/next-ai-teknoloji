/**
 * Sync Logger
 *
 * Tedarikçi senkronizasyon loglarını ScraperLog tablosuna yazar.
 * Her sync başında log oluşturulur, bitişte güncellenir.
 */

import { SupplierSyncStatus } from "@prisma/client"
import { prisma } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export interface SyncLogEntry {
  supplierId: string
  supplierCode: string
  startedAt: Date
  completedAt: Date
  status: "SUCCESS" | "PARTIAL" | "ERROR"
  totalProducts: number
  created: number
  updated: number
  errors: number
  errorDetails?: string
}

// ============================================================================
// writeSyncLog
// ============================================================================

/**
 * Tamamlanan bir sync işlemini ScraperLog tablosuna kaydet.
 */
export async function writeSyncLog(entry: SyncLogEntry): Promise<void> {
  const durationMs = entry.completedAt.getTime() - entry.startedAt.getTime()

  const status =
    entry.status === "SUCCESS"
      ? SupplierSyncStatus.SUCCESS
      : entry.status === "PARTIAL"
        ? SupplierSyncStatus.PARTIAL
        : SupplierSyncStatus.ERROR

  try {
    await prisma.scraperLog.create({
      data: {
        supplierId: entry.supplierId,
        startedAt: entry.startedAt,
        finishedAt: entry.completedAt,
        status,
        productsFound: entry.totalProducts,
        productsUpdated: entry.updated,
        productsNew: entry.created,
        productsRemoved: 0,
        errorsCount: entry.errors,
        errorMessage: entry.errorDetails ?? null,
        durationMs,
        metadata: {
          supplierCode: entry.supplierCode,
          triggeredBy: "cron",
        },
      },
    })
  } catch (err) {
    // Log yazma hatası sync'i engellemez, sadece konsola düşer
    console.error(
      `[sync-logger] ScraperLog yazılamadı (${entry.supplierCode}):`,
      err instanceof Error ? err.message : String(err)
    )
  }
}
