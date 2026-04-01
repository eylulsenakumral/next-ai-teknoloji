/**
 * Netex XML Entegrasyonu (Attribute-based parser)
 * XML Yapısı: <NETEX><KATEGORI KOD="" TANIM=""><GRUP KOD="" TANIM=""><URUN KOD="" AD="" MARKA="">
 */

import { XMLParser } from "fast-xml-parser"
import https from "https"

// netexpazar.com → indexgruppazar.com redirect yapıyor ama URL bozuluyor
// Doğrudan indexgruppazar.com kullanıyoruz
const BASE_URL = "https://www.indexgruppazar.com/api/xml/xml_request"

// Netex SSL sertifikası expired — kendi sunucularına bağlandığımız için bypass ediyoruz
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

export interface IndexGrupProduct {
  productCode: string
  productName: string
  brand?: string
  categoryCode?: string
  categoryName?: string
  groupCode?: string
  groupName?: string
  companyCode?: string
  globalCode?: string
  imageUrl?: string
  imageDetailUrl?: string
  tax?: string
  specifications?: Record<string, string>
  stock?: number
  price?: number
  currency?: string
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  parseAttributeValue: false, // Keep as strings
  parseTagValue: false,
  processEntities: false, // Büyük XML'lerde entity expansion limitini aş
})

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0
  const num = Number(String(val).replace(",", "."))
  return isNaN(num) ? 0 : num
}

function parseString(val: unknown): string {
  return String(val ?? "").trim()
}

export class NetexXmlClient {
  private readonly dealerCode: string
  private readonly cmpId: string

  constructor() {
    this.dealerCode = process.env.NETEX_DEALER_CODE ?? ""
    this.cmpId = process.env.NETEX_CMP_ID ?? "1"

    if (!this.dealerCode) {
      throw new Error("Netex credentials eksik: NETEX_DEALER_CODE")
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

    // Netex SSL sertifikası expired — https.Agent ile bypass
    const text = await new Promise<string>((resolve, reject) => {
      https.get(url, { agent: httpsAgent, headers: { "User-Agent": "Next-AI-Teknoloji/1.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Netex XML HTTP ${res.statusCode}: ${res.statusMessage}`))
          res.resume()
          return
        }
        const chunks: Buffer[] = []
        res.on("data", (chunk: Buffer) => chunks.push(chunk))
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
        res.on("error", reject)
      }).on("error", reject)
    })

    if (text.includes("<error>") || text.includes("<hata>")) {
      const match = text.match(/<(?:error|hata)>(.*?)<\/(?:error|hata)>/i)
      const msg = match ? match[1].trim() : "XML Error"
      throw new Error(`Netex XML Error: ${msg}`)
    }

    return text
  }

  // Katalog (op=k) - Ürün listesi
  async getCatalog(): Promise<IndexGrupProduct[]> {
    const xml = await this.fetchXml("k")
    const parsed = xmlParser.parse(xml)

    // Root element INDEXGRUP veya NETEX olabilir (URL'e göre değişir)
    const root = parsed?.INDEXGRUP ?? parsed?.NETEX
    if (!root) return []

    const categories = root.KATEGORI
    if (!categories) return []

    const categoryArray = Array.isArray(categories) ? categories : [categories]
    const products: IndexGrupProduct[] = []

    for (const category of categoryArray) {
      const categoryCode = parseString(category["@_KOD"])
      const categoryName = parseString(category["@_TANIM"])

      const groups = category.GRUP
      if (!groups) continue

      const groupArray = Array.isArray(groups) ? groups : [groups]

      for (const group of groupArray) {
        const groupCode = parseString(group["@_KOD"])
        const groupName = parseString(group["@_TANIM"])

        const items = group.URUN
        if (!items) continue

        const itemArray = Array.isArray(items) ? items : [items]

        for (const item of itemArray) {
          const specs: Record<string, string> = {}

          // Parse OZELLIK > OZL
          if (item.OZELLIK?.OZL) {
            const ozlArray = Array.isArray(item.OZELLIK.OZL)
              ? item.OZELLIK.OZL
              : [item.OZELLIK.OZL]
            for (const ozl of ozlArray) {
              const tanim = parseString(ozl["@_TANIM"])
              const deger = parseString(ozl["@_DEGER"])
              if (tanim) specs[tanim] = deger
            }
          }

          // Parse RESIM
          let imageUrl = ""
          if (item.RESIM) {
            if (typeof item.RESIM === "string") {
              imageUrl = item.RESIM.trim()
            } else if (Array.isArray(item.RESIM)) {
              imageUrl = parseString(item.RESIM[0])
            } else if (item.RESIM["#text"]) {
              imageUrl = parseString(item.RESIM["#text"])
            }
          }

          products.push({
            productCode: parseString(item["@_KOD"]),
            productName: parseString(item["@_AD"]),
            brand: parseString(item["@_MARKA"]),
            companyCode: parseString(item["@_SIRKETKOD"]),
            globalCode: parseString(item["@_GLOBALKOD"]),
            categoryCode,
            categoryName,
            groupCode,
            groupName,
            imageUrl,
            imageDetailUrl: parseString(item.RESIM_DETAY),
            tax: parseString(item.VERGI),
            specifications: Object.keys(specs).length > 0 ? specs : undefined,
          })
        }
      }
    }

    return products
  }

  // Stok (op=s)
  async getStock(): Promise<Map<string, number>> {
    const xml = await this.fetchXml("s")
    const parsed = xmlParser.parse(xml)

    const stockMap = new Map<string, number>()
    const root = (parsed?.INDEXGRUP ?? parsed?.NETEX)?.STOK?.URUN

    if (!root) return stockMap

    const items = Array.isArray(root) ? root : [root]

    for (const item of items) {
      const kod = parseString(item["@_KOD"])
      const miktar = parseNumber(item["@_MIKTAR"] || item["@_STOK"])
      if (kod) stockMap.set(kod, miktar)
    }

    return stockMap
  }

  // Fiyat (op=f)
  async getPrice(): Promise<Map<string, { price: number; currency: string }>> {
    const xml = await this.fetchXml("f")
    const parsed = xmlParser.parse(xml)

    const priceMap = new Map<string, { price: number; currency: string }>()
    const root = (parsed?.INDEXGRUP ?? parsed?.NETEX)?.FIYAT?.URUN

    if (!root) return priceMap

    const items = Array.isArray(root) ? root : [root]

    for (const item of items) {
      const kod = parseString(item["@_KOD"])
      const fiyat = parseNumber(item["@_FIYAT"] || item["@_PRICE"])
      const paraBirimi = parseString(item["@_PARABIRIMI"] || item["@_CURRENCY"] || "TRY")
      if (kod) priceMap.set(kod, { price: fiyat, currency: paraBirimi })
    }

    return priceMap
  }

  // Tüm veriyi birleştir
  async getAllProducts(): Promise<IndexGrupProduct[]> {
    const [products, stockMap, priceMap] = await Promise.all([
      this.getCatalog(),
      this.getStock(),
      this.getPrice(),
    ])

    return products.map((product) => {
      const stock = stockMap.get(product.productCode)
      const priceInfo = priceMap.get(product.productCode)

      return {
        ...product,
        stock,
        price: priceInfo?.price,
        currency: priceInfo?.currency,
      }
    })
  }
}
