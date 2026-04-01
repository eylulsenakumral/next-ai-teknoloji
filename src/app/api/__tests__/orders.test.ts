/**
 * Integration tests for:
 *   GET  /api/orders  (dealer's own orders)
 *   POST /api/orders  (create order)
 *
 * Access rules:
 *   - Unauthenticated → 401
 *   - Admin/super_admin → 403 (dealer-only endpoint)
 *   - Dealer (authenticated) → 200/201
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/services/order.service", () => ({
  getOrdersByCustomer: vi.fn(),
  createOrder: vi.fn(),
}))

import { GET, POST } from "@/app/api/orders/route"
import { getOrdersByCustomer, createOrder } from "@/services/order.service"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options)
}

const DEALER_SESSION = {
  user: { id: "dealer-1", role: "dealer", name: "Test Bayii" },
  expires: "9999-01-01",
}

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", name: "Admin" },
  expires: "9999-01-01",
}

// ---------------------------------------------------------------------------
// GET /api/orders
// ---------------------------------------------------------------------------

describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const req = makeRequest("http://localhost/api/orders")
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  it("returns 403 when admin tries to access dealer endpoint", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    const req = makeRequest("http://localhost/api/orders")
    const res = await GET(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("bayilere")
  })

  it("returns 200 with dealer orders for authenticated dealer", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(DEALER_SESSION as never)

    const mockResult = {
      data: [
        { id: "order-1", status: "PENDING", total: 1500 },
        { id: "order-2", status: "CONFIRMED", total: 2200 },
      ],
      meta: { total: 2, page: 1, limit: 20 },
    }
    vi.mocked(getOrdersByCustomer).mockResolvedValueOnce(mockResult as never)

    const req = makeRequest("http://localhost/api/orders")
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    // Service was called with correct dealer ID
    expect(vi.mocked(getOrdersByCustomer)).toHaveBeenCalledWith(
      "dealer-1",
      1,
      20,
      undefined
    )
  })

  it("passes page, limit, and status query params to service", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(DEALER_SESSION as never)

    vi.mocked(getOrdersByCustomer).mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 2, limit: 10 },
    } as never)

    const req = makeRequest("http://localhost/api/orders?page=2&limit=10&status=CONFIRMED")
    await GET(req)

    expect(vi.mocked(getOrdersByCustomer)).toHaveBeenCalledWith(
      "dealer-1",
      2,
      10,
      "CONFIRMED"
    )
  })

  it("returns 500 when service throws an error", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(DEALER_SESSION as never)

    vi.mocked(getOrdersByCustomer).mockRejectedValueOnce(new Error("DB error"))

    const req = makeRequest("http://localhost/api/orders")
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when not authenticated", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const req = makeRequest("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it("returns 403 when admin tries to create an order", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(ADMIN_SESSION as never)

    const req = makeRequest("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(403)
  })

  it("returns 400 on malformed JSON body", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(DEALER_SESSION as never)

    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("returns 400 when order service throws business error", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(DEALER_SESSION as never)

    vi.mocked(createOrder).mockRejectedValueOnce(
      new Error("Stokta yeterli ürün yok.")
    )

    // Valid order body matching createOrderSchema (includes required paymentMethod)
    const validOrderBody = {
      items: [{ productId: "550e8400-e29b-41d4-a716-446655440001", quantity: 1 }],
      shippingAddress: {
        companyName: "Test Firma A.Ş.",
        contactName: "Ali Veli",
        phone: "05001234567",
        address: "Atatürk Caddesi No:1 Kat:2 Kadıköy",
        city: "Istanbul",
        country: "TR",
      },
      paymentMethod: "BANK_TRANSFER",
    }
    const req = makeRequest("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify(validOrderBody),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Stokta")
  })

  it("returns 201 with created order on valid input", async () => {
    const { getServerSession } = await import("next-auth")
    vi.mocked(getServerSession).mockResolvedValueOnce(DEALER_SESSION as never)

    const createdOrder = {
      id: "order-new",
      status: "PENDING",
      total: 1500,
    }
    vi.mocked(createOrder).mockResolvedValueOnce(createdOrder as never)

    const validOrderBody = {
      items: [{ productId: "550e8400-e29b-41d4-a716-446655440001", quantity: 2 }],
      shippingAddress: {
        companyName: "Test Firma A.Ş.",
        contactName: "Ali Veli",
        phone: "05001234567",
        address: "Atatürk Caddesi No:1 Kat:2 Kadıköy",
        city: "Istanbul",
        country: "TR",
      },
      paymentMethod: "BANK_TRANSFER",
    }
    const req = makeRequest("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify(validOrderBody),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ id: "order-new", status: "PENDING" })
  })
})
