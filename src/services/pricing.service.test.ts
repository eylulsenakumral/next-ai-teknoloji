import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Use vi.hoisted so mock objects are initialised before vi.mock hoisting
// ---------------------------------------------------------------------------
const mockPrisma = vi.hoisted(() => ({
  profitMargin: { findMany: vi.fn() },
  product: { findFirst: vi.fn(), findMany: vi.fn() },
}))

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }))

// Cache mock: always bypass cache so the loader runs directly
vi.mock("@/lib/cache", () => ({
  withCache: vi.fn((_key: string, _ttl: number, loader: () => unknown) => loader()),
  invalidatePriceCache: vi.fn().mockResolvedValue(undefined),
  CacheKey: {
    price: (id: string) => `nexadepo:price:${id}`,
    productList: (p: string) => `nexadepo:products:list:${p}`,
    productDetail: (id: string) => `nexadepo:products:detail:${id}`,
    categoryTree: () => "nexadepo:categories:tree",
    categoryList: (p: string) => `nexadepo:categories:list:${p}`,
    brandList: (p: string) => `nexadepo:brands:list:${p}`,
    dashboardStats: () => "nexadepo:dashboard:stats",
  },
  TTL: {
    PRICE: 300,
    PRODUCT_LIST: 300,
    PRODUCT_DETAIL: 300,
    CATEGORY_TREE: 1800,
    CATEGORY_LIST: 1800,
    BRAND_LIST: 1800,
    DASHBOARD_STATS: 120,
  },
}))

import { simulatePrice, getApplicableMargin } from "./pricing.service"

const PRODUCT_ID = "prod-uuid-1111-1111-1111-111111111111"
const CATEGORY_ID = "cat-uuid-2222-2222-2222-222222222222"
const BRAND_ID = "brand-uuid-3333-3333-3333-333333333333"

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// simulatePrice — pure math, no DB
// ---------------------------------------------------------------------------
describe("simulatePrice", () => {
  it("calculates saleExVat correctly", () => {
    const { saleExVat } = simulatePrice(100, 30, 20)
    // 100 * 1.30 = 130.0000
    expect(saleExVat).toBeCloseTo(130, 4)
  })

  it("calculates saleIncVat correctly", () => {
    const { saleIncVat } = simulatePrice(100, 30, 20)
    // 130 * 1.20 = 156.0000
    expect(saleIncVat).toBeCloseTo(156, 4)
  })

  it("calculates profit correctly", () => {
    const { profit } = simulatePrice(100, 30, 20)
    // saleExVat - purchasePrice = 130 - 100 = 30
    expect(profit).toBeCloseTo(30, 4)
  })

  it("handles 0% margin — sale equals purchase before VAT", () => {
    const { saleExVat, profit } = simulatePrice(100, 0, 20)
    expect(saleExVat).toBeCloseTo(100, 4)
    expect(profit).toBeCloseTo(0, 4)
  })

  it("handles 0% VAT — saleIncVat equals saleExVat", () => {
    const { saleExVat, saleIncVat } = simulatePrice(100, 30, 0)
    expect(saleIncVat).toBeCloseTo(saleExVat, 4)
  })

  it("handles fractional purchase price", () => {
    const { saleExVat } = simulatePrice(99.99, 10, 0)
    expect(saleExVat).toBeCloseTo(109.989, 3)
  })

  it("handles large margin (100%)", () => {
    const { saleExVat, profit } = simulatePrice(200, 100, 0)
    expect(saleExVat).toBeCloseTo(400, 4)
    expect(profit).toBeCloseTo(200, 4)
  })

  it("rounds to 4 decimal places (no floating point blowout)", () => {
    const { saleExVat } = simulatePrice(33.33, 33, 0)
    // 33.33 * 1.33 = 44.3289
    expect(saleExVat).toBe(Math.round(33.33 * 1.33 * 10000) / 10000)
  })

  it("handles very small purchase price", () => {
    const { saleExVat } = simulatePrice(0.01, 50, 0)
    expect(saleExVat).toBeCloseTo(0.015, 4)
  })

  it("handles high VAT rate", () => {
    const { saleIncVat } = simulatePrice(100, 0, 50)
    expect(saleIncVat).toBeCloseTo(150, 4)
  })
})

// ---------------------------------------------------------------------------
// getApplicableMargin — DB access mocked
// ---------------------------------------------------------------------------
describe("getApplicableMargin", () => {
  it("returns PRODUCT-scope margin when one is available (highest priority)", async () => {
    mockPrisma.profitMargin.findMany.mockResolvedValue([
      { scope: "PRODUCT", scopeId: PRODUCT_ID, priority: 10, marginPct: "45.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
      { scope: "GLOBAL",  scopeId: null,       priority: 1,  marginPct: "30.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
    ])

    const result = await getApplicableMargin(PRODUCT_ID, CATEGORY_ID, BRAND_ID)

    expect(result.marginPct).toBeCloseTo(45)
    expect(result.source).toBe("product")
  })

  it("falls back to BRAND-scope when no PRODUCT or CATEGORY margin exists", async () => {
    mockPrisma.profitMargin.findMany.mockResolvedValue([
      { scope: "BRAND", scopeId: BRAND_ID, priority: 5, marginPct: "20.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
      { scope: "GLOBAL", scopeId: null,    priority: 1, marginPct: "30.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
    ])

    const result = await getApplicableMargin(PRODUCT_ID, null, BRAND_ID)

    expect(result.marginPct).toBeCloseTo(20)
    expect(result.source).toBe("brand")
  })

  it("falls back to GLOBAL margin when no specific margins exist", async () => {
    mockPrisma.profitMargin.findMany.mockResolvedValue([
      { scope: "GLOBAL", scopeId: null, priority: 1, marginPct: "25.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
    ])

    const result = await getApplicableMargin(PRODUCT_ID, null, null)

    expect(result.marginPct).toBeCloseTo(25)
    expect(result.source).toBe("global")
  })

  it("returns default 30% when no margins exist at all", async () => {
    mockPrisma.profitMargin.findMany.mockResolvedValue([])

    const result = await getApplicableMargin(PRODUCT_ID, null, null)

    expect(result.marginPct).toBe(30)
    expect(result.source).toBe("global")
  })

  it("CATEGORY scope wins over BRAND scope", async () => {
    mockPrisma.profitMargin.findMany.mockResolvedValue([
      { scope: "CATEGORY", scopeId: CATEGORY_ID, priority: 5,  marginPct: "35.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
      { scope: "BRAND",    scopeId: BRAND_ID,    priority: 10, marginPct: "20.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
    ])

    const result = await getApplicableMargin(PRODUCT_ID, CATEGORY_ID, BRAND_ID)

    expect(result.source).toBe("category")
    expect(result.marginPct).toBeCloseTo(35)
  })

  it("ignores margin whose scopeId does not match the product", async () => {
    mockPrisma.profitMargin.findMany.mockResolvedValue([
      { scope: "PRODUCT", scopeId: "other-product-id", priority: 10, marginPct: "99.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
      { scope: "GLOBAL",  scopeId: null,               priority: 1,  marginPct: "30.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
    ])

    const result = await getApplicableMargin(PRODUCT_ID, null, null)

    expect(result.source).toBe("global")
    expect(result.marginPct).toBeCloseTo(30)
  })

  it("among same scope, higher priority wins", async () => {
    mockPrisma.profitMargin.findMany.mockResolvedValue([
      { scope: "GLOBAL", scopeId: null, priority: 1,  marginPct: "20.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
      { scope: "GLOBAL", scopeId: null, priority: 10, marginPct: "40.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
    ])

    const result = await getApplicableMargin(PRODUCT_ID, null, null)

    // priority=10 wins
    expect(result.marginPct).toBeCloseTo(40)
  })
})

// ---------------------------------------------------------------------------
// Integration: simulatePrice + getApplicableMargin composability
// ---------------------------------------------------------------------------
describe("simulatePrice + getApplicableMargin composition", () => {
  it("computes correct final price using resolved margin", async () => {
    mockPrisma.profitMargin.findMany.mockResolvedValue([
      { scope: "GLOBAL", scopeId: null, priority: 1, marginPct: "20.00", isActive: true, deletedAt: null, validFrom: null, validUntil: null },
    ])

    const { marginPct } = await getApplicableMargin(PRODUCT_ID, null, null)
    const { saleExVat, saleIncVat, profit } = simulatePrice(100, marginPct, 18)

    expect(saleExVat).toBeCloseTo(120, 4)    // 100 * 1.20
    expect(saleIncVat).toBeCloseTo(141.6, 4) // 120 * 1.18
    expect(profit).toBeCloseTo(20, 4)
  })
})
