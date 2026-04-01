import { describe, it, expect } from "vitest"
import { createBrandSchema, updateBrandSchema } from "./brand"

describe("createBrandSchema", () => {
  const validInput = {
    name: "Samsung",
    isActive: true,
    sortOrder: 0,
  }

  it("accepts a minimal valid brand", () => {
    const result = createBrandSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("accepts a full valid brand", () => {
    const result = createBrandSchema.safeParse({
      name: "Apple",
      slug: "apple",
      logoUrl: "https://apple.com/logo.png",
      description: "Technology company",
      websiteUrl: "https://apple.com",
      isActive: true,
      sortOrder: 1,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createBrandSchema.safeParse({ ...validInput, name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects name longer than 200 characters", () => {
    const result = createBrandSchema.safeParse({ ...validInput, name: "A".repeat(201) })
    expect(result.success).toBe(false)
  })

  it("accepts name of exactly 200 characters", () => {
    const result = createBrandSchema.safeParse({ ...validInput, name: "A".repeat(200) })
    expect(result.success).toBe(true)
  })

  it("rejects invalid logoUrl", () => {
    const result = createBrandSchema.safeParse({ ...validInput, logoUrl: "not-a-url" })
    expect(result.success).toBe(false)
  })

  it("accepts empty string for logoUrl", () => {
    const result = createBrandSchema.safeParse({ ...validInput, logoUrl: "" })
    expect(result.success).toBe(true)
  })

  it("accepts undefined logoUrl", () => {
    const result = createBrandSchema.safeParse({ ...validInput, logoUrl: undefined })
    expect(result.success).toBe(true)
  })

  it("rejects invalid websiteUrl", () => {
    const result = createBrandSchema.safeParse({ ...validInput, websiteUrl: "badurl" })
    expect(result.success).toBe(false)
  })

  it("accepts empty string for websiteUrl", () => {
    const result = createBrandSchema.safeParse({ ...validInput, websiteUrl: "" })
    expect(result.success).toBe(true)
  })

  it("defaults isActive to true", () => {
    const result = createBrandSchema.safeParse({ name: "TestBrand" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isActive).toBe(true)
  })

  it("defaults sortOrder to 0", () => {
    const result = createBrandSchema.safeParse({ name: "TestBrand" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sortOrder).toBe(0)
  })
})

describe("updateBrandSchema", () => {
  it("accepts a partial update with only name", () => {
    const result = updateBrandSchema.safeParse({ name: "NewName" })
    expect(result.success).toBe(true)
  })

  it("accepts an empty object (all fields optional)", () => {
    const result = updateBrandSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("still rejects invalid URL when provided", () => {
    const result = updateBrandSchema.safeParse({ logoUrl: "not-a-url" })
    expect(result.success).toBe(false)
  })

  it("accepts a valid URL when provided", () => {
    const result = updateBrandSchema.safeParse({ logoUrl: "https://cdn.example.com/logo.png" })
    expect(result.success).toBe(true)
  })
})
