import { describe, it, expect } from "vitest"
import { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema } from "./order"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"

const validShippingAddress = {
  companyName: "Örnek A.Ş.",
  contactName: "Ali Veli",
  phone: "05321234567",
  address: "İstanbul Kadıköy Moda Caddesi No:1",
  city: "İstanbul",
  country: "TR",
}

const validItem = {
  productId: VALID_UUID,
  quantity: 2,
}

// ---------------------------------------------------------------------------
// createOrderSchema
// ---------------------------------------------------------------------------
describe("createOrderSchema", () => {
  const validOrder = {
    items: [validItem],
    shippingAddress: validShippingAddress,
    paymentMethod: "BANK_TRANSFER" as const,
  }

  it("accepts a valid order", () => {
    const result = createOrderSchema.safeParse(validOrder)
    expect(result.success).toBe(true)
  })

  it("rejects order with no items", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, items: [] })
    expect(result.success).toBe(false)
  })

  it("rejects order with more than 200 items", () => {
    const items = Array.from({ length: 201 }, () => ({ ...validItem }))
    const result = createOrderSchema.safeParse({ ...validOrder, items })
    expect(result.success).toBe(false)
  })

  it("accepts order with exactly 200 items", () => {
    const items = Array.from({ length: 200 }, () => ({ ...validItem }))
    const result = createOrderSchema.safeParse({ ...validOrder, items })
    expect(result.success).toBe(true)
  })

  it("rejects item with invalid productId", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: "not-uuid", quantity: 1 }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects item with quantity 0", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: VALID_UUID, quantity: 0 }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects item with quantity exceeding 9999", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: VALID_UUID, quantity: 10000 }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects item with fractional quantity", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ productId: VALID_UUID, quantity: 1.5 }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid paymentMethod", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, paymentMethod: "CASH" })
    expect(result.success).toBe(false)
  })

  it("accepts both valid paymentMethods", () => {
    for (const method of ["BANK_TRANSFER", "ON_ACCOUNT"]) {
      const result = createOrderSchema.safeParse({ ...validOrder, paymentMethod: method })
      expect(result.success, `paymentMethod ${method} should be valid`).toBe(true)
    }
  })

  it("rejects shippingAddress with short phone", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      shippingAddress: { ...validShippingAddress, phone: "0532" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects shippingAddress with short address", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      shippingAddress: { ...validShippingAddress, address: "Kısa" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects shippingAddress with city too short", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      shippingAddress: { ...validShippingAddress, city: "A" },
    })
    expect(result.success).toBe(false)
  })

  it("defaults country to TR", () => {
    const { country: _, ...addrWithoutCountry } = validShippingAddress
    const result = createOrderSchema.safeParse({
      ...validOrder,
      shippingAddress: addrWithoutCountry,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.shippingAddress.country).toBe("TR")
    }
  })

  it("rejects country not exactly 2 chars", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      shippingAddress: { ...validShippingAddress, country: "TUR" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects notes longer than 2000 chars", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, notes: "X".repeat(2001) })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateOrderStatusSchema
// ---------------------------------------------------------------------------
describe("updateOrderStatusSchema", () => {
  it("accepts all valid status values", () => {
    const statuses = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]
    for (const status of statuses) {
      const result = updateOrderStatusSchema.safeParse({ status })
      expect(result.success, `status ${status} should be valid`).toBe(true)
    }
  })

  it("rejects invalid status", () => {
    const result = updateOrderStatusSchema.safeParse({ status: "IN_PROGRESS" })
    expect(result.success).toBe(false)
  })

  it("accepts optional adminNotes", () => {
    const result = updateOrderStatusSchema.safeParse({
      status: "CONFIRMED",
      adminNotes: "Sipariş onaylandı",
    })
    expect(result.success).toBe(true)
  })

  it("rejects adminNotes longer than 2000 chars", () => {
    const result = updateOrderStatusSchema.safeParse({
      status: "CONFIRMED",
      adminNotes: "X".repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it("accepts optional shippingTrackingNumber", () => {
    const result = updateOrderStatusSchema.safeParse({
      status: "SHIPPED",
      shippingTrackingNumber: "1Z999AA10123456784",
      shippingCarrier: "UPS",
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// cancelOrderSchema
// ---------------------------------------------------------------------------
describe("cancelOrderSchema", () => {
  it("accepts a valid cancel reason", () => {
    const result = cancelOrderSchema.safeParse({ reason: "Yanlış ürün siparişi verdim" })
    expect(result.success).toBe(true)
  })

  it("rejects reason shorter than 5 chars", () => {
    const result = cancelOrderSchema.safeParse({ reason: "Yok" })
    expect(result.success).toBe(false)
  })

  it("rejects reason longer than 1000 chars", () => {
    const result = cancelOrderSchema.safeParse({ reason: "X".repeat(1001) })
    expect(result.success).toBe(false)
  })

  it("accepts reason of exactly 5 chars", () => {
    const result = cancelOrderSchema.safeParse({ reason: "12345" })
    expect(result.success).toBe(true)
  })

  it("rejects missing reason", () => {
    const result = cancelOrderSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
