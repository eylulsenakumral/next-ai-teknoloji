/**
 * Netex XML Entegrasyonu (Index Grup altyapısı)
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
 *   NETEX_DEALER_CODE - Bayi kodu (örn: 0000243492)
 *   NETEX_CMP_ID      - Company ID (2 for Netex)
 */

import { XMLParser } from "fast-xml-parser"

// ============================================================================
// Constants
// ============================================================================

const BASE_URL = "https://www.indexgruppazar.com/api/xml/xml_request"

// ============================================================================
// Types
// ============================================================================

export interface NetexProduct {
  productCode: string
  productName: string
  barcode?: string
  category?: string
  brand?: string
  model?: string
  warranty?: string
  kdv?: number
  desi?: number
  stock?: number
  price?: number
  currency?: string
  imageUrl?: string
  description?: string
  specifications?: string
}

export interface NetexCatalogItem {
  urunKodu: string
  urunAdi: string
  marka?: string
  kategori?: string
  model?: string
  garanti?: string
  kdv?: number
  desi?: number
}

export interface NetexBarcodeItem {
  urunKodu: string
  barkod: string
  urunAdi: string
}

export interface NetexDetailItem {
  urunKodu: string
  urunAdi: string
  aciklama?: string
  ozellikler?: string
  resimUrl?: string
}

export interface NetexStockItem {
  urunKodu: string
  stok: number
}

export interface NetexPriceItem {
  urunKodu: string
  fiyat: number
  paraBirimi?: string
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
// NetexXmlClient
// ============================================================================

export class NetexXmlClient {
  private readonly dealerCode: string
  private readonly cmpId: string

  constructor() {
    this.dealerCode = process.env.NETEX_DEALER_CODE ?? ""
    this.cmpId = process.env.NETEX_CMP_ID ?? "2"

    if (!this.dealerCode) {
      throw new Error(
        "Netex credentials eksik: NETEX_DEALER_CODE env değişkenini kontrol edin"
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
      throw new Error(`Netex XML HTTP ${res.status}: ${res.statusText}`)
    }

    const text = await res.text()

    // Hata kontrolü
    if (text.includes("<error>") || text.includes("<hata>")) {
      const match = text.match(/<(?:error|hata)>(.*?)<\/(?:error|hata)>/i)
      const msg = match ? match[1].trim() : "XML Error"
      throw new Error(`Netex XML Error: ${msg}`)
    }

    return text
  }

  // ============================================================================
  // Katalog (op=k) - Ürün Listesi
  // ============================================================================

  async getCatalog(): Promise<NetexCatalogItem[]> {
    const xml = await this.fetchXml("k")
    const parsed = xmlParser.parse(xml)

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

  async getBarcodeCatalog(): Promise<NetexBarcodeItem[]> {
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

  async getDetailCatalog(): Promise<NetexDetailItem[]> {
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

  async getStock(): Promise<NetexStockItem[]> {
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

  async getPrice(): Promise<NetexPriceItem[]> {
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

  async getAllProducts(): Promise<NetexProduct[]> {
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
