/**
 * Scraper Scheduler
 * Runs supplier scrapers based on their syncIntervalMinutes
 * Sequential execution with rate limiting
 *
 * Usage:
 *   npx tsx workers/scraper/scheduler.ts          # Run once
 *   npx tsx workers/scraper/scheduler.ts --watch   # Run in loop
 */

import { config } from "dotenv"
config() // .env yükle

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { BaseScraper, type ScraperResult } from "./base"
import { OkisanScraper } from "./suppliers/okisan"
import { B2BDepoXmlFetcher } from "./suppliers/b2bdepo-xml"
import { ErgenScraper } from "./suppliers/ergen"

// ============================================================================
// Scraper Registry (Browser tabanli)
// ============================================================================

const scraperRegistry: Record<string, () => BaseScraper> = {
  // b2bdepo artik XML tabanli, asagidaki xmlSyncRegistry'den calistiriliyor
  // b2bdepo: () => new B2BDepoScraper(),
  okisan: () => new OkisanScraper(),
  ergen: () => new ErgenScraper(),
  // Add more suppliers here:
  // venas: () => new VenasScraper(),
  // bayikanali: () => new BayiKanaliScraper(),
}

// ============================================================================
// XML Sync Registry (HTTP fetch + XML parse tabanli)
// ============================================================================

interface XmlSyncResult {
  status: "SUCCESS" | "PARTIAL" | "ERROR"
  productsFound: number
  productsUpdated: number
  productsNew: number
  errorsCount: number
  errorMessage?: string
  durationMs: number
}

const xmlSyncRegistry: Record<string, () => Promise<XmlSyncResult>> = {
  b2bdepo: async () => {
    // B2BDepo XML PriceStock cek (daha sik calistirilabilir)
    // ProductList icin API route'u kullan (saat kisitlamasi var)
    const fetcher = new B2BDepoXmlFetcher()

    try {
      const result = await fetcher.fetchPriceStock()
      return {
        status: "SUCCESS" as const,
        productsFound: result.items.length,
        productsUpdated: result.items.length,
        productsNew: 0,
        errorsCount: 0,
        durationMs: result.durationMs,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        status: "ERROR" as const,
        productsFound: 0,
        productsUpdated: 0,
        productsNew: 0,
        errorsCount: 1,
        errorMessage: message,
        durationMs: 0,
      }
    }
  },
}

// ============================================================================
// Scheduler
// ============================================================================

// Pool configuration - parse DATABASE_URL for SCRAM compatibility
const dbUrl = process.env.DATABASE_URL || ""
const pool = new Pool({
  connectionString: dbUrl,
  ssl: false,
  // Allow SCRAM auth
  password: dbUrl.match(/:([^:@]+)@/)?.[1] || process.env.DB_PASSWORD || "",
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function syncSupplier(supplierCode: string): Promise<ScraperResult | null> {
  // Oncelik: XML sync registry'den bak, yoksa browser scraper registry'den bak
  const xmlSyncFactory = xmlSyncRegistry[supplierCode]
  const scraperFactory = scraperRegistry[supplierCode]

  if (!xmlSyncFactory && !scraperFactory) {
    console.warn(`[Scheduler] No scraper registered for: ${supplierCode}`)
    return null
  }

  // Check if supplier exists and is active
  const supplier = await prisma.supplier.findUnique({
    where: { code: supplierCode },
  })

  if (!supplier) {
    console.warn(`[Scheduler] Supplier not found in DB: ${supplierCode}`)
    return null
  }

  if (!supplier.isActive) {
    console.log(`[Scheduler] Supplier is inactive, skipping: ${supplierCode}`)
    return null
  }

  if (supplier.scraperType === "MANUAL") {
    console.log(`[Scheduler] Supplier is manual, skipping: ${supplierCode}`)
    return null
  }

  // Check if already running
  if (supplier.syncStatus === "RUNNING") {
    console.log(`[Scheduler] Supplier already running, skipping: ${supplierCode}`)
    return null
  }

  // Check if enough time has passed since last sync
  if (supplier.lastSyncAt) {
    const elapsed = Date.now() - supplier.lastSyncAt.getTime()
    const intervalMs = supplier.syncIntervalMinutes * 60 * 1000
    if (elapsed < intervalMs) {
      const remaining = Math.ceil((intervalMs - elapsed) / 60_000)
      console.log(
        `[Scheduler] ${supplierCode}: last sync was ${remaining}m ago, interval is ${supplier.syncIntervalMinutes}m. Skipping.`
      )
      return null
    }
  }

  console.log(`[Scheduler] Starting sync for: ${supplierCode}`)

  // XML tabanli sync
  if (xmlSyncFactory) {
    console.log(`[Scheduler] ${supplierCode}: XML sync kullaniliyor`)
    const xmlResult = await xmlSyncFactory()
    return {
      status: xmlResult.status,
      productsFound: xmlResult.productsFound,
      productsUpdated: xmlResult.productsUpdated,
      productsNew: xmlResult.productsNew,
      productsRemoved: 0,
      errorsCount: xmlResult.errorsCount,
      errorMessage: xmlResult.errorMessage,
      durationMs: xmlResult.durationMs,
    }
  }

  // Browser tabanli scraper
  const scraper = scraperFactory!()
  return scraper.run()
}

async function runAllSuppliers(): Promise<void> {
  console.log("========================================")
  console.log(`[Scheduler] Starting scraper run at ${new Date().toISOString()}`)
  console.log("========================================")

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" }, // Higher priority first
  })

  console.log(`[Scheduler] Found ${suppliers.length} active suppliers`)

  let totalNew = 0
  let totalUpdated = 0
  let totalErrors = 0

  for (const supplier of suppliers) {
    const result = await syncSupplier(supplier.code)

    if (result) {
      totalNew += result.productsNew
      totalUpdated += result.productsUpdated
      totalErrors += result.errorsCount

      console.log(
        `[Scheduler] ${supplier.code}: ${result.status} — new: ${result.productsNew}, updated: ${result.productsUpdated}, errors: ${result.errorsCount} (${result.durationMs}ms)`
      )
    }

    // Rate limiting between suppliers
    const nextSupplier = suppliers[suppliers.indexOf(supplier) + 1]
    if (nextSupplier) {
      console.log("[Scheduler] Waiting 5s before next supplier...")
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }

  console.log("========================================")
  console.log(
    `[Scheduler] Run complete — Total new: ${totalNew}, updated: ${totalUpdated}, errors: ${totalErrors}`
  )
  console.log("========================================")
}

// ============================================================================
// CLI
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const watchMode = args.includes("--watch")
  const singleSupplier = args.find((a) => !a.startsWith("--"))

  if (singleSupplier && !watchMode) {
    // Run single supplier
    const code = singleSupplier.replace("--supplier=", "")
    console.log(`[Scheduler] Running single supplier: ${code}`)
    const result = await syncSupplier(code)
    if (result) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log("No result returned.")
    }
    return
  }

  if (watchMode) {
    console.log("[Scheduler] Watch mode enabled. Running every 30 minutes.")
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await runAllSuppliers()
      console.log("[Scheduler] Next run in 30 minutes...")
      await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000))
    }
  } else {
    // Single run
    await runAllSuppliers()
  }
}

main()
  .catch((err) => {
    console.error("[Scheduler] Fatal error:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await BaseScraper.disconnect()
  })
