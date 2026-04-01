/**
 * Index Grup XML Entegrasyonu
 * Base URL: https://www.indexgruppazar.com/api/xml/xml_request
 *
 * Endpoint'ler:
 *   op=k  - Katalog (ürün listesi)
 *   op=b  - Barcode Katalog
 *   op=kd - Detay Katalog (ürün detayları)
 *   op=s  - Stok
 *   op=f  - Fiyat
 *
 * ENV:
 *   INDEXGRUP_DEALER_CODE - Bayi kodu (örn: 0000243492)
 *   INDEXGRUP_CMP_ID      - Company ID (default: 1)
 */

import { XMLParser } from "fast-xml-parser"

// ============================================================================
// Constants
// ============================================================================

const BASE_URL = "https://www.indexgruppazar.com/api/xml/xml_request"

// ============================================================================
// Types
// ============================================================================

export interface IndexGrupProduct {
  productCode: string
  productName: string
  barcode?: string
  category?: string
  brand?: string
  model?: string
  warranty?: string
  kdv?: number
  desi?: number
  categoryCode?: string
  categoryName?: string
  groupCode?: string
  groupName?: string
  imageUrl?: string
  description?: string
  tax?: string
  specifications?: Record<string, string> | string
  stock?: number
  price?: number
  currency?: string
}

export interface IndexGrupBarcodeItem {
  urunKodu: string
  barkod: string
  urunAdi: string
}

export interface IndexGrupDetailItem {
  urunKodu: string
  urunAdi: string
  aciklama?: string
  ozellikler?: string
  resimUrl?: string
}

export interface IndexGrupStockItem {
  urunKodu: string
  stok: number
}

export interface IndexGrupPriceItem {
  urunKodu: string
  fiyat: number
  paraBirimi?: string
}

export interface IndexGrupCatalogItem {
  urunKodu: string
  urunAdi: string
  marka: string
  kategori: string
  model: string
  garanti: string
  kdv: number
  desi: number
}

// ============================================================================
// XML Parser
// ============================================================================

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  parseAttributeValue: true,
  parseTagValue: true,
  isArray: (name: string) => {
    return ["urun", "product", "item"].includes(name.toLowerCase())
  },
})

// ============================================================================
// Helper functions
// ============================================================================

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0
  const num = Number(String(val).replace(",", "."))
  return isNaN(num) ? 0 : num
}

function parseString(val: unknown): string {
  return String(val ?? "").trim()
}

// ============================================================================
// IndexGrupXmlClient
// ============================================================================

export class IndexGrupXmlClient {
  private readonly dealerCode: string
  private readonly cmpId: string

  constructor() {
    this.dealerCode = process.env.INDEXGRUP_DEALER_CODE ?? ""
    this.cmpId = process.env.INDEXGRUP_CMP_ID ?? "1"

    if (!this.dealerCode) {
      throw new Error(
        "Index Grup credentials eksik: INDEXGRUP_DEALER_CODE env değişkenini kontrol edin"
      )
    }
  }

  private buildUrl(operation: string): string {
    const params = new URLSearchParams({
      cmpId: this.cmpId,
      dealerCode: this.dealerCode,
      op: operation,
    })
    return `${BASE_URL}?${params.toString()}`
  }

  private async fetchXml(operation: string): Promise<string> {
    const url = this.buildUrl(operation)
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Next-AI-Teknoloji/1.0",
      },
    })

    if (!res.ok) {
      throw new Error(`Index Grup XML HTTP ${res.status}: ${res.statusText}`)
    }

    const text = await res.text()

    // Hata kontrolü
    if (text.includes("<error>") || text.includes("<hata>")) {
      const match = text.match(/<(?:error|hata)>(.*?)<\/(?:error|hata)>/i)
      const msg = match ? match[1].trim() : "XML Error"
      throw new Error(`Index Grup XML Error: ${msg}`)
    }

    return text
  }

  // ============================================================================
  // Katalog (op=k) - Ürün Listesi
  // ============================================================================

  async getCatalog(): Promise<IndexGrupCatalogItem[]> {
    const xml = await this.fetchXml("k")
    const parsed = xmlParser.parse(xml)

    // XML yapısı: <catalog><urun>...</urun></catalog> veya <urunler><urun>...</urun></urunler>
    const root = parsed?.catalog || parsed?.urunler || parsed
    const products = root?.urun || []

    return (Array.isArray(products) ? products : [products]).map((item: Record<string, unknown>) => ({
      urunKodu: parseString(item["urunKodu"] || item["@_urunKodu"] || item["kod"]),
      urunAdi: parseString(item["urunAdi"] || item["@_urunAdi"] || item["ad"]),
      marka: parseString(item["marka"] || item["@_marka"]),
      kategori: parseString(item["kategori"] || item["@_kategori"]),
      model: parseString(item["model"] || item["@_model"]),
      garanti: parseString(item["garanti"] || item["@_garanti"]),
      kdv: parseNumber(item["kdv"] || item["@_kdv"]),
      desi: parseNumber(item["desi"] || item["@_desi"]),
    }))
  }

  // ============================================================================
  // Barcode Katalog (op=b)
  // ============================================================================

  async getBarcodeCatalog(): Promise<IndexGrupBarcodeItem[]> {
    const xml = await this.fetchXml("b")
    const parsed = xmlParser.parse(xml)

    const root = parsed?.catalog || parsed?.urunler || parsed
    const products = root?.urun || []

    return (Array.isArray(products) ? products : [products]).map((item: Record<string, unknown>) => ({
      urunKodu: parseString(item["urunKodu"] || item["@_urunKodu"] || item["kod"]),
      barkod: parseString(item["barkod"] || item["@_barkod"] || item["barcode"]),
      urunAdi: parseString(item["urunAdi"] || item["@_urunAdi"] || item["ad"]),
    }))
  }

  // ============================================================================
  // Detay Katalog (op=kd) - Ürün Detayları
  // ============================================================================

  async getDetailCatalog(): Promise<IndexGrupDetailItem[]> {
    const xml = await this.fetchXml("kd")
    const parsed = xmlParser.parse(xml)

    const root = parsed?.catalog || parsed?.urunler || parsed
    const products = root?.urun || []

    return (Array.isArray(products) ? products : [products]).map((item: Record<string, unknown>) => ({
      urunKodu: parseString(item["urunKodu"] || item["@_urunKodu"] || item["kod"]),
      urunAdi: parseString(item["urunAdi"] || item["@_urunAdi"] || item["ad"]),
      aciklama: parseString(item["aciklama"] || item["@_aciklama"] || item["description"]),
      ozellikler: parseString(item["ozellikler"] || item["@_ozellikler"] || item["features"]),
      resimUrl: parseString(item["resimUrl"] || item["@_resimUrl"] || item["imageUrl"] || item["image"]),
    }))
  }

  // ============================================================================
  // Stok (op=s)
  // ============================================================================

  async getStock(): Promise<IndexGrupStockItem[]> {
    const xml = await this.fetchXml("s")
    const parsed = xmlParser.parse(xml)

    const root = parsed?.stock || parsed?.stok || parsed
    const items = root?.urun || root?.item || []

    return (Array.isArray(items) ? items : [items]).map((item: Record<string, unknown>) => ({
      urunKodu: parseString(item["urunKodu"] || item["@_urunKodu"] || item["kod"] || item["productCode"]),
      stok: parseNumber(item["stok"] || item["@_stok"] || item["miktar"] || item["quantity"]),
    }))
  }

  // ============================================================================
  // Fiyat (op=f)
  // ============================================================================

  async getPrice(): Promise<IndexGrupPriceItem[]> {
    const xml = await this.fetchXml("f")
    const parsed = xmlParser.parse(xml)

    const root = parsed?.price || parsed?.fiyat || parsed
    const items = root?.urun || root?.item || []

    return (Array.isArray(items) ? items : [items]).map((item: Record<string, unknown>) => ({
      urunKodu: parseString(item["urunKodu"] || item["@_urunKodu"] || item["kod"] || item["productCode"]),
      fiyat: parseNumber(item["fiyat"] || item["@_fiyat"] || item["price"]),
      paraBirimi: parseString(item["paraBirimi"] || item["@_paraBirimi"] || item["currency"] || "TRY"),
    }))
  }

  // ============================================================================
  // Tüm verileri birleştir (katalog + barcode + detay + stok + fiyat)
  // ============================================================================

  async getAllProducts(): Promise<IndexGrupProduct[]> {
    const [catalog, barcodes, details, stocks, prices] = await Promise.all([
      this.getCatalog(),
      this.getBarcodeCatalog(),
      this.getDetailCatalog(),
      this.getStock(),
      this.getPrice(),
    ])

    // Index by productCode
    const barcodeMap = new Map(barcodes.map((b) => [b.urunKodu, b.barkod]))
    const detailMap = new Map(details.map((d) => [d.urunKodu, d]))
    const stockMap = new Map(stocks.map((s) => [s.urunKodu, s.stok]))
    const priceMap = new Map(prices.map((p) => [p.urunKodu, p]))

    return catalog.map((item) => {
      const code = item.urunKodu
      const detail = detailMap.get(code)
      const priceInfo = priceMap.get(code)

      return {
        productCode: code,
        productName: item.urunAdi,
        barcode: barcodeMap.get(code),
        category: item.kategori,
        brand: item.marka,
        model: item.model,
        warranty: item.garanti,
        kdv: item.kdv,
        desi: item.desi,
        stock: stockMap.get(code),
        price: priceInfo?.fiyat,
        currency: priceInfo?.paraBirimi || "TRY",
        imageUrl: detail?.resimUrl,
        description: detail?.aciklama,
        specifications: detail?.ozellikler,
      }
    })
  }
}
