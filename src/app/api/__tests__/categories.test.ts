/**
 * Integration tests for:
 *   GET  /api/categories   (flat list and tree)
 *   POST /api/categories   (create)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock("@/lib/cache", () => ({
  withCache: vi.fn((_k: string, _t: number, loader: () => unknown) => loader()),
  invalidateCategoryCache: vi.fn().mockResolvedValue(undefined),
  CacheKey: {
    categoryList: (p: string) => `categories:list:${p}`,
    categoryTree: () => "categories:tree",
    dashboardStats: () => "dashboard:stats",
  },
  TTL: { CATEGORY_LIST: 1800, CATEGORY_TREE: 1800 },
}))

vi.mock("@/lib/auth-helpers", () => ({
  getAdminSession: vi.fn(),
  requireAdminSession: vi.fn(),
}))

import { GET, POST } from "@/app/api/categories/route"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options as never)
}

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", name: "Admin" },
  expires: "9999-01-01",
}

// ---------------------------------------------------------------------------
// GET /api/categories
// ---------------------------------------------------------------------------

describe("GET /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 200 when not authenticated (public endpoint)", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValueOnce([] as never)

    const req = makeRequest("http://localhost/api/categories")
    const res = await GET(req)

    expect(res.status).toBe(200)
  })

  it("returns 200 when authenticated as dealer (public endpoint)", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValueOnce([] as never)

    const req = makeRequest("http://localhost/api/categories")
    const res = await GET(req)

    expect(res.status).toBe(200)
  })

  it("returns flat list when flat=true", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    const flatCategories = [
      { id: "cat-1", name: "Elektronik", depth: 0, parent: null, _count: { children: 2, products: 5 } },
      { id: "cat-2", name: "Kameralar", depth: 1, parent: { id: "cat-1", name: "Elektronik" }, _count: { children: 0, products: 10 } },
    ]
    vi.mocked(prisma.category.findMany).mockResolvedValueOnce(flatCategories as never)

    const req = makeRequest("http://localhost/api/categories?flat=true")
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toHaveProperty("depth", 0)
  })

  it("returns tree structure when flat is not set", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    const treeCategories = [
      {
        id: "cat-1",
        name: "Elektronik",
        depth: 0,
        _count: { children: 1, products: 0 },
        children: [
          {
            id: "cat-2",
            name: "Kameralar",
            depth: 1,
            _count: { children: 0, products: 10 },
            children: [],
          },
        ],
      },
    ]
    vi.mocked(prisma.category.findMany).mockResolvedValueOnce(treeCategories as never)

    const req = makeRequest("http://localhost/api/categories")
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].children).toHaveLength(1)
    expect(body.data[0].children[0].name).toBe("Kameralar")
  })

  it("filters by search term (flat mode)", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(prisma.category.findMany).mockResolvedValueOnce([] as never)

    const req = makeRequest("http://localhost/api/categories?flat=true&search=kamera")
    await GET(req)

    const callArgs = vi.mocked(prisma.category.findMany).mock.calls[0][0] as {
      where: { name?: { contains: string } }
    }
    expect(callArgs.where.name).toBeDefined()
    expect(callArgs.where.name?.contains).toBe("kamera")
  })
})

// ---------------------------------------------------------------------------
// POST /api/categories
// ---------------------------------------------------------------------------

describe("POST /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce(null)
    vi.mocked(requireAdminSession).mockReturnValueOnce(
      NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 })
    )

    const req = makeRequest("http://localhost/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Yeni Kategori" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it("returns 400 when validation fails (missing name)", async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(requireAdminSession).mockReturnValueOnce(null)

    const req = makeRequest("http://localhost/api/categories", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  it("returns 201 with created category on valid input", async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(requireAdminSession).mockReturnValueOnce(null)

    // No slug conflict
    vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null)

    const createdCategory = {
      id: "cat-new",
      name: "Güvenlik",
      slug: "guvenlik",
      parentId: null,
      parent: null,
      depth: 0,
      path: "guvenlik",
    }
    vi.mocked(prisma.category.create).mockResolvedValueOnce(createdCategory as never)

    const req = makeRequest("http://localhost/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Güvenlik" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ id: "cat-new", name: "Güvenlik" })
  })

  it("returns 400 when parentId does not exist", async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(requireAdminSession).mockReturnValueOnce(null)

    // Parent lookup returns null
    vi.mocked(prisma.category.findFirst).mockResolvedValueOnce(null)

    const parentId = "550e8400-e29b-41d4-a716-446655440001"
    const req = makeRequest("http://localhost/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Alt Kategori", parentId }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("kategori")
  })

  it("sets correct depth and path for child category", async () => {
    vi.mocked(getAdminSession).mockResolvedValueOnce(ADMIN_SESSION as never)
    vi.mocked(requireAdminSession).mockReturnValueOnce(null)

    const parentId = "550e8400-e29b-41d4-a716-446655440001"
    const parentCategory = {
      id: parentId,
      name: "Elektronik",
      slug: "elektronik",
      depth: 0,
      path: "elektronik",
    }
    // findFirst: parent lookup → found; slug conflict → none
    vi.mocked(prisma.category.findFirst)
      .mockResolvedValueOnce(parentCategory as never)
      .mockResolvedValueOnce(null)

    const createdChild = {
      id: "cat-child",
      name: "Kameralar",
      slug: "kameralar",
      parentId,
      parent: { id: parentId, name: "Elektronik" },
      depth: 1,
      path: "elektronik/kameralar",
    }
    vi.mocked(prisma.category.create).mockResolvedValueOnce(createdChild as never)

    const req = makeRequest("http://localhost/api/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Kameralar", parentId }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const createCall = vi.mocked(prisma.category.create).mock.calls[0][0] as {
      data: { depth: number; path: string }
    }
    expect(createCall.data.depth).toBe(1)
    expect(createCall.data.path).toContain("kameralar")
  })
})
