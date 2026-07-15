/**
 * Supplier Sync Runner
 *
 * Cron handler tarafından çağrılan tedarikçi senkronizasyon motoru.
 * Her tedarikçi için retry (max 3, exponential backoff) ve timeout (5 dk) uygular.
 * Sonuçları ScraperLog tablosuna yazar.
 */

import { SupplierSyncStatus } from "@prisma/client"
import { prisma } from "@/lib/db"
import {
  upsertSupplier,
  importProducts,
  updateSupplierSyncStatus,
} from "@/lib/import-supplier-products"
import { loadMappings } from "@/lib/category-mapping"
import { writeSyncLog } from "@/lib/sync-logger"

// ============================================================================
// Constants
// ============================================================================

const SYNC_TIMEOUT_MS = 5 * 60 * 1000 // 5 dakika
const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 1000 // 1s → 3s → 9s

// ============================================================================
// Types
// ============================================================================

export interface SupplierSyncResult {
  supplierCode: string
  supplierId: string
  status: "SUCCESS" | "PARTIAL" | "ERROR" | "SKIPPED"
  totalProducts: number
  created: number
  updated: number
  errors: number
  durationMs: number
  skippedReason?: string
  errorMessage?: string
  attempts: number
}

// ============================================================================
// sleep helper
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// runWithTimeout
// ============================================================================

/**
 * Verilen async fonksiyonu belirlenen süre içinde tamamlamazsa reddeder.
 */
async function runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Sync timeout: ${timeoutMs / 1000} saniye aşıldı`))
    }, timeoutMs)

    fn()
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

// ============================================================================
// Per-supplier sync functions
// ============================================================================

async function syncB2BDepo(_supplierId: string): Promise<{
  total: number
  created: number
  updated: number
  errors: number
}> {
  const { syncProducts } = await import("@/services/b2bdepo-xml.service")
  const result = await syncProducts()
  return {
    total: result.synced,
    created: result.created,
    updated: result.updated,
    errors: result.errors,
  }
}

async function syncOkisan(_supplierId: string): Promise<{
  total: number
  created: number
  updated: number
  errors: number
}> {
  const { syncOkisanProducts } = await import("@/services/okisan.service")
  const result = await syncOkisanProducts()
  return {
    total: result.synced,
    created: result.created,
    updated: result.updated,
    errors: result.errors,
  }
}

// Supplier code → sync fonksiyonu eşlemesi
// Not: BizimHesap kendi API route'u üzerinden sync oluyor, bu runner'a dahil değil.
const SYNC_RUNNERS: Record<
  string,
  (supplierId: string) => Promise<{ total: number; created: number; updated: number; errors: number }>
> = {
  b2bdepo: syncB2BDepo,
<<<<<<< HEAD
  okisan: syncOkisan,
=======
  B2BDEPO: syncB2BDepo,
>>>>>>> 234d523 (refactor(integration): B2BDepo dışı XML/SOAP entegrasyonlarını kaldır)
}

// ============================================================================
// runSupplierSync — tek bir tedarikçiyi retry ile çalıştır
// ============================================================================

async function runSupplierSync(supplier: {
  id: string
  code: string
  name: string
}): Promise<SupplierSyncResult> {
  const runner = SYNC_RUNNERS[supplier.code]

  if (!runner) {
    return {
      supplierCode: supplier.code,
      supplierId: supplier.id,
      status: "SKIPPED",
      totalProducts: 0,
      created: 0,
      updated: 0,
      errors: 0,
      durationMs: 0,
      skippedReason: `Tanımlı sync runner yok (code: ${supplier.code})`,
      attempts: 0,
    }
  }

  const startedAt = new Date()
  let lastError: Error | null = null
  let attempts = 0

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    attempts = attempt

    try {
      // İlk denemede RUNNING durumuna al
      if (attempt === 1) {
        await updateSupplierSyncStatus(supplier.id, SupplierSyncStatus.RUNNING)
      }

      console.log(
        `[cron] ${supplier.code} sync başlıyor (deneme ${attempt}/${MAX_RETRIES})`
      )

      const importResult = await runWithTimeout(
        () => runner(supplier.id),
        SYNC_TIMEOUT_MS
      )

      const completedAt = new Date()
      const durationMs = completedAt.getTime() - startedAt.getTime()

      const status =
        importResult.errors === 0 ? SupplierSyncStatus.SUCCESS : SupplierSyncStatus.PARTIAL
      const resultStatus: "SUCCESS" | "PARTIAL" =
        importResult.errors === 0 ? "SUCCESS" : "PARTIAL"

      await updateSupplierSyncStatus(supplier.id, status)

      await writeSyncLog({
        supplierId: supplier.id,
        supplierCode: supplier.code,
        startedAt,
        completedAt,
        status: resultStatus,
        totalProducts: importResult.total,
        created: importResult.created,
        updated: importResult.updated,
        errors: importResult.errors,
      })

      console.log(
        `[cron] ${supplier.code} tamamlandı — toplam: ${importResult.total},` +
          ` yeni: ${importResult.created}, güncellenen: ${importResult.updated},` +
          ` hata: ${importResult.errors}, süre: ${durationMs}ms`
      )

      return {
        supplierCode: supplier.code,
        supplierId: supplier.id,
        status: resultStatus,
        totalProducts: importResult.total,
        created: importResult.created,
        updated: importResult.updated,
        errors: importResult.errors,
        durationMs,
        attempts,
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.error(
        `[cron] ${supplier.code} hata (deneme ${attempt}/${MAX_RETRIES}): ${lastError.message}`
      )

      if (attempt < MAX_RETRIES) {
        const backoffMs = BACKOFF_BASE_MS * Math.pow(3, attempt - 1)
        console.log(`[cron] ${supplier.code} ${backoffMs}ms bekleyip tekrar deneniyor...`)
        await sleep(backoffMs)
      }
    }
  }

  // Tüm denemeler başarısız
  const completedAt = new Date()
  const durationMs = completedAt.getTime() - startedAt.getTime()
  const errorMessage = lastError?.message ?? "Bilinmeyen hata"

  await updateSupplierSyncStatus(
    supplier.id,
    SupplierSyncStatus.ERROR,
    errorMessage
  ).catch(() => {})

  await writeSyncLog({
    supplierId: supplier.id,
    supplierCode: supplier.code,
    startedAt,
    completedAt,
    status: "ERROR",
    totalProducts: 0,
    created: 0,
    updated: 0,
    errors: 1,
    errorDetails: errorMessage,
  })

  return {
    supplierCode: supplier.code,
    supplierId: supplier.id,
    status: "ERROR",
    totalProducts: 0,
    created: 0,
    updated: 0,
    errors: 1,
    durationMs,
    errorMessage,
    attempts,
  }
}

// ============================================================================
// runScheduledSync — cron tarafından çağrılan ana fonksiyon
// ============================================================================

/**
 * Aktif ve sync zamanı gelen tedarikçileri sırayla senkronize eder.
 *
 * - isActive = true olan supplier'ları çeker
 * - Her biri için lastSyncAt + syncIntervalMinutes kontrolü yapar
 * - Sırayla (paralel değil — API rate limit) çalıştırır
 */
export async function runScheduledSync(): Promise<{
  totalSuppliers: number
  synced: number
  skipped: number
  results: SupplierSyncResult[]
}> {
  const now = new Date()

  // Aktif tedarikçileri çek
  const suppliers = await prisma.supplier.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { priority: "desc" },
    select: {
      id: true,
      code: true,
      name: true,
      lastSyncAt: true,
      syncIntervalMinutes: true,
      syncStatus: true,
    },
  })

  const results: SupplierSyncResult[] = []
  let syncedCount = 0
  let skippedCount = 0

  for (const supplier of suppliers) {
    // Sync intervali kontrolü
    const intervalMs = (supplier.syncIntervalMinutes ?? 360) * 60 * 1000
    const nextSyncAt = supplier.lastSyncAt
      ? new Date(supplier.lastSyncAt.getTime() + intervalMs)
      : new Date(0) // hiç sync yapılmamışsa hemen çalıştır

    if (now < nextSyncAt) {
      const remainingMin = Math.ceil((nextSyncAt.getTime() - now.getTime()) / 60000)
      console.log(
        `[cron] ${supplier.code} atlandı — bir sonraki sync ${remainingMin} dakika sonra`
      )

      results.push({
        supplierCode: supplier.code,
        supplierId: supplier.id,
        status: "SKIPPED",
        totalProducts: 0,
        created: 0,
        updated: 0,
        errors: 0,
        durationMs: 0,
        skippedReason: `Interval henüz dolmadı (${remainingMin} dk kaldı)`,
        attempts: 0,
      })
      skippedCount++
      continue
    }

    // Halihazırda çalışıyorsa atla
    if (supplier.syncStatus === SupplierSyncStatus.RUNNING) {
      console.log(`[cron] ${supplier.code} atlandı — zaten RUNNING durumunda`)

      results.push({
        supplierCode: supplier.code,
        supplierId: supplier.id,
        status: "SKIPPED",
        totalProducts: 0,
        created: 0,
        updated: 0,
        errors: 0,
        durationMs: 0,
        skippedReason: "Zaten RUNNING durumunda",
        attempts: 0,
      })
      skippedCount++
      continue
    }

    const result = await runSupplierSync({
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
    })

    results.push(result)

    if (result.status !== "SKIPPED") {
      syncedCount++
    } else {
      skippedCount++
    }
  }

  return {
    totalSuppliers: suppliers.length,
    synced: syncedCount,
    skipped: skippedCount,
    results,
  }
}
