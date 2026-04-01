import { describe, it, expect } from "vitest"
import { createCategorySchema, updateCategorySchema } from "./category"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("createCategorySchema", () => {
  const validInput = {
    name: "Elektronik",
  }

  it("accepts a minimal valid category", () => {
    const result = createCategorySchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("accepts a full valid category", () => {
    const result = createCategorySchema.safeParse({
      name: "Bilgisayar",
      slug: "bilgisayar",
      parentId: VALID_UUID,
      description: "Tüm bilgisayar ürünleri",
      imageUrl: "https://cdn.example.com/category.jpg",
      isActive: true,
      sortOrder: 5,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createCategorySchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects name longer than 200 characters", () => {
    const result = createCategorySchema.safeParse({ name: "X".repeat(201) })
    expect(result.success).toBe(false)
  })

  it("accepts name of exactly 200 characters", () => {
    const result = createCategorySchema.safeParse({ name: "X".repeat(200) })
    expect(result.success).toBe(true)
  })

  it("rejects invalid parentId (not UUID)", () => {
    const result = createCategorySchema.safeParse({ name: "Cat", parentId: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("accepts null parentId (root category)", () => {
    const result = createCategorySchema.safeParse({ name: "Cat", parentId: null })
    expect(result.success).toBe(true)
  })

  it("accepts undefined parentId", () => {
    const result = createCategorySchema.safeParse({ name: "Cat" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid imageUrl", () => {
    const result = createCategorySchema.safeParse({ name: "Cat", imageUrl: "badurl" })
    expect(result.success).toBe(false)
  })

  it("accepts empty string for imageUrl", () => {
    const result = createCategorySchema.safeParse({ name: "Cat", imageUrl: "" })
    expect(result.success).toBe(true)
  })

  it("defaults isActive to true", () => {
    const result = createCategorySchema.safeParse({ name: "Cat" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isActive).toBe(true)
  })

  it("defaults sortOrder to 0", () => {
    const result = createCategorySchema.safeParse({ name: "Cat" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sortOrder).toBe(0)
  })
})

describe("updateCategorySchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = updateCategorySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts a partial update with only name", () => {
    const result = updateCategorySchema.safeParse({ name: "Yeni Kategori" })
    expect(result.success).toBe(true)
  })

  it("still rejects invalid URL when provided", () => {
    const result = updateCategorySchema.safeParse({ imageUrl: "bad-url" })
    expect(result.success).toBe(false)
  })
})
