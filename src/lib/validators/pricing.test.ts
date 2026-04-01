import { describe, it, expect } from "vitest"
import { createMarginSchema, updateMarginSchema, simulatePriceSchema } from "./pricing"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"

// ---------------------------------------------------------------------------
// createMarginSchema
// ---------------------------------------------------------------------------
describe("createMarginSchema", () => {
  const validMargin = {
    scope: "GLOBAL" as const,
    marginPct: 30,
  }

  it("accepts a minimal valid margin", () => {
    const result = createMarginSchema.safeParse(validMargin)
    expect(result.success).toBe(true)
  })

  it("accepts all valid scope values", () => {
    for (const scope of ["GLOBAL", "CATEGORY", "BRAND", "PRODUCT", "CUSTOMER"]) {
      const result = createMarginSchema.safeParse({ ...validMargin, scope })
      expect(result.success, `scope ${scope} should be valid`).toBe(true)
    }
  })

  it("rejects invalid scope", () => {
    const result = createMarginSchema.safeParse({ ...validMargin, scope: "ORDER" })
    expect(result.success).toBe(false)
  })

  it("rejects negative marginPct", () => {
    const result = createMarginSchema.safeParse({ ...validMargin, marginPct: -1 })
    expect(result.success).toBe(false)
  })

  it("accepts marginPct of 0", () => {
    const result = createMarginSchema.safeParse({ ...validMargin, marginPct: 0 })
    expect(result.success).toBe(true)
  })

  it("accepts marginPct of 1000", () => {
    const result = createMarginSchema.safeParse({ ...validMargin, marginPct: 1000 })
    expect(result.success).toBe(true)
  })

  it("rejects marginPct greater than 1000", () => {
    const result = createMarginSchema.safeParse({ ...validMargin, marginPct: 1001 })
    expect(result.success).toBe(false)
  })

  it("rejects invalid scopeId (not UUID)", () => {
    const result = createMarginSchema.safeParse({
      ...validMargin,
      scope: "PRODUCT",
      scopeId: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid UUID scopeId", () => {
    const result = createMarginSchema.safeParse({
      ...validMargin,
      scope: "PRODUCT",
      scopeId: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it("defaults priority to 0", () => {
    const result = createMarginSchema.safeParse(validMargin)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.priority).toBe(0)
  })

  it("defaults isActive to true", () => {
    const result = createMarginSchema.safeParse(validMargin)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isActive).toBe(true)
  })

  it("accepts valid ISO datetime for validFrom", () => {
    const result = createMarginSchema.safeParse({
      ...validMargin,
      validFrom: "2024-01-01T00:00:00.000Z",
    })
    expect(result.success).toBe(true)
  })

  it("rejects non-datetime validFrom", () => {
    const result = createMarginSchema.safeParse({ ...validMargin, validFrom: "2024-01-01" })
    expect(result.success).toBe(false)
  })

  it("rejects notes longer than 1000 chars", () => {
    const result = createMarginSchema.safeParse({ ...validMargin, notes: "X".repeat(1001) })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateMarginSchema (partial)
// ---------------------------------------------------------------------------
describe("updateMarginSchema", () => {
  it("accepts an empty object", () => {
    const result = updateMarginSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts partial update with only marginPct", () => {
    const result = updateMarginSchema.safeParse({ marginPct: 25 })
    expect(result.success).toBe(true)
  })

  it("still rejects invalid marginPct when provided", () => {
    const result = updateMarginSchema.safeParse({ marginPct: -5 })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// simulatePriceSchema
// ---------------------------------------------------------------------------
describe("simulatePriceSchema", () => {
  const validInput = {
    purchasePrice: 100,
    marginPct: 30,
    vatRate: 20,
  }

  it("accepts valid simulate input", () => {
    const result = simulatePriceSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("rejects zero purchasePrice", () => {
    const result = simulatePriceSchema.safeParse({ ...validInput, purchasePrice: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects negative purchasePrice", () => {
    const result = simulatePriceSchema.safeParse({ ...validInput, purchasePrice: -10 })
    expect(result.success).toBe(false)
  })

  it("rejects vatRate above 100", () => {
    const result = simulatePriceSchema.safeParse({ ...validInput, vatRate: 101 })
    expect(result.success).toBe(false)
  })

  it("accepts vatRate of 0 (zero-rated)", () => {
    const result = simulatePriceSchema.safeParse({ ...validInput, vatRate: 0 })
    expect(result.success).toBe(true)
  })

  it("defaults vatRate to 20 when omitted", () => {
    const result = simulatePriceSchema.safeParse({ purchasePrice: 100, marginPct: 30 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.vatRate).toBe(20)
  })

  it("rejects marginPct greater than 1000", () => {
    const result = simulatePriceSchema.safeParse({ ...validInput, marginPct: 1001 })
    expect(result.success).toBe(false)
  })
})
