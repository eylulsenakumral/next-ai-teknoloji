import { describe, it, expect } from "vitest"
import { createProductSchema, updateProductSchema, bulkUpdateSchema, productFilterSchema } from "./product"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"

// ---------------------------------------------------------------------------
// createProductSchema
// ---------------------------------------------------------------------------
describe("createProductSchema", () => {
  const validProduct = {
    name: "Samsung Galaxy S24",
  }

  it("accepts a minimal valid product", () => {
    const result = createProductSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
  })

  it("accepts a full valid product", () => {
    const result = createProductSchema.safeParse({
      name: "iPhone 15 Pro",
      brandId: VALID_UUID,
      categoryId: VALID_UUID,
      barcode: "1234567890123",
      sku: "IPHONE-15-PRO-128",
      description: "Apple iPhone 15 Pro 128GB",
      images: ["https://cdn.example.com/img1.jpg"],
      manualPrice: 49999.99,
      manualPriceCurrency: "TRY",
      weight: 0.187,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: true,
      unit: "ADET",
      minOrderQuantity: 1,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createProductSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects name longer than 500 chars", () => {
    const result = createProductSchema.safeParse({ name: "X".repeat(501) })
    expect(result.success).toBe(false)
  })

  it("accepts name of exactly 500 chars", () => {
    const result = createProductSchema.safeParse({ name: "X".repeat(500) })
    expect(result.success).toBe(true)
  })

  it("rejects invalid brandId (not UUID)", () => {
    const result = createProductSchema.safeParse({ name: "Product", brandId: "bad-id" })
    expect(result.success).toBe(false)
  })

  it("accepts null brandId", () => {
    const result = createProductSchema.safeParse({ name: "Product", brandId: null })
    expect(result.success).toBe(true)
  })

  it("rejects invalid image URL in images array", () => {
    const result = createProductSchema.safeParse({ name: "Product", images: ["not-a-url"] })
    expect(result.success).toBe(false)
  })

  it("accepts valid URL in images array", () => {
    const result = createProductSchema.safeParse({
      name: "Product",
      images: ["https://cdn.example.com/img.jpg"],
    })
    expect(result.success).toBe(true)
  })

  it("defaults images to empty array", () => {
    const result = createProductSchema.safeParse({ name: "Product" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.images).toEqual([])
  })

  it("rejects negative manualPrice", () => {
    const result = createProductSchema.safeParse({ name: "Product", manualPrice: -1 })
    expect(result.success).toBe(false)
  })

  it("accepts manualPrice of 0", () => {
    const result = createProductSchema.safeParse({ name: "Product", manualPrice: 0 })
    expect(result.success).toBe(true)
  })

  it("rejects invalid manualPriceCurrency", () => {
    const result = createProductSchema.safeParse({ name: "Product", manualPriceCurrency: "GBP" })
    expect(result.success).toBe(false)
  })

  it("accepts valid currency values", () => {
    for (const currency of ["TRY", "USD", "EUR"]) {
      const result = createProductSchema.safeParse({ name: "Product", manualPriceCurrency: currency })
      expect(result.success, `currency ${currency} should be valid`).toBe(true)
    }
  })

  it("rejects negative weight", () => {
    const result = createProductSchema.safeParse({ name: "Product", weight: -0.1 })
    expect(result.success).toBe(false)
  })

  it("rejects fractional warrantyMonths", () => {
    const result = createProductSchema.safeParse({ name: "Product", warrantyMonths: 12.5 })
    expect(result.success).toBe(false)
  })

  it("rejects invalid unit", () => {
    const result = createProductSchema.safeParse({ name: "Product", unit: "PIECE" })
    expect(result.success).toBe(false)
  })

  it("accepts all valid unit values", () => {
    for (const unit of ["ADET", "KUTU", "PAKET", "KOLI", "METRE", "KILOGRAM"]) {
      const result = createProductSchema.safeParse({ name: "Product", unit })
      expect(result.success, `unit ${unit} should be valid`).toBe(true)
    }
  })

  it("defaults isActive to true", () => {
    const result = createProductSchema.safeParse({ name: "Product" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isActive).toBe(true)
  })

  it("defaults minOrderQuantity to 1", () => {
    const result = createProductSchema.safeParse({ name: "Product" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.minOrderQuantity).toBe(1)
  })

  it("rejects minOrderQuantity of 0", () => {
    const result = createProductSchema.safeParse({ name: "Product", minOrderQuantity: 0 })
    expect(result.success).toBe(false)
  })

  it("accepts valid dimensions object", () => {
    const result = createProductSchema.safeParse({
      name: "Product",
      dimensions: { length: 10, width: 5, height: 3, unit: "cm" },
    })
    expect(result.success).toBe(true)
  })

  it("rejects negative dimension values", () => {
    const result = createProductSchema.safeParse({
      name: "Product",
      dimensions: { length: -1, width: 5, height: 3, unit: "cm" },
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// bulkUpdateSchema
// ---------------------------------------------------------------------------
describe("bulkUpdateSchema", () => {
  it("accepts a valid bulk update", () => {
    const result = bulkUpdateSchema.safeParse({
      ids: [VALID_UUID],
      action: "activate",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty ids array", () => {
    const result = bulkUpdateSchema.safeParse({ ids: [], action: "activate" })
    expect(result.success).toBe(false)
  })

  it("rejects ids with non-UUID values", () => {
    const result = bulkUpdateSchema.safeParse({ ids: ["not-uuid"], action: "activate" })
    expect(result.success).toBe(false)
  })

  it("accepts all valid actions", () => {
    for (const action of ["activate", "deactivate", "delete", "update_margin", "duplicate"]) {
      const result = bulkUpdateSchema.safeParse({ ids: [VALID_UUID], action })
      expect(result.success, `action ${action} should be valid`).toBe(true)
    }
  })

  it("rejects invalid action", () => {
    const result = bulkUpdateSchema.safeParse({ ids: [VALID_UUID], action: "archive" })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// productFilterSchema
// ---------------------------------------------------------------------------
describe("productFilterSchema", () => {
  it("accepts an empty object (all optional)", () => {
    const result = productFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("transforms isActive string 'true' to boolean true", () => {
    const result = productFilterSchema.safeParse({ isActive: "true" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isActive).toBe(true)
  })

  it("transforms isActive string 'false' to boolean false", () => {
    const result = productFilterSchema.safeParse({ isActive: "false" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isActive).toBe(false)
  })

  it("transforms isActive unknown string to undefined", () => {
    const result = productFilterSchema.safeParse({ isActive: "maybe" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isActive).toBeUndefined()
  })

  it("defaults page to 1 when omitted", () => {
    const result = productFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(1)
  })

  it("coerces page string to number and enforces minimum of 1", () => {
    const result = productFilterSchema.safeParse({ page: "0" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(1)
  })

  it("defaults limit to 25 when omitted", () => {
    const result = productFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(25)
  })

  it("clamps limit to maximum 100", () => {
    const result = productFilterSchema.safeParse({ limit: "500" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(100)
  })

  it("defaults sortBy to createdAt", () => {
    const result = productFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sortBy).toBe("createdAt")
  })

  it("defaults sortOrder to desc", () => {
    const result = productFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sortOrder).toBe("desc")
  })

  it("accepts valid sortBy values", () => {
    for (const sortBy of ["name", "createdAt", "updatedAt", "viewCount"]) {
      const result = productFilterSchema.safeParse({ sortBy })
      expect(result.success, `sortBy ${sortBy} should be valid`).toBe(true)
    }
  })
})
