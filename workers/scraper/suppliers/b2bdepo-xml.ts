/**
 * B2BDepo XML Entegrasyonu
 * Browser tabanlı scraper yerine XML API ile veri cekimi
 *
 * Endpoint 1 - ProductList: Tam urun bilgileri (gunde 3, 22:00-07:00 arasi)
 * Endpoint 2 - ProductPriceStock: Fiyat/stok guncelleme (gunde 5)
 *
 * ENV:
 *   SCRAPER_B2BDEPO_BAYI_KODU - Bayi kodu
 */

import { XMLParser } from "fast-xml-parser"

// ============================================================================
// Types
// ============================================================================

export interface B2BDepoProduct {
  urunKodu: string
  ustKategoriAdi?: string
  altKategoriAdi?: string
  enAltKategoriAdi?: string
  marka?: string
  urunAdi: string
  stok: number
  ozelFiyat: number
  doviz: string
  kdv: number
  ean?: string
  resimler?: string[]
}

export interface B2BDepoPriceStock {
  urunKodu: string
  stok: number
  ozelFiyat: number
  doviz: string
  kdv: number
}

export interface B2BDepoXmlResult {
  products: B2BDepoProduct[]
  fetchedAt: Date
  durationMs: number
}

export interface B2BDepoPriceStockResult {
  items: B2BDepoPriceStock[]
  fetchedAt: Date
  durationMs: number
}

// ============================================================================
// XML Parser config
// ============================================================================

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  isArray: (name: string) => {
    // Resimler icindeki IMG ve Urun listesi her zaman array olsun
    return name === "IMG" || name === "Urun"
  },
  trimValues: true,
})

// ============================================================================
// Helpers
// ============================================================================

/** "10+" -> 10, "5+" -> 5, "0" -> 0 */
function parseStok(raw: unknown): number {
  if (raw === null || raw === undefined) return 0
  const str = String(raw).replace(/\+/g, "").trim()
  const num = parseInt(str, 10)
  return isNaN(num) ? 0 : Math.max(num, 0)
}

/** String/number -> number, NaN -> 0. Virgüllü Türk formatını destekler ("12,90" -> 12.90) */
function parseNumber(raw: unknown): number {
  if (raw === null || raw === undefined) return 0
  const str = String(raw).replace(/,/g, ".")
  const num = Number(str)
  return isNaN(num) ? 0 : num
}

/** Bayi kodunu env'den oku */
function getBayiKodu(): string {
  const bayiKodu = process.env.SCRAPER_B2BDEPO_BAYI_KODU?.trim()
  if (!bayiKodu) {
    throw new Error("[B2BDepo XML] SCRAPER_B2BDEPO_BAYI_KODU env degiskeni tanimlanmamis")
  }
  return bayiKodu
}

// ============================================================================
// B2BDepoXmlFetcher
// ============================================================================

export class B2BDepoXmlFetcher {
  private bayiKodu: string
  private baseUrl = "https://www.b2bdepo.com/Xml"
  private timeoutMs: number

  constructor(options?: { timeoutMs?: number }) {
    this.bayiKodu = getBayiKodu()
    this.timeoutMs = options?.timeoutMs ?? 120_000 // 2 dakika default (XML buyuk olabilir)
  }

  // --------------------------------------------------------------------------
  // ProductList - Tam urun bilgileri
  // --------------------------------------------------------------------------

  async fetchProductList(): Promise<B2BDepoXmlResult> {
    const startTime = Date.now()
    const url = `${this.baseUrl}/ProductList?bayiKodu=${encodeURIComponent(this.bayiKodu)}`

    console.log("[B2BDepo XML] ProductList cekiliyor...")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    let xmlText: string
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "Accept": "application/xml, text/xml",
          "User-Agent": "NextAI-Teknoloji/1.0",
        },
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`)
      }

      xmlText = await res.text()
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`[B2BDepo XML] ProductList istegi zaman asimina ugradi (${this.timeoutMs}ms)`)
      }
      throw err
    }

    if (!xmlText || xmlText.trim().length === 0) {
      throw new Error("[B2BDepo XML] ProductList bos yanit dondu")
    }

    console.log(`[B2BDepo XML] ProductList XML alindi (${xmlText.length} karakter), parse ediliyor...`)

    const parsed = xmlParser.parse(xmlText)
    const rawProducts = this.extractProductArray(parsed)

    const products: B2BDepoProduct[] = rawProducts.map((raw: Record<string, unknown>) => {
      const resimler: string[] = []
      const resimlerNode = raw.Resimler as Record<string, unknown> | undefined
      if (resimlerNode?.IMG) {
        const imgs = Array.isArray(resimlerNode.IMG) ? resimlerNode.IMG : [resimlerNode.IMG]
        for (const img of imgs) {
          const url = String(img).trim()
          if (url) resimler.push(url)
        }
      }

      return {
        urunKodu: String(raw.UrunKodu ?? "").trim(),
        ustKategoriAdi: raw.UstKategoriAdi ? String(raw.UstKategoriAdi).trim() : undefined,
        altKategoriAdi: raw.AltKategoriAdi ? String(raw.AltKategoriAdi).trim() : undefined,
        enAltKategoriAdi: raw.EnAltKategoriAdi ? String(raw.EnAltKategoriAdi).trim() : undefined,
        marka: raw.Marka ? String(raw.Marka).trim() : undefined,
        urunAdi: String(raw.UrunAdi ?? "").trim(),
        stok: parseStok(raw.Stok),
        ozelFiyat: parseNumber(raw.OzelFiyat),
        doviz: "USD", // B2BDepo fiyatları her zaman USD olarak kabul edilir
        kdv: parseNumber(raw.Kdv),
        ean: raw.EAN ? String(raw.EAN).trim() : undefined,
        resimler: resimler.length > 0 ? resimler : undefined,
      }
    }).filter((p: B2BDepoProduct) => p.urunKodu && p.urunAdi)

    const durationMs = Date.now() - startTime
    console.log(`[B2BDepo XML] ProductList tamamlandi: ${products.length} urun (${durationMs}ms)`)

    return {
      products,
      fetchedAt: new Date(),
      durationMs,
    }
  }

  // --------------------------------------------------------------------------
  // ProductPriceStock - Fiyat/stok guncelleme
  // --------------------------------------------------------------------------

  async fetchPriceStock(): Promise<B2BDepoPriceStockResult> {
    const startTime = Date.now()
    const url = `${this.baseUrl}/ProductPriceStock?bayiKodu=${encodeURIComponent(this.bayiKodu)}`

    console.log("[B2BDepo XML] PriceStock cekiliyor...")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    let xmlText: string
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "Accept": "application/xml, text/xml",
          "User-Agent": "NextAI-Teknoloji/1.0",
        },
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`)
      }

      xmlText = await res.text()
    } catch (err) {
      clearTimeout(timeout)
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`[B2BDepo XML] PriceStock istegi zaman asimina ugradi (${this.timeoutMs}ms)`)
      }
      throw err
    }

    if (!xmlText || xmlText.trim().length === 0) {
      throw new Error("[B2BDepo XML] PriceStock bos yanit dondu")
    }

    console.log(`[B2BDepo XML] PriceStock XML alindi (${xmlText.length} karakter), parse ediliyor...`)

    const parsed = xmlParser.parse(xmlText)
    const rawItems = this.extractProductArray(parsed)

    const items: B2BDepoPriceStock[] = rawItems.map((raw: Record<string, unknown>) => ({
      urunKodu: String(raw.UrunKodu ?? "").trim(),
      stok: parseStok(raw.Stok),
      ozelFiyat: parseNumber(raw.OzelFiyat),
      doviz: "USD", // B2BDepo fiyatları her zaman USD olarak kabul edilir
      kdv: parseNumber(raw.Kdv),
    })).filter((p: B2BDepoPriceStock) => p.urunKodu)

    const durationMs = Date.now() - startTime
    console.log(`[B2BDepo XML] PriceStock tamamlandi: ${items.length} urun (${durationMs}ms)`)

    return {
      items,
      fetchedAt: new Date(),
      durationMs,
    }
  }

  // --------------------------------------------------------------------------
  // XML icinden Urun dizisini cikar
  // --------------------------------------------------------------------------

  private extractProductArray(parsed: Record<string, unknown>): Record<string, unknown>[] {
    // XML root degiskenlik gosterebilir: <Urunler><Urun>...</Urun></Urunler>
    // veya <ProductList><Urun>...</Urun></ProductList> gibi

    // Recursive olarak Urun key'ini bul
    const findUrunArray = (obj: unknown): Record<string, unknown>[] | null => {
      if (!obj || typeof obj !== "object") return null

      const record = obj as Record<string, unknown>

      if (Array.isArray(record.Urun)) {
        return record.Urun as Record<string, unknown>[]
      }

      // Bir seviye daha derine bak
      for (const key of Object.keys(record)) {
        const value = record[key]
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const found = findUrunArray(value)
          if (found) return found
        }
      }

      return null
    }

    const products = findUrunArray(parsed)
    if (!products || products.length === 0) {
      console.warn("[B2BDepo XML] XML icinde Urun verisi bulunamadi")
      return []
    }

    return products
  }
}
