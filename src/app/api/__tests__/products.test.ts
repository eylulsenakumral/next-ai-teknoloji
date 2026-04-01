/**
 * Integration tests for:
 *   GET  /api/products        (list with filters/pagination)
 *   POST /api/products        (create with validation)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("@/lib/cache", () => ({
  withCache: vi.fn((_k: string, _t: number, loader: () => unknown) => loader()),
  invalidateProductCache: vi.fn().mockResolvedValue(undefined),
  CacheKey: {
    productList: (p: string) => `products:list:${p}`,
    productDetail: (id: string) => `products:detail:${id}`,
    dashboardStats: () => "dashboard:stats",
  },
  TTL: { PRODUCT_LIST: 300, PRODUCT_DETAIL: 300 },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from "@/app/api/products/route"
import { prisma } from "@/lib/db"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options)
}

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", name: "Admin User" },
  expires: "9999-01-01",
}

const DEALER_SESSION = {
  user: { id: "dealer-1", role: "dealer", name: "Test Dealer" },
  expires: "9999-01-01",
}

// ---------------------------------------------------------------------------
// GET /api/products
// ---------------------------------------------------------------------------

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const req = makeRequest("http://localhost/api/products")
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  it("returns 403 when authenticated as dealer (not admin)", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(DEALER_SESSION as never)

    const req = makeRequest("http://localhost/api/products")
    const res = await GET(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  it("returns 200 with paginated product list for admin", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    const mockProducts = [
      { id: "prod-1", name: "Ürün A", brand: null, category: null, supplierProducts: [] },
      { id: "prod-2", name: "Ürün B", brand: null, category: null, supplierProducts: [] },
    ]
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockProducts as never)
    vi.mocked(prisma.product.count).mockResolvedValueOnce(2)

    const req = makeRequest("http://localhost/api/products")
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.meta.total).toBe(2)
    expect(body.meta.page).toBe(1)
    expect(body.meta.limit).toBe(25)
    expect(body.meta.totalPages).toBe(1)
  })

  it("passes search term into Prisma OR clause", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([] as never)
    vi.mocked(prisma.product.count).mockResolvedValueOnce(0)

    const req = makeRequest("http://localhost/api/products?search=kamera")
    await GET(req)

    const callArgs = vi.mocked(prisma.product.findMany).mock.calls[0][0] as {
      where: { OR?: unknown[] }
    }
    expect(callArgs.where.OR).toBeDefined()
    expect(Array.isArray(callArgs.where.OR)).toBe(true)
  })

  it("filters by brandId when query param is provided", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([] as never)
    vi.mocked(prisma.product.count).mockResolvedValueOnce(0)

    const brandId = "550e8400-e29b-41d4-a716-446655440001"
    const req = makeRequest(`http://localhost/api/products?brandId=${brandId}`)
    await GET(req)

    const callArgs = vi.mocked(prisma.product.findMany).mock.calls[0][0] as {
      where: { brandId?: string }
    }
    expect(callArgs.where.brandId).toBe(brandId)
  })

  it("calculates correct skip/take for page 2 with limit 10", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([] as never)
    vi.mocked(prisma.product.count).mockResolvedValueOnce(50)

    const req = makeRequest("http://localhost/api/products?page=2&limit=10")
    const res = await GET(req)

    expect(res.status).toBe(200)
    const callArgs = vi.mocked(prisma.product.findMany).mock.calls[0][0] as {
      skip: number
      take: number
    }
    expect(callArgs.skip).toBe(10)
    expect(callArgs.take).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// POST /api/products
// ---------------------------------------------------------------------------

describe("POST /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const req = makeRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify({ name: "Yeni Ürün" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it("returns 400 when name is empty (validation error)", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    const req = makeRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty("error")
    expect(body).toHaveProperty("details")
  })

  it("returns 201 with created product on valid input", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    // No slug conflict
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(null)

    const createdProduct = {
      id: "prod-new",
      name: "Yeni Ürün",
      slug: "yeni-urun",
      brand: null,
      category: null,
    }
    vi.mocked(prisma.product.create).mockResolvedValueOnce(createdProduct as never)

    const req = makeRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify({ name: "Yeni Ürün" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ id: "prod-new", name: "Yeni Ürün" })
  })

  it("appends -1 suffix when slug already exists", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    // First check returns a conflict, second returns null (free)
    vi.mocked(prisma.product.findFirst)
      .mockResolvedValueOnce({ id: "existing" } as never)
      .mockResolvedValueOnce(null)

    vi.mocked(prisma.product.create).mockResolvedValueOnce({
      id: "prod-new",
      name: "Yeni Ürün",
      slug: "yeni-urun-1",
      brand: null,
      category: null,
    } as never)

    const req = makeRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify({ name: "Yeni Ürün" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const createCall = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: { slug: string }
    }
    expect(createCall.data.slug).toBe("yeni-urun-1")
  })

  it("returns 403 when authenticated as dealer", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(DEALER_SESSION as never)

    const req = makeRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify({ name: "Ürün" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(403)
  })
})
