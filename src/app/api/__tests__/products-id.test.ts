/**
 * Integration tests for:
 *   GET    /api/products/[id]   (detail)
 *   PUT    /api/products/[id]   (update)
 *   DELETE /api/products/[id]   (soft delete)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("@/lib/cache", () => ({
  withCache: vi.fn((_k: string, _t: number, loader: () => unknown) => loader()),
  invalidateProductCache: vi.fn().mockResolvedValue(undefined),
  invalidatePriceCache: vi.fn().mockResolvedValue(undefined),
  invalidateNextCache: vi.fn().mockResolvedValue(undefined),
  CacheKey: {
    productDetail: (id: string) => `products:detail:${id}`,
    price: (id: string) => `price:${id}`,
  },
  TTL: { PRODUCT_DETAIL: 300 },
}))

import { GET, PUT, DELETE } from "@/app/api/products/[id]/route"
import { prisma } from "@/lib/db"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options as never)
}

const PRODUCT_ID = "550e8400-e29b-41d4-a716-446655440099"

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", name: "Admin" },
  expires: "9999-01-01",
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const MOCK_PRODUCT = {
  id: PRODUCT_ID,
  name: "Test Ürünü",
  slug: "test-urunu",
  deletedAt: null,
  brand: { id: "brand-1", name: "Marka A", logoUrl: null },
  category: { id: "cat-1", name: "Elektronik", path: "elektronik", parent: null },
  supplierProducts: [],
}

// ---------------------------------------------------------------------------
// GET /api/products/[id]
// ---------------------------------------------------------------------------

describe("GET /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`)
    const res = await GET(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(401)
  })

  it("returns 404 when product does not exist", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(null)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`)
    const res = await GET(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  it("returns 200 with product data when found", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(MOCK_PRODUCT as never)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`)
    const res = await GET(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toMatchObject({ id: PRODUCT_ID, name: "Test Ürünü" })
  })
})

// ---------------------------------------------------------------------------
// PUT /api/products/[id]
// ---------------------------------------------------------------------------

describe("PUT /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Yeni İsim" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(401)
  })

  it("returns 404 when product does not exist", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(null)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Yeni İsim" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(404)
  })

  it("returns 400 on validation error (invalid field value)", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(MOCK_PRODUCT as never)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`, {
      method: "PUT",
      // minOrderQuantity must be positive integer; 0 should fail
      body: JSON.stringify({ minOrderQuantity: 0 }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  it("returns 200 with updated product on valid input", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(MOCK_PRODUCT as never)

    const updatedProduct = { ...MOCK_PRODUCT, name: "Güncellenmiş Ürün", brand: null, category: null }
    vi.mocked(prisma.product.update).mockResolvedValueOnce(updatedProduct as never)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Güncellenmiş Ürün" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe("Güncellenmiş Ürün")
  })

  it("regenerates slug when name changes", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findFirst)
      .mockResolvedValueOnce(MOCK_PRODUCT as never) // existing product check
      .mockResolvedValueOnce(null) // slug conflict check → no conflict

    const updatedProduct = { ...MOCK_PRODUCT, name: "Yeni İsim", slug: "yeni-isim", brand: null, category: null }
    vi.mocked(prisma.product.update).mockResolvedValueOnce(updatedProduct as never)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Yeni İsim" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/products/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`, { method: "DELETE" })
    const res = await DELETE(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(401)
  })

  it("returns 404 when product does not exist", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(null)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`, { method: "DELETE" })
    const res = await DELETE(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(404)
  })

  it("soft-deletes product and returns success", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(MOCK_PRODUCT as never)
    vi.mocked(prisma.product.update).mockResolvedValueOnce({ ...MOCK_PRODUCT, deletedAt: new Date() } as never)

    const req = makeRequest(`http://localhost/api/products/${PRODUCT_ID}`, { method: "DELETE" })
    const res = await DELETE(req, makeParams(PRODUCT_ID))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty("success", true)

    // Verify soft-delete: update was called with deletedAt
    const updateCall = vi.mocked(prisma.product.update).mock.calls[0][0] as {
      data: { deletedAt: Date }
    }
    expect(updateCall.data.deletedAt).toBeInstanceOf(Date)
  })
})
