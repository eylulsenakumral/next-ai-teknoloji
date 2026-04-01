/**
 * Okisan Scraper
 * Site: https://www.okisan.com
 *
 * WordPress + WooCommerce + Avada theme + YITH Catalog Mode
 *
 * IMPORTANT FINDINGS (2026-03-27):
 * - wc/v3 REST API: 401 (requires API key, cookie-auth NOT enough)
 * - wc/store/v1 API: WORKS without auth! Returns 1390 products
 *   BUT prices are all $0 and stock_status is null/missing
 * - YITH WooCommerce Catalog Mode Premium installed → prices hidden for guests
 * - Prices are rendered server-side in HTML (not JS) but may be hidden by catalog mode for non-logged users
 * - Stock shows as "Stok Sorunuz" on product pages
 * - Login via wp-login.php works (POST to /wp-login.php with log+pwd)
 * - Currency: USD
 * - 139 categories, 1390 products total
 * - Shop page: /urunler/ (1.6MB HTML, very heavy)
 *
 * STRATEGY: Use wc/store/v1 for product catalog (names, images, categories, SKUs)
 *           Login first, then scrape individual product pages for prices/stock
 *           OR login + page.evaluate() to read rendered price HTML after catalog mode unlocks
 *
 * ENV vars:
 *   SCRAPER_OKISAN_USER    - Kullanıcı adı
 *   SCRAPER_OKISAN_PASS    - Şifre
 */

import type { Page } from "playwright"
import { BaseScraper, type ScrapedProduct } from "../base"

export class OkisanScraper extends BaseScraper {
  readonly supplierCode = "okisan"

  private credentials = {
    username: process.env.SCRAPER_OKISAN_USER ?? "",
    password: process.env.SCRAPER_OKISAN_PASS ?? "",
  }

  private wpNonce: string | null = null
  private cookies: string | null = null

  // ------------------------------------------------------------------
  // Login
  // ------------------------------------------------------------------

  async login(page: Page): Promise<void> {
    console.log("[Okisan] Navigating to login page...")

    // Try wp-login.php first
    await page.goto("https://www.okisan.com/wp-login.php", {
      waitUntil: "networkidle",
    }).catch(() => null)

    // Check if custom login form instead
    const currentUrl = page.url()
    if (!currentUrl.includes("wp-login")) {
      await page.goto("https://www.okisan.com/giris", {
        waitUntil: "networkidle",
      }).catch(() => {
        return page.goto("https://www.okisan.com", {
          waitUntil: "networkidle",
        })
      })
    }

    // Fill WordPress login form
    const userField = "#user_login, input[name='log'], input[type='text']:first-of-type"
    const passField = "#user_pass, input[name='pwd'], input[type='password']"

    await page.waitForSelector(userField, { timeout: this.config.timeoutMs })
    await page.fill(userField, this.credentials.username)
    await page.fill(passField, this.credentials.password)

    console.log("[Okisan] Submitting login form...")

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}),
      page.click("#wp-submit, input[type='submit'], button[type='submit']"),
    ])

    // Verify login — check for admin bar or dashboard
    const isAdmin = await page
      .$eval("#wpadminbar, .woocommerce-myaccount", () => true)
      .catch(() => false)

    if (!isAdmin) {
      // Check if redirected to my-account page
      const url = page.url()
      const loggedIn =
        url.includes("my-account") ||
        url.includes("hesabim") ||
        !url.includes("login") ||
        !url.includes("giris")

      if (!loggedIn) {
        const errorMsg = await page
          .$eval("#login_error, .message, .woocommerce-error, .error", (el) =>
            el.textContent?.trim()
          )
          .catch(() => null)

        throw new Error(
          `Okisan login failed. URL: ${url}${errorMsg ? `. Error: ${errorMsg}` : ""}`
        )
      }
    }

    // Store cookies and nonce for API calls
    const context = page.context()
    const cookiesList = await context.cookies()
    this.cookies = cookiesList.map((c) => `${c.name}=${c.value}`).join("; ")

    console.log("[Okisan] Login successful.")
  }

  // ------------------------------------------------------------------
  // Scrape — try WooCommerce API first, fallback to page scraping
  // ------------------------------------------------------------------

  async scrape(page: Page): Promise<ScrapedProduct[]> {
    // Strategy 1: Try WooCommerce REST API with cookie auth
    let products = await this.tryWooCommerceAPI(page)

    if (products.length > 0) {
      console.log(`[Okisan] WooCommerce API returned ${products.length} products`)
      return products
    }

    console.log("[Okisan] WooCommerce API failed, falling back to page scraping...")

    // Strategy 2: Page scraping
    products = await this.scrapeFromPage(page)
    console.log(`[Okisan] Page scraping found ${products.length} products`)

    return products
  }

  // ------------------------------------------------------------------
  // Strategy 1: WooCommerce REST API
  // ------------------------------------------------------------------

  private async tryWooCommerceAPI(page: Page): Promise<ScrapedProduct[]> {
    try {
      if (!this.cookies) return []

      // Try to get products via REST API
      const response = await page.evaluate(
        async (cookies: string) => {
          const result = await fetch("/wp-json/wc/v3/products?per_page=100&page=1", {
            headers: {
              Cookie: cookies,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }).catch(() => null)

          if (!result || !result.ok) return null
          return await result.json()
        },
        this.cookies
      )

      if (!response || !Array.isArray(response)) return []

      // Parse WooCommerce products
      return response.map(
        (item: Record<string, unknown>): ScrapedProduct => {
          const images = item.images as Array<{ src: string }> | undefined
          const stockQty = item.stock_quantity as number | undefined
          const price = parseFloat(String(item.price ?? "0"))
          const categories = item.categories as Array<{ name: string }> | undefined

          return {
            externalId: String(item.id ?? ""),
            externalName: String(item.name ?? ""),
            externalSku: (item.sku as string) || null,
            externalUrl: (item.permalink as string) || null,
            purchasePrice: isNaN(price) ? null : price,
            currency: "TRY",
            stockQuantity: stockQty ?? 0,
            isAvailable: (item.stock_status as string) === "instock",
            rawData: {
              woocommerceId: item.id,
              slug: item.slug,
              status: item.status,
              categories: categories?.map((c) => c.name),
              images: images?.map((i) => i.src),
              type: item.type,
            },
          }
        }
      )
    } catch (err) {
      console.warn("[Okisan] WooCommerce API error:", err)
      return []
    }
  }

  // ------------------------------------------------------------------
  // Strategy 2: Page scraping
  // ------------------------------------------------------------------

  private async scrapeFromPage(page: Page): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = []

    // Navigate to shop page
    await page.goto("https://www.okisan.com/shop", {
      waitUntil: "networkidle",
    }).catch(() => {
      return page.goto("https://www.okisan.com/urunler", {
        waitUntil: "networkidle",
      })
    })

    // Wait for product grid
    const productSelector =
      ".product, .woocommerce-loop-product, .type-product, .urun-kart, .shop-item"
    await page.waitForSelector(productSelector, {
      timeout: this.config.timeoutMs,
    })

    // Scrape all pages
    let pageNum = 1
    const maxPages = 50

    while (pageNum <= maxPages) {
      console.log(`[Okisan] Scraping page ${pageNum}...`)

      const products = await page.evaluate(
        (selector: string): Omit<ScrapedProduct, "rawData">[] => {
          const items = Array.from(document.querySelectorAll(selector))
          const result: Omit<ScrapedProduct, "rawData">[] = []

          for (const item of items) {
            const nameEl =
              item.querySelector(
                ".woocommerce-loop-product__title, .product-title, .entry-title, h2, h3, .name"
              )
            const priceEl = item.querySelector(
              ".price, .woocommerce-Price-amount, .urun-fiyat"
            )
            const linkEl = item.querySelector("a[href*='/product/'], a[href*='/urun/']")
            const imgEl = item.querySelector("img")
            const skuEl = item.querySelector(
              ".sku, .product-sku, [data-sku]"
            )
            const categoryEl = item.querySelector(
              ".product-category, .category, .posted_in"
            )
            const stockEl = item.querySelector(
              ".stock, .availability, .stok-durumu"
            )

            const name = nameEl?.textContent?.trim() ?? ""
            if (!name) continue

            // Parse price — WooCommerce often has both regular and sale price
            let priceText = priceEl?.textContent?.trim() ?? ""
            // If there's a sale price, use the current (lower) price
            const salePriceEl = priceEl?.querySelector(
              ".woocommerce-Price-amount.amount, ins .amount"
            )
            if (salePriceEl) {
              priceText = salePriceEl.textContent?.trim() ?? priceText
            }

            const price = parseFloat(
              priceText.replace(/[^\d.,]/g, "").replace(",", ".")
            )

            const href = (linkEl as HTMLAnchorElement)?.href ?? ""
            const sku = skuEl?.textContent?.trim() || skuEl?.getAttribute("data-sku") || ""
            const category = categoryEl?.textContent?.trim() || ""
            const stockText = stockEl?.textContent?.trim() || ""
            const inStock =
              stockText.toLowerCase().includes("stokta") ||
              !stockText.toLowerCase().includes("yok")

            // Extract external ID from URL
            const urlMatch = href.match(/\/product\/([^/]+)/) ?? href.match(/\/urun\/([^/]+)/)
            const externalId = sku || urlMatch?.[1] || `okisan-${result.length}`

            result.push({
              externalId,
              externalName: name,
              externalSku: sku || null,
              externalUrl: href || undefined,
              purchasePrice: isNaN(price) ? null : price,
              currency: "TRY",
              stockQuantity: inStock ? (parseInt(stockText.replace(/[^\d]/g, ""), 10) || 1) : 0,
              isAvailable: inStock,
            })
          }

          return result
        },
        productSelector
      )

      allProducts.push(...products)

      // Pagination
      const hasNextPage = await this.checkNextPage(page)
      if (!hasNextPage) break

      pageNum++
      await this.delay(this.config.requestDelayMs * 2)
    }

    return allProducts
  }

  // ------------------------------------------------------------------
  // Pagination helper
  // ------------------------------------------------------------------

  private async checkNextPage(page: Page): Promise<boolean> {
    try {
      const nextBtn = await page.$(
        ".next, .pagination .next, a.next.page-numbers, ul.page-numbers li a.next, .woocommerce-pagination a.next"
      )

      if (!nextBtn) return false

      const className = await nextBtn.getAttribute("class") ?? ""
      if (className.includes("disabled")) return false

      await nextBtn.click()
      await page.waitForLoadState("networkidle").catch(() => {})
      return true
    } catch {
      return false
    }
  }
}
