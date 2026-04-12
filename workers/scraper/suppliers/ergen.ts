/**
 * Ergen Elektronik Scraper
 * Site: https://www.ergenelektronik.com
 * Zanuo Türkiye Distribütörü
 *
 * ENV vars:
 *   SCRAPER_ERGEN_USER - Kullanıcı adı
 *   SCRAPER_ERGEN_PASS - Şifre
 *
 * Özellikler:
 *   - Tüm ürünleri çeker (kategori bazlı)
 *   - Görsel, ad, özellikler, fiyat, stok
 *   - %20 kar marjı hesaplar
 *   - Product + SupplierProduct tablolarına yazar
 */

import type { Page } from "playwright"
import { BaseScraper, type ScrapedProduct } from "../base"

// ============================================================================
// Extended product data for full sync
// ============================================================================

export interface ErgenProduct extends ScrapedProduct {
  images: string[]
  description?: string | null
  specs: Record<string, string>
  category?: string | null
  brand?: string | null
  barcode?: string | null
  salePrice: number | null // %20 kar marjlı fiyat
}

export class ErgenScraper extends BaseScraper {
  readonly supplierCode = "ergen"

  private credentials = {
    username: process.env.SCRAPER_ERGEN_USER ?? "",
    password: process.env.SCRAPER_ERGEN_PASS ?? "",
  }

  private baseUrl = "https://www.ergenelektronik.com"
  private markupPercent = 20 // Kar marjı %

  // ------------------------------------------------------------------
  // Helper: Normalize image URL
  // ------------------------------------------------------------------

  private normalizeImageUrl(src: string): string {
    if (!src) return ""

    // Zaten tam URL
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src
    }

    // Protocol-relative URL
    if (src.startsWith("//")) {
      return `https:${src}`
    }

    // Relative URL - baseUrl'e göre resolve et
    if (src.startsWith("/")) {
      return `${this.baseUrl}${src}`
    }

    // ../ ile başlayan relative URL
    if (src.startsWith("../")) {
      // ../images/xxx -> /images/xxx
      const resolved = src.replace(/\.\.\//g, "")
      return `${this.baseUrl}/${resolved}`
    }

    // Diğer durumlarda baseUrl'e ekle
    return `${this.baseUrl}/${src}`
  }

  // ------------------------------------------------------------------
  // Login
  // ------------------------------------------------------------------

  async login(page: Page): Promise<void> {
    console.log("[Ergen] Navigating to homepage...")

    await page.goto(this.baseUrl, {
      waitUntil: "networkidle",
    })

    // Ergen'de fiyat görmek için login gerekiyor olabilir
    // Login linkini bul (muhtemelen header'da)
    const loginLink = await page.$(
      "a[href*='login'], a[href*='giris'], a:has-text('Giriş'), a:has-text('Üye'), .login-btn, .btn-login, .uye-giris"
    )

    if (loginLink) {
      console.log("[Ergen] Login link found, clicking...")
      await loginLink.click()
      await page.waitForLoadState("networkidle").catch(() => {})

      // Wait for login form
      await page.waitForSelector(
        "input[type='text'], input[type='email'], input[name*='user'], input[name*='kullan'], #username, #email",
        { timeout: this.config.timeoutMs }
      ).catch(() => null)

      // Try to fill credentials with various selectors
      const userInput = await page.$(
        "input[name*='user'], input[name*='kullan'], #username, #email, input[type='text']"
      )
      const passInput = await page.$(
        "input[type='password'], input[name*='pass'], input[name*='sifre']"
      )

      if (userInput && passInput) {
        console.log("[Ergen] Login form found, filling credentials...")
        await userInput.fill(this.credentials.username)
        await passInput.fill(this.credentials.password)

        // Submit
        const submitBtn = await page.$(
          "button[type='submit'], input[type='submit'], .btn-login, button:has-text('Giriş'), button:has-text('Gönder')"
        )

        if (submitBtn) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}),
            submitBtn.click(),
          ])
        }
      }
    } else {
      console.log("[Ergen] No login required or already logged in")
    }

    console.log("[Ergen] Ready to scrape")
  }

  // ------------------------------------------------------------------
  // Scrape - Main entry point
  // ------------------------------------------------------------------

  async scrape(page: Page): Promise<ScrapedProduct[]> {
    const allProducts: ErgenProduct[] = []

    console.log("[Ergen] Starting product scrape...")

    // Ana sayfaya git
    await page.goto(this.baseUrl, {
      waitUntil: "networkidle",
    })

    // Kategori URL'lerini bul
    const categoryUrls = await this.getCategoryUrls(page)
    console.log(`[Ergen] Found ${categoryUrls.length} categories`)

    if (categoryUrls.length > 0) {
      // Her kategoriyi gez
      for (let i = 0; i < Math.min(categoryUrls.length, 20); i++) {
        const catUrl = categoryUrls[i]
        console.log(`[Ergen] [${i + 1}/${Math.min(categoryUrls.length, 20)}] Scraping: ${catUrl}`)

        await page.goto(catUrl, { waitUntil: "networkidle" })

        // Kategorideki ürünleri çek
        const products = await this.scrapeProductsFromCategory(page)
        allProducts.push(...products)

        console.log(`[Ergen] Category ${i + 1}: ${products.length} products`)
        await this.delay(this.config.requestDelayMs)
      }
    } else {
      // Direkt ana sayfadan çek
      const products = await this.scrapeProductsFromCategory(page)
      allProducts.push(...products)
    }

    console.log(`[Ergen] Total products scraped: ${allProducts.length}`)

    // Dönüştür ve rawData ekle
    return allProducts.map((p) => ({
      ...p,
      rawData: {
        images: p.images,
        description: p.description,
        specs: p.specs,
        category: p.category,
        brand: p.brand,
        salePrice: p.salePrice,
        markupPercent: this.markupPercent,
        ...(p.category ? { _supplierCategory: p.category } : {}),
      },
    }))
  }

  // ------------------------------------------------------------------
  // Get category URLs from homepage
  // ------------------------------------------------------------------

  private async getCategoryUrls(page: Page): Promise<string[]> {
    const urls = await page.evaluate((baseUrl: string): string[] => {
      const links = Array.from(document.querySelectorAll("a[href]"))
      const result: string[] = []

      // Kategori pattern'leri
      const categoryPatterns = [
        /\/kategori/i,
        /\/category/i,
        /\/urunler/i,
        /\/products/i,
        /\/k-\d+/i,
        /\/cat\//i,
      ]

      // Kategori anahtar kelimeleri
      const categoryKeywords = [
        "pc",
        "bilgisayar",
        "güvenlik",
        "kamera",
        "network",
        "ağ",
        "kablo",
        "fiber",
        "kabin",
        "güç",
        "projeksiyon",
        "seslendirme",
        "barkod",
        "pos",
      ]

      for (const link of links) {
        const href = (link as HTMLAnchorElement).href
        const text = (link.textContent || "").toLowerCase()

        // Pattern kontrolü
        const matchesPattern = categoryPatterns.some((p) => p.test(href))

        // Keyword kontrolü
        const hasKeyword = categoryKeywords.some((k) => text.includes(k))

        if (
          (matchesPattern || hasKeyword) &&
          href.startsWith(baseUrl) &&
          !result.includes(href) &&
          !href.includes("login") &&
          !href.includes("iletisim")
        ) {
          result.push(href)
        }
      }

      return result
    }, this.baseUrl)

    return urls
  }

  // ------------------------------------------------------------------
  // Scrape products from category page
  // ------------------------------------------------------------------

  private async scrapeProductsFromCategory(page: Page): Promise<ErgenProduct[]> {
    // Önce sayfalama kontrol et - tüm sayfaları gez
    const allProducts: ErgenProduct[] = []
    let pageNum = 1
    const maxPages = 50

    while (pageNum <= maxPages) {
      const products = await this.extractProductsFromPage(page)
      if (products.length === 0) break

      allProducts.push(...products)
      console.log(`[Ergen] Page ${pageNum}: ${products.length} products`)

      // Sonraki sayfa kontrol
      const hasNext = await this.goToNextPage(page)
      if (!hasNext) break

      pageNum++
      await this.delay(this.config.requestDelayMs)
    }

    return allProducts
  }

  // ------------------------------------------------------------------
  // Extract products from current page
  // ------------------------------------------------------------------

  private async extractProductsFromPage(page: Page): Promise<ErgenProduct[]> {
    return await page.evaluate(
      (markupPercent: number): ErgenProduct[] => {
        const result: ErgenProduct[] = []

        // Base URL for normalizing
        const baseUrl = "https://www.ergenelektronik.com"

        // Helper: normalize image URL
        function normalizeImageUrl(src: string): string {
          if (!src) return ""
          if (src.startsWith("http://") || src.startsWith("https://")) return src
          if (src.startsWith("//")) return `https:${src}`
          if (src.startsWith("/")) return `${baseUrl}${src}`
          if (src.startsWith("../")) {
            // ../images/xxx -> /images/xxx
            const resolved = src.replace(/\.\.\//g, "")
            return `${baseUrl}/${resolved}`
          }
          return `${baseUrl}/${src}`
        }

        // Ürün kartlarını bul - Ergen site yapısına göre
        const productSelectors = [
          ".product-card",
          ".urun-card",
          ".item",
          ".product-item",
          "[class*='product']",
          "[class*='urun']",
          ".card",
          ".bresimler",
          ".urun-listesi .urun",
          ".products .product",
        ]

        const items = Array.from(
          document.querySelectorAll(productSelectors.join(", "))
        )

        for (const item of items) {
          try {
            // === Ürün Adı ===
            const imgEl = item.querySelector("img")
            const titleEl = item.querySelector(
              ".title, .name, .urun-adi, .product-name, h3, h4, h5, strong, b, .urunbaslik"
            )

            let name =
              titleEl?.textContent?.trim() ||
              imgEl?.getAttribute("alt")?.trim() ||
              imgEl?.getAttribute("title")?.trim() ||
              ""

            if (!name || name.length < 3) continue

            // === Fiyat ===
            const priceEl = item.querySelector(
              ".price, .fiyat, .urun-fiyat, [class*='price'], [class*='fiyat'], .price-new"
            )
            const priceText = priceEl?.textContent?.trim() || ""

            let purchasePrice: number | null = null
            if (priceText) {
              // Türkçe format: "1.234,56 TL"
              const priceMatch = priceText.match(/[\d.,]+/)
              if (priceMatch) {
                purchasePrice = parseFloat(
                  priceMatch[0].replace(/\./g, "").replace(",", ".")
                )
              }
            }

            // === %20 Kar Marjı ===
            let salePrice: number | null = null
            if (purchasePrice !== null && !isNaN(purchasePrice)) {
              salePrice = Math.round(purchasePrice * (1 + markupPercent / 100) * 100) / 100
            }

            // === Stok ===
            const stockEl = item.querySelector(
              ".stock, .stok, .quantity, .adet, [class*='stock'], [class*='stok']"
            )
            const stockText = stockEl?.textContent?.trim() || ""

            let stock = 0
            // "10+", "5", "Stokta" gibi formatları parse et
            if (stockText.toLowerCase().includes("stok") || stockText.includes("+")) {
              const stockMatch = stockText.match(/\d+/)
              stock = stockMatch ? parseInt(stockMatch[0], 10) : 1
            } else {
              const stockMatch = stockText.match(/\d+/)
              stock = stockMatch ? parseInt(stockMatch[0], 10) : 0
            }

            // === Link ===
            const linkEl = item.querySelector("a[href]")
            const href = (linkEl as HTMLAnchorElement)?.href || ""

            // === SKU/Kod ===
            const skuEl = item.querySelector(
              ".sku, .kod, .code, [class*='sku'], [class*='kod'], .model"
            )
            const sku = skuEl?.textContent?.trim() || ""

            // === Barkod ===
            const barcodeEl = item.querySelector(
              ".barcode, .barkod, [class*='barcode'], [class*='barkod']"
            )
            const barcode = barcodeEl?.textContent?.replace(/[^\d]/g, "") || null

            // === Görseller ===
            const images: string[] = []

            // Ana görsel
            const mainImg =
              imgEl?.getAttribute("src") ||
              imgEl?.getAttribute("data-src") ||
              imgEl?.getAttribute("data-original") ||
              ""
            if (mainImg) {
              const normalized = normalizeImageUrl(mainImg)
              if (normalized) images.push(normalized)
            }

            // Diğer görseller (hover, gallery)
            const allImgs = item.querySelectorAll("img")
            for (const img of Array.from(allImgs)) {
              const src =
                (img as HTMLImageElement).src ||
                img.getAttribute("data-src") ||
                img.getAttribute("data-original") ||
                ""
              if (src) {
                const normalized = normalizeImageUrl(src)
                if (normalized && !images.includes(normalized)) {
                  images.push(normalized)
                }
              }
            }

            // === Açıklama ===
            const descEl = item.querySelector(
              ".description, .aciklama, .desc, p, .urun-aciklama"
            )
            const description = descEl?.textContent?.trim() || null

            // === Özellikler ===
            const specs: Record<string, string> = {}
            const specEls = item.querySelectorAll(
              ".specs li, .ozellikler li, .spec-item, .attributes tr, ul.features li"
            )
            for (const spec of Array.from(specEls)) {
              const text = spec.textContent?.trim() || ""
              const parts = text.split(":")
              if (parts.length >= 2) {
                const key = parts[0].trim()
                const value = parts.slice(1).join(":").trim()
                if (key && value) specs[key] = value
              }
            }

            // === Kategori ===
            const catEl = item.querySelector(
              ".category, .kategori, [class*='category'], [class*='kategori']"
            )
            const category = catEl?.textContent?.trim() || null

            // === Marka ===
            const brandEl = item.querySelector(
              ".brand, .marka, [class*='brand'], [class*='marka']"
            )
            const brand = brandEl?.textContent?.trim() || null

            // === External ID ===
            let externalId = sku || barcode || ""
            if (!externalId && href) {
              const urlMatch = href.match(/\/(\d+)(?:\/|$|\.)/)
              if (urlMatch) externalId = urlMatch[1]
            }
            if (!externalId) {
              externalId = `ergen-${Date.now()}-${result.length}`
            }

            result.push({
              externalId,
              externalName: name,
              externalUrl: href || undefined,
              externalSku: sku || undefined,
              externalBarcode: barcode,
              purchasePrice,
              salePrice,
              currency: "TRY",
              stockQuantity: stock,
              isAvailable: stock > 0 || purchasePrice !== null,
              images,
              description,
              specs,
              category,
              brand,
              barcode,
            })
          } catch (e) {
            // Skip problematic items
          }
        }

        return result
      },
      this.markupPercent
    )
  }

  // ------------------------------------------------------------------
  // Pagination - go to next page
  // ------------------------------------------------------------------

  private async goToNextPage(page: Page): Promise<boolean> {
    try {
      const nextBtn = await page.$(
        ".next, .next-page, .pagination .next, a[rel='next'], .sayfala-next, " +
          "button:has-text('»'), a:has-text('Sonraki'), a:has-text('>'), " +
          ".page-next, [class*='next']"
      )

      if (!nextBtn) return false

      const isDisabled =
        (await nextBtn.getAttribute("disabled")) !== null ||
        (await nextBtn.getAttribute("class"))?.includes("disabled") ||
        (await nextBtn.getAttribute("class"))?.includes("inactive") ||
        false

      if (isDisabled) return false

      await Promise.all([
        nextBtn.click(),
        page.waitForLoadState("networkidle").catch(() => {}),
      ])

      return true
    } catch {
      return false
    }
  }
}
