/**
 * Base Scraper Framework
 * Abstract class for all supplier scrapers
 * Handles: login, navigate, scrape, parse, save, retry, rate limiting, logging
 */

import { chromium, type Browser, type Page, type BrowserContext } from "playwright"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import type { Supplier, ScraperLog } from "@prisma/client"

// ============================================================================
// Types
// ============================================================================

export interface ScrapedProduct {
  externalId: string
  externalName: string
  externalBarcode?: string | null
  externalSku?: string | null
  externalUrl?: string | null
  purchasePrice: number | null
  currency: string
  stockQuantity: number
  vatRate?: number | null
  isAvailable: boolean
  rawData?: Record<string, unknown>
}

export interface ScraperConfig {
  maxRetries: number
  retryDelayMs: number
  requestDelayMs: number
  timeoutMs: number
  headless: boolean
  maxProductsPerRun: number
}

export interface ScraperResult {
  status: "SUCCESS" | "PARTIAL" | "ERROR"
  productsFound: number
  productsUpdated: number
  productsNew: number
  productsRemoved: number
  errorsCount: number
  errorMessage?: string
  durationMs: number
}

const DEFAULT_CONFIG: ScraperConfig = {
  maxRetries: 3,
  retryDelayMs: 2000,
  requestDelayMs: 500,
  timeoutMs: 30000,
  headless: true,
  maxProductsPerRun: 5000,
}

// ============================================================================
// DB Client (shared across scrapers in same process)
// ============================================================================

let _prisma: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (_prisma) return _prisma

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  const pool = new Pool({
    connectionString,
    ssl: false,
  })

  const adapter = new PrismaPg(pool)
  _prisma = new PrismaClient({ adapter })
  return _prisma
}

// ============================================================================
// BaseScraper
// ============================================================================

export abstract class BaseScraper {
  protected get prisma(): PrismaClient {
    return getPrisma()
  }
  protected config: ScraperConfig
  protected browser: Browser | null = null
  protected context: BrowserContext | null = null
  protected page: Page | null = null
  protected supplier: Supplier | null = null
  protected logId: string | null = null
  protected abortController = new AbortController()

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ------------------------------------------------------------------
  // Abstract methods — subclasses MUST implement
  // ------------------------------------------------------------------

  /** Supplier code used to look up the Supplier record */
  abstract readonly supplierCode: string

  /** Authenticate with the supplier site. Set cookies/session. */
  abstract login(page: Page): Promise<void>

  /** Navigate to the product listing page(s) and return raw data. */
  abstract scrape(page: Page): Promise<ScrapedProduct[]>

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  /** Full run: init → login → scrape → save → cleanup → return result */
  async run(): Promise<ScraperResult> {
    const startTime = Date.now()
    let result: ScraperResult = {
      status: "ERROR",
      productsFound: 0,
      productsUpdated: 0,
      productsNew: 0,
      productsRemoved: 0,
      errorsCount: 0,
      errorMessage: undefined,
      durationMs: 0,
    }

    try {
      // 1. Load supplier record
      this.supplier = await this.prisma.supplier.findUnique({
        where: { code: this.supplierCode },
      })
      if (!this.supplier) {
        throw new Error(`Supplier not found: ${this.supplierCode}`)
      }

      // 2. Create scraper log entry
      const log = await this.prisma.scraperLog.create({
        data: {
          supplierId: this.supplier.id,
          status: "RUNNING",
          startedAt: new Date(),
        },
      })
      this.logId = log.id

      // 3. Mark supplier as running
      await this.prisma.supplier.update({
        where: { id: this.supplier.id },
        data: { syncStatus: "RUNNING", syncError: null },
      })

      console.log(`[Scraper:${this.supplierCode}] Starting sync...`)

      // 4. Launch browser
      await this.initBrowser()

      // 5. Login with retry
      await this.withRetry("login", () => this.login(this.page!))

      // 6. Scrape products
      const products = await this.withRetry("scrape", () =>
        this.scrape(this.page!)
      )

      // 7. Save to DB
      const saveResult = await this.saveProducts(products)

      result = {
        status: saveResult.errorsCount > 0 ? "PARTIAL" : "SUCCESS",
        productsFound: products.length,
        ...saveResult,
        durationMs: Date.now() - startTime,
      }

      console.log(
        `[Scraper:${this.supplierCode}] Done — found: ${result.productsFound}, new: ${result.productsNew}, updated: ${result.productsUpdated}, errors: ${result.errorsCount}`
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errorMessage = message
      result.durationMs = Date.now() - startTime
      console.error(`[Scraper:${this.supplierCode}] Error: ${message}`)
    } finally {
      // 8. Cleanup
      await this.cleanup()

      // 9. Update log
      if (this.logId && this.supplier) {
        await this.prisma.scraperLog.update({
          where: { id: this.logId },
          data: {
            status: result.status,
            finishedAt: new Date(),
            productsFound: result.productsFound,
            productsUpdated: result.productsUpdated,
            productsNew: result.productsNew,
            productsRemoved: result.productsRemoved,
            errorsCount: result.errorsCount,
            errorMessage: result.errorMessage,
            durationMs: result.durationMs,
          },
        })

        await this.prisma.supplier.update({
          where: { id: this.supplier.id },
          data: {
            syncStatus: result.status,
            syncError: result.errorMessage,
            lastSyncAt: new Date(),
          },
        })
      }
    }

    return result
  }

  // ------------------------------------------------------------------
  // Browser management
  // ------------------------------------------------------------------

  protected async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
    })

    this.context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "tr-TR",
      timezoneId: "Europe/Istanbul",
    })

    this.page = await this.context.newPage()
    this.page.setDefaultTimeout(this.config.timeoutMs)
  }

  protected async cleanup(): Promise<void> {
    try {
      if (this.page) await this.page.close().catch(() => {})
      if (this.context) await this.context.close().catch(() => {})
      if (this.browser) await this.browser.close().catch(() => {})
    } catch (e) {
      // best-effort cleanup
    } finally {
      this.page = null
      this.context = null
      this.browser = null
    }
  }

  // ------------------------------------------------------------------
  // Save products to DB (upsert + price history)
  // ------------------------------------------------------------------

  protected async saveProducts(products: ScrapedProduct[]): Promise<
    Pick<
      ScraperResult,
      "productsUpdated" | "productsNew" | "productsRemoved" | "errorsCount"
    >
  > {
    if (!this.supplier) throw new Error("Supplier not loaded")

    let updated = 0
    let created = 0
    let errors = 0
    const limitedProducts = products.slice(0, this.config.maxProductsPerRun)

    // Get existing external IDs for this supplier
    const existing = await this.prisma.supplierProduct.findMany({
      where: { supplierId: this.supplier.id },
      select: { externalId: true, id: true, purchasePrice: true },
    })

    const existingMap = new Map<string, { id: string; purchasePrice: number | null }>()
    for (const e of existing) {
      if (e.externalId) existingMap.set(e.externalId, { id: e.id, purchasePrice: e.purchasePrice ? Number(e.purchasePrice) : null })
    }

    const scrapedExternalIds = new Set<string>()

    for (const product of limitedProducts) {
      try {
        scrapedExternalIds.add(product.externalId)
        const prev = existingMap.get(product.externalId)

        if (prev) {
          // Update existing — check for price change
          const priceChanged =
            prev.purchasePrice !== null &&
            product.purchasePrice !== null &&
            prev.purchasePrice !== product.purchasePrice

          await this.prisma.supplierProduct.update({
            where: { id: prev.id },
            data: {
              externalName: product.externalName,
              externalBarcode: product.externalBarcode,
              externalSku: product.externalSku,
              externalUrl: product.externalUrl,
              purchasePrice: product.purchasePrice,
              currency: product.currency,
              vatRate: product.vatRate,
              stockQuantity: product.stockQuantity,
              isAvailable: product.isAvailable,
              rawData: (product.rawData ?? {}) as any,
              lastScrapedAt: new Date(),
            },
          })

          // Log price change
          if (priceChanged && prev.purchasePrice !== null && product.purchasePrice !== null) {
            const oldPrice = prev.purchasePrice
            const newPrice = product.purchasePrice
            const pct =
              oldPrice !== 0
                ? Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(2))
                : null

            await this.prisma.priceHistory.create({
              data: {
                supplierProductId: prev.id,
                oldPrice,
                newPrice,
                currency: product.currency,
                priceChangePct: pct,
              },
            })
          }

          updated++
        } else {
          // Create new
          await this.prisma.supplierProduct.create({
            data: {
              supplierId: this.supplier.id,
              externalId: product.externalId,
              externalName: product.externalName,
              externalBarcode: product.externalBarcode,
              externalSku: product.externalSku,
              externalUrl: product.externalUrl,
              purchasePrice: product.purchasePrice,
              currency: product.currency,
              vatRate: product.vatRate,
              stockQuantity: product.stockQuantity,
              isAvailable: product.isAvailable,
              rawData: (product.rawData ?? {}) as any,
              lastScrapedAt: new Date(),
            },
          })
          created++
        }

        // Rate limiting between DB writes
        if (limitedProducts.indexOf(product) % 50 === 49) {
          await this.delay(this.config.requestDelayMs)
        }
      } catch (err) {
        errors++
        console.error(
          `[Scraper:${this.supplierCode}] Error saving product ${product.externalId}:`,
          err
        )
      }
    }

    // Mark products not found in this scrape as potentially unavailable
    // (soft approach — just log, don't delete)
    let removed = 0
    const existingEntries = Array.from(existingMap.entries())
    for (const [extId, entry] of existingEntries) {
      if (!scrapedExternalIds.has(extId)) {
        try {
          await this.prisma.supplierProduct.update({
            where: { id: entry.id },
            data: { isAvailable: false },
          })
          removed++
        } catch (e) {
          // ignore
        }
      }
    }

    return { productsUpdated: updated, productsNew: created, productsRemoved: removed, errorsCount: errors }
  }

  // ------------------------------------------------------------------
  // Retry logic with exponential backoff
  // ------------------------------------------------------------------

  protected async withRetry<T>(
    label: string,
    fn: () => Promise<T>,
    retries = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Check for abort signal
        if (this.abortController.signal.aborted) {
          throw new Error("Scraper aborted")
        }
        return await fn()
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(
          `[Scraper:${this.supplierCode}] ${label} attempt ${attempt}/${retries} failed: ${lastError.message}`
        )

        if (attempt < retries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1)
          await this.delay(delay)
        }
      }
    }

    throw lastError || new Error(`${label} failed after ${retries} retries`)
  }

  // ------------------------------------------------------------------
  // Utility
  // ------------------------------------------------------------------

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /** Abort the running scraper */
  abort(): void {
    this.abortController.abort()
  }

  /** Disconnect prisma (call when process exits) */
  static async disconnect(): Promise<void> {
    if (_prisma) {
      await _prisma.$disconnect()
      _prisma = null
    }
  }
}
