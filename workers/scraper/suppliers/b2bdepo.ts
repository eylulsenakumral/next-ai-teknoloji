/**
 * B2BDepo Scraper
 * Site: https://www.b2bdepo.com
 *
 * Login: POST to login endpoint with bayiKodu, kullaniciAdi, sifre, GuvenlikSorusu
 * Products: Scrape product listing pages after login
 *
 * ENV vars:
 *   SCRAPER_B2BDEPO_BAYI_KODU   - Bayi kodu
 *   SCRAPER_B2BDEPO_KULLANICI    - Kullanıcı adı
 *   SCRAPER_B2BDEPO_SIFRE        - Şifre
 *   SCRAPER_B2BDEPO_GUVENLIK     - Güvenlik sorusu cevabı
 */

import type { Page } from "playwright"
import { BaseScraper, type ScrapedProduct } from "../base"

export class B2BDepoScraper extends BaseScraper {
  readonly supplierCode = "b2bdepo"

  private credentials = {
    bayiKodu: process.env.SCRAPER_B2BDEPO_BAYI_KODU ?? "",
    kullaniciAdi: process.env.SCRAPER_B2BDEPO_KULLANICI ?? "",
    sifre: process.env.SCRAPER_B2BDEPO_SIFRE ?? "",
    guvenlikSorusu: process.env.SCRAPER_B2BDEPO_GUVENLIK ?? "",
  }

  // ------------------------------------------------------------------
  // Login
  // ------------------------------------------------------------------

  async login(page: Page): Promise<void> {
    console.log("[B2BDepo] Navigating to login page...")
    await page.goto("https://www.b2bdepo.com", {
      waitUntil: "networkidle",
    })

    // Wait for login form
    await page.waitForSelector("#bayiKodu, input[name='bayiKodu']", {
      timeout: this.config.timeoutMs,
    })

    // Fill credentials
    await page.fill("#bayiKodu", this.credentials.bayiKodu)
    await page.fill(
      "#kullaniciAdi, input[name='kullaniciAdi']",
      this.credentials.kullaniciAdi
    )
    await page.fill("#sifre, input[name='sifre']", this.credentials.sifre)
    await page.fill(
      "#GuvenlikSorusu, input[name='GuvenlikSorusu']",
      this.credentials.guvenlikSorusu
    )

    console.log("[B2BDepo] Submitting login form...")

    // Intercept the response to find the login endpoint
    // The form might be submitted via JS — try clicking submit button first
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("login") ||
          resp.url().includes("Login") ||
          resp.url().includes("giris") ||
          resp.url().includes("Giris"),
        { timeout: this.config.timeoutMs }
      ).catch(() => null),
      page.click(
        "button[type='submit'], input[type='submit'], #btnGiris, button:has-text('Giriş')"
      ),
    ])

    // If no response intercepted, try waiting for navigation
    if (!response) {
      await page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {})
    }

    // Verify login success
    const url = page.url()
    const isLoggedIn =
      !url.includes("login") &&
      !url.includes("giris") &&
      !url.includes("Login")

    if (!isLoggedIn) {
      // Check for error message
      const errorMsg = await page
        .$eval(
          ".alert, .error, .message, #lblError, .login-error",
          (el) => el.textContent?.trim()
        )
        .catch(() => null)

      throw new Error(
        `B2BDepo login failed. URL: ${url}${errorMsg ? `. Error: ${errorMsg}` : ""}`
      )
    }

    console.log("[B2BDepo] Login successful.")
  }

  // ------------------------------------------------------------------
  // Scrape
  // ------------------------------------------------------------------

  async scrape(page: Page): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = []

    console.log("[B2BDepo] Navigating to product listing...")

    // Navigate to product list page
    await page.goto("https://www.b2bdepo.com/urunler", {
      waitUntil: "networkidle",
    }).catch(() => {
      // Try alternative URLs
      return page.goto("https://www.b2bdepo.com/products", {
        waitUntil: "networkidle",
      })
    })

    // Wait for product grid/table to load
    const productSelector =
      ".product-card, .urun-card, .urunKart, .product-item, .item, .list-item, table tbody tr"
    await page.waitForSelector(productSelector, {
      timeout: this.config.timeoutMs,
    })

    // Scrape all pages
    let pageNum = 1
    const maxPages = 100

    while (pageNum <= maxPages) {
      console.log(`[B2BDepo] Scraping page ${pageNum}...`)

      // Extract products from current page
      const products = await page.evaluate(
        (selector: string): Omit<ScrapedProduct, "rawData">[] => {
          const items = Array.from(document.querySelectorAll(selector))
          const result: Omit<ScrapedProduct, "rawData">[] = []

          for (const item of items) {
            // Try to find product data in various ways
            const nameEl =
              item.querySelector(".urun-adi, .product-name, .name, h3, h4, .title, a")
            const priceEl =
              item.querySelector(
                ".fiyat, .price, .urun-fiyat, .product-price, .amount, .tl"
              )
            const stockEl = item.querySelector(
              ".stok, .stock, .quantity, .urun-stok, .badge"
            )
            const linkEl =
              item.querySelector("a[href*='/urun'], a[href*='/product']")
            const skuEl = item.querySelector(
              ".sku, .kod, .urun-kodu, .product-sku, .code"
            )

            const name = nameEl?.textContent?.trim() ?? ""
            if (!name) continue

            const priceText = priceEl?.textContent?.trim() ?? ""
            const price = parseFloat(
              priceText.replace(/[^\d.,]/g, "").replace(",", ".")
            )
            const stockText = stockEl?.textContent?.trim() ?? "0"
            const stock = parseInt(stockText.replace(/[^\d]/g, ""), 10) || 0
            const href = (linkEl as HTMLAnchorElement)?.href ?? ""
            const sku = skuEl?.textContent?.trim() ?? ""

            // Generate externalId from URL or SKU
            const urlMatch = href.match(/\/(\d+)(?:\/|$)/)
            const externalId = sku || urlMatch?.[1] || `unknown-${result.length}`

            result.push({
              externalId,
              externalName: name,
              externalUrl: href || undefined,
              purchasePrice: isNaN(price) ? null : price,
              currency: "TRY",
              stockQuantity: stock,
              isAvailable: stock > 0,
            })
          }

          return result
        },
        productSelector
      )

      allProducts.push(...products)

      // Check for next page
      const hasNextPage = await this.checkNextPage(page)
      if (!hasNextPage) break

      pageNum++
      await this.delay(this.config.requestDelayMs * 2)
    }

    console.log(`[B2BDepo] Total products scraped: ${allProducts.length}`)
    return allProducts
  }

  // ------------------------------------------------------------------
  // Pagination helper
  // ------------------------------------------------------------------

  private async checkNextPage(page: Page): Promise<boolean> {
    try {
      const nextBtn = await page.$(
        ".next-page, .pagination .next, a[rel='next'], .sayfala-next, button:has-text('»'), a:has-text('Sonraki')"
      )

      if (!nextBtn) return false

      const isDisabled =
        (await nextBtn.getAttribute("disabled")) !== null ||
        (await nextBtn.getAttribute("class"))?.includes("disabled") ||
        false

      if (isDisabled) return false

      await nextBtn.click()
      await page.waitForLoadState("networkidle").catch(() => {})
      return true
    } catch {
      return false
    }
  }
}
