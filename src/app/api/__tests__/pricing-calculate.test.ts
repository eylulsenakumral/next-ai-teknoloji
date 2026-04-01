/**
 * Integration tests for:
 *   POST /api/pricing/calculate
 *
 * Two modes:
 *   1. productId    — look up real product, calculate from DB
 *   2. purchasePrice + marginPct + vatRate — pure simulation
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/cache", () => ({
  withCache: vi.fn((_k: string, _t: number, loader: () => unknown) => loader()),
  invalidatePriceCache: vi.fn().mockResolvedValue(undefined),
  CacheKey: { price: (id: string) => `price:${id}` },
  TTL: { PRICE: 300 },
}))

// Mock the pricing service
vi.mock("@/services/pricing.service", () => ({
  calculateProductPrice: vi.fn(),
  simulatePrice: vi.fn(),
}))

import { POST } from "@/app/api/pricing/calculate/route"
import {
  calculateProductPrice,
  simulatePrice,
} from "@/services/pricing.service"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/pricing/calculate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", name: "Admin" },
  expires: "9999-01-01",
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/pricing/calculate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const req = makeRequest({ purchasePrice: 100, marginPct: 30 })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it("returns 400 when body fails schema validation", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    // Neither valid schema — productId must be UUID, purchasePrice missing
    const req = makeRequest({ productId: "not-a-uuid" })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  it("returns 404 when product is not found (productId mode)", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(calculateProductPrice).mockResolvedValueOnce(null)

    const req = makeRequest({ productId: "550e8400-e29b-41d4-a716-446655440001" })
    const res = await POST(req)

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  it("returns 200 with price calculation when product exists (productId mode)", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    const mockPriceResult = {
      purchasePrice: 100,
      supplierId: "sup-1",
      supplierName: "Tedarikçi A",
      marginPct: 30,
      marginSource: "global" as const,
      salePriceExVat: 130,
      vatRate: 20,
      salePriceIncVat: 156,
      profitAmount: 30,
      stockQuantity: 50,
    }
    vi.mocked(calculateProductPrice).mockResolvedValueOnce(mockPriceResult)

    const req = makeRequest({ productId: "550e8400-e29b-41d4-a716-446655440001" })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toMatchObject({
      purchasePrice: 100,
      marginPct: 30,
      salePriceExVat: 130,
      salePriceIncVat: 156,
    })
  })

  it("returns 200 with simulated price (purchasePrice mode, default vatRate=20)", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    vi.mocked(simulatePrice).mockReturnValueOnce({
      saleExVat: 130,
      saleIncVat: 156,
      profit: 30,
    })

    const req = makeRequest({ purchasePrice: 100, marginPct: 30 })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toMatchObject({
      purchasePrice: 100,
      marginPct: 30,
      vatRate: 20,
      saleExVat: 130,
      saleIncVat: 156,
    })
  })

  it("uses provided vatRate in simulation mode", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    vi.mocked(simulatePrice).mockReturnValueOnce({
      saleExVat: 118,
      saleIncVat: 129.8,
      profit: 18,
    })

    const req = makeRequest({ purchasePrice: 100, marginPct: 18, vatRate: 10 })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.vatRate).toBe(10)

    // simulatePrice was called with vatRate=10
    expect(vi.mocked(simulatePrice)).toHaveBeenCalledWith(100, 18, 10)
  })

  it("returns 400 when purchasePrice is negative", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    const req = makeRequest({ purchasePrice: -50, marginPct: 30 })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})
