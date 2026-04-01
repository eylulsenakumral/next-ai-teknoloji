/**
 * Tesan SOAP Web Servis Entegrasyonu
 * http://www.tesaniletisim.com/webservice/ProductServices.asmx
 *
 * Metodlar:
 *   GetProductCategories  - Kategori ağacı (MainGroup, LowerGroup, Dept, Marka)
 *   GetProductLists       - Ürün listesi (filtreli/filtresiz)
 *   GetProductFeatures    - Ürün özellikleri (HTML)
 *   GetProductImages      - Ürün görselleri (URL list)
 *   GetStockPrices        - Fiyatlar (tanımlı + standart)
 *   GetWareHouseStocks    - Stok miktarları
 *
 * ENV:
 *   TESAN_USERNAME  - eposta (örn: tolga@next-ai.com.tr)
 *   TESAN_PASSWORD  - XML servis parolası
 *   TESAN_TOKEN     - static-unique token
 */

import { XMLParser } from "fast-xml-parser"

// ============================================================================
// Constants
// ============================================================================

const SOAP_ENDPOINT = "http://www.tesaniletisim.com/webservice/ProductServices.asmx"
const SOAP_NAMESPACE = "http://tempuri.org/"

// ============================================================================
// Types
// ============================================================================

export interface TesanProductCategory {
  lowerGroupId: number
  mainGroup: string
  lowerGroup: string
  departman: string
  productCatId: number
  productCat: string
  productTypeId: number
  productType: string
  brandId: number
  brand: string
}

export interface TesanProductList {
  stockId: number
  stockCode: string
  productCode: string
  product: string
  unit: string
  tax: number
  lowerGroupId: number
  specialCode: string
  productCatId: number
  productTypeId: number
  brandId: number
  productId: number
  productStatus: boolean
  stockStatus: boolean
  barcode: string
}

export interface TesanProductFeature {
  productId: number
  featuresType: string
  features: string // HTML içerik
}

export interface TesanProductImage {
  stockId: number
  type: string
  image: string // URL
}

export interface TesanStockPrice {
  stockId: number
  productId: number
  price: number
  currency: string
  standartPrice: number
  standartPriceCurrency: string
}

export interface TesanWareHouseStock {
  stockId: number
  productId: number
  quantity: number
}

// ============================================================================
// XML Parser
// ============================================================================

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  isArray: (name: string) => {
    return [
      "ProductCategory",
      "ProductList",
      "ProductFeatures",
      "ProductImages",
      "StockPrice",
      "WareHouseStock",
    ].includes(name)
  },
})

// ============================================================================
// SOAP helpers
// ============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function buildSoapEnvelope(
  methodName: string,
  body: string,
  username: string,
  password: string,
  token: string
): string {
  // Token GUID formatında {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX} olmalı
  const formattedToken = token.startsWith("{") ? token : `{${token}}`

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tns="${SOAP_NAMESPACE}">
  <soap:Header>
    <tns:AuthUsers>
      <tns:userName>${escapeXml(username)}</tns:userName>
      <tns:password>${escapeXml(password)}</tns:password>
      <tns:token>${escapeXml(formattedToken)}</tns:token>
    </tns:AuthUsers>
  </soap:Header>
  <soap:Body>
    <tns:${methodName}>
      ${body}
    </tns:${methodName}>
  </soap:Body>
</soap:Envelope>`
}

async function callSoap(
  methodName: string,
  body: string,
  username: string,
  password: string,
  token: string
): Promise<string> {
  const envelope = buildSoapEnvelope(methodName, body, username, password, token)

  const basicAuth = Buffer.from(`${username}:${password}`).toString("base64")

  const res = await fetch(SOAP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `"${SOAP_NAMESPACE}${methodName}"`,
      Authorization: `Basic ${basicAuth}`,
    },
    body: envelope,
  })

  if (!res.ok) {
    throw new Error(`SOAP ${methodName} HTTP ${res.status}: ${res.statusText}`)
  }

  const text = await res.text()

  // SOAP Fault kontrolü
  if (text.includes("<soap:Fault>") || text.includes("<faultstring>")) {
    const match = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    const msg = match ? match[1].trim() : "SOAP Fault"
    throw new Error(`SOAP Fault [${methodName}]: ${msg}`)
  }

  return text
}

function parseBoolean(val: unknown): boolean {
  if (typeof val === "boolean") return val
  const str = String(val ?? "").toLowerCase()
  return str === "true" || str === "1"
}

function parseNumber(val: unknown): number {
  if (val === null || val === undefined) return 0
  const num = Number(String(val).replace(",", "."))
  return isNaN(num) ? 0 : num
}

function parseInt10(val: unknown): number {
  if (val === null || val === undefined) return 0
  const num = parseInt(String(val), 10)
  return isNaN(num) ? 0 : num
}

// ============================================================================
// TesanSoapClient
// ============================================================================

export class TesanSoapClient {
  private readonly username: string
  private readonly password: string
  private readonly token: string

  constructor() {
    this.username = process.env.TESAN_USERNAME ?? ""
    this.password = process.env.TESAN_PASSWORD ?? ""
    this.token = process.env.TESAN_TOKEN ?? ""

    if (!this.username || !this.password || !this.token) {
      throw new Error(
        "Tesan credentials eksik: TESAN_USERNAME, TESAN_PASSWORD, TESAN_TOKEN env değişkenlerini kontrol edin"
      )
    }
  }

  // ============================================================================
  // GetProductCategories
  // ============================================================================

  async getProductCategories(): Promise<TesanProductCategory[]> {
    const xml = await callSoap("GetProductCategories", "", this.username, this.password, this.token)

    const parsed = xmlParser.parse(xml)
    const result =
      parsed?.["soap:Envelope"]?.["soap:Body"]?.["GetProductCategoriesResponse"]?.[
        "GetProductCategoriesResult"
      ]?.["ProductCategory"] ?? []

    return (Array.isArray(result) ? result : [result]).map((item: Record<string, unknown>) => ({
      lowerGroupId: parseInt10(item["LowerGroupId"]),
      mainGroup: String(item["MainGroup"] ?? ""),
      lowerGroup: String(item["LowerGroup"] ?? ""),
      departman: String(item["Departman"] ?? ""),
      productCatId: parseInt10(item["ProductCatId"]),
      productCat: String(item["ProductCat"] ?? ""),
      productTypeId: parseInt10(item["ProductTypeId"]),
      productType: String(item["ProductType"] ?? ""),
      brandId: parseInt10(item["BrandId"]),
      brand: String(item["Brand"] ?? ""),
    }))
  }

  // ============================================================================
  // GetProductLists
  // Tüm ürünleri çekmek için parametreler boş array olarak gönderilir
  // ============================================================================

  async getProductLists(options?: {
    departman?: number // 0=Hepsi, 1=Teknoloji, 2=GSM
    mainGroups?: string[]
    lowerGroupIds?: number[]
    productCatIds?: number[]
    brandIds?: number[]
  }): Promise<TesanProductList[]> {
    const {
      departman = 0,
      mainGroups = [],
      lowerGroupIds = [],
      productCatIds = [],
      brandIds = [],
    } = options ?? {}

    const mainGroupXml =
      mainGroups.length > 0
        ? mainGroups.map((g) => `<tns:string>${escapeXml(g)}</tns:string>`).join("")
        : ""

    const lowerGroupXml =
      lowerGroupIds.length > 0
        ? lowerGroupIds.map((id) => `<tns:int>${id}</tns:int>`).join("")
        : ""

    const productCatXml =
      productCatIds.length > 0
        ? productCatIds.map((id) => `<tns:int>${id}</tns:int>`).join("")
        : ""

    const brandXml =
      brandIds.length > 0
        ? brandIds.map((id) => `<tns:int>${id}</tns:int>`).join("")
        : ""

    const body = `
      <tns:departman>${departman}</tns:departman>
      <tns:MainGroup>${mainGroupXml}</tns:MainGroup>
      <tns:LowerGroupId>${lowerGroupXml}</tns:LowerGroupId>
      <tns:ProductCatId>${productCatXml}</tns:ProductCatId>
      <tns:BrandId>${brandXml}</tns:BrandId>`

    const xml = await callSoap("GetProductLists", body, this.username, this.password, this.token)

    const parsed = xmlParser.parse(xml)
    const result =
      parsed?.["soap:Envelope"]?.["soap:Body"]?.["GetProductListsResponse"]?.[
        "GetProductListsResult"
      ]?.["ProductList"] ?? []

    return (Array.isArray(result) ? result : [result]).map((item: Record<string, unknown>) => ({
      stockId: parseInt10(item["StockId"]),
      stockCode: String(item["StockCode"] ?? ""),
      productCode: String(item["ProductCode"] ?? ""),
      product: String(item["Product"] ?? ""),
      unit: String(item["Unit"] ?? "Adet"),
      tax: parseInt10(item["Tax"]),
      lowerGroupId: parseInt10(item["LowerGroupId"]),
      specialCode: String(item["SpecialCode"] ?? ""),
      productCatId: parseInt10(item["ProductCatId"]),
      productTypeId: parseInt10(item["ProductTypeId"]),
      brandId: parseInt10(item["BrandId"]),
      productId: parseInt10(item["ProductId"]),
      productStatus: parseBoolean(item["ProductStatus"]),
      stockStatus: parseBoolean(item["StockStatus"]),
      barcode: String(item["Barcode"] ?? ""),
    }))
  }

  // ============================================================================
  // GetProductFeatures
  // ============================================================================

  async getProductFeatures(): Promise<TesanProductFeature[]> {
    const xml = await callSoap("GetProductFeatures", "", this.username, this.password, this.token)

    const parsed = xmlParser.parse(xml)
    const result =
      parsed?.["soap:Envelope"]?.["soap:Body"]?.["GetProductFeaturesResponse"]?.[
        "GetProductFeaturesResult"
      ]?.["ProductFeatures"] ?? []

    return (Array.isArray(result) ? result : [result]).map((item: Record<string, unknown>) => ({
      productId: parseInt10(item["ProductId"]),
      featuresType: String(item["FeaturesType"] ?? ""),
      features: String(item["Features"] ?? ""),
    }))
  }

  // ============================================================================
  // GetProductImages
  // ============================================================================

  async getProductImages(): Promise<TesanProductImage[]> {
    const xml = await callSoap("GetProductImages", "", this.username, this.password, this.token)

    const parsed = xmlParser.parse(xml)
    const result =
      parsed?.["soap:Envelope"]?.["soap:Body"]?.["GetProductImagesResponse"]?.[
        "GetProductImagesResult"
      ]?.["ProductImages"] ?? []

    return (Array.isArray(result) ? result : [result]).map((item: Record<string, unknown>) => ({
      stockId: parseInt10(item["StockId"]),
      type: String(item["Type"] ?? "Image"),
      image: String(item["Image"] ?? ""),
    }))
  }

  // ============================================================================
  // GetStockPrices
  // ============================================================================

  async getStockPrices(): Promise<TesanStockPrice[]> {
    const xml = await callSoap("GetStockPrices", "", this.username, this.password, this.token)

    const parsed = xmlParser.parse(xml)
    const result =
      parsed?.["soap:Envelope"]?.["soap:Body"]?.["GetStockPricesResponse"]?.[
        "GetStockPricesResult"
      ]?.["StockPrice"] ?? []

    return (Array.isArray(result) ? result : [result]).map((item: Record<string, unknown>) => ({
      stockId: parseInt10(item["StockId"]),
      productId: parseInt10(item["ProductId"]),
      price: parseNumber(item["Price"]),
      currency: String(item["Currency"] ?? "TL"),
      standartPrice: parseNumber(item["StandartPrice"]),
      standartPriceCurrency: String(item["StandartPriceCurrency"] ?? "TL"),
    }))
  }

  // ============================================================================
  // GetWareHouseStocks
  // ============================================================================

  async getWareHouseStocks(): Promise<TesanWareHouseStock[]> {
    const xml = await callSoap("GetWareHouseStocks", "", this.username, this.password, this.token)

    const parsed = xmlParser.parse(xml)
    const result =
      parsed?.["soap:Envelope"]?.["soap:Body"]?.["GetWareHouseStocksResponse"]?.[
        "GetWareHouseStocksResult"
      ]?.["WareHouseStock"] ?? []

    return (Array.isArray(result) ? result : [result]).map((item: Record<string, unknown>) => ({
      stockId: parseInt10(item["StockId"]),
      productId: parseInt10(item["ProductId"]),
      quantity: parseInt10(item["Quantity"]),
    }))
  }
}
