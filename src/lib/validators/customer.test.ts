import { describe, it, expect } from "vitest"
import {
  dealerApplicationSchema,
  updateCustomerSchema,
  balanceAdjustmentSchema,
  changePasswordSchema,
} from "./customer"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"

// ---------------------------------------------------------------------------
// dealerApplicationSchema
// ---------------------------------------------------------------------------
describe("dealerApplicationSchema", () => {
  const validApplication = {
    companyName: "Örnek Teknoloji A.Ş.",
    contactName: "Ahmet Yılmaz",
    phone: "05321234567",
    email: "ahmet@ornek.com",
    kvkkConsent: true,
  }

  it("accepts a valid minimal application", () => {
    const result = dealerApplicationSchema.safeParse(validApplication)
    expect(result.success).toBe(true)
  })

  it("accepts a full valid application", () => {
    const result = dealerApplicationSchema.safeParse({
      ...validApplication,
      taxOffice: "Kadıköy",
      taxNumber: "1234567890",
      address: "İstanbul, Kadıköy, Moda Caddesi No:1",
      city: "İstanbul",
      businessType: "Perakende",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing companyName", () => {
    const { companyName: _, ...rest } = validApplication
    const result = dealerApplicationSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects companyName shorter than 2 chars", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, companyName: "A" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, email: "invalid" })
    expect(result.success).toBe(false)
  })

  it("rejects phone shorter than 10 chars", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, phone: "0532" })
    expect(result.success).toBe(false)
  })

  it("rejects phone with invalid characters", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, phone: "abc1234567" })
    expect(result.success).toBe(false)
  })

  it("accepts phone with allowed special characters", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, phone: "+90 (532) 123-45-67" })
    expect(result.success).toBe(true)
  })

  it("rejects kvkkConsent = false", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, kvkkConsent: false })
    expect(result.success).toBe(false)
  })

  it("rejects taxNumber shorter than 10 chars", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, taxNumber: "12345" })
    expect(result.success).toBe(false)
  })

  it("rejects taxNumber with non-digit characters", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, taxNumber: "123456789A" })
    expect(result.success).toBe(false)
  })

  it("accepts empty string for optional taxNumber", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, taxNumber: "" })
    expect(result.success).toBe(true)
  })

  it("rejects address shorter than 10 chars", () => {
    const result = dealerApplicationSchema.safeParse({ ...validApplication, address: "Kısa" })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateCustomerSchema
// ---------------------------------------------------------------------------
describe("updateCustomerSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = updateCustomerSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts valid status values", () => {
    for (const status of ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "BLACKLISTED"]) {
      const result = updateCustomerSchema.safeParse({ status })
      expect(result.success, `status ${status} should be valid`).toBe(true)
    }
  })

  it("rejects invalid status value", () => {
    const result = updateCustomerSchema.safeParse({ status: "ACTIVE" })
    expect(result.success).toBe(false)
  })

  it("rejects negative creditLimit", () => {
    const result = updateCustomerSchema.safeParse({ creditLimit: -1 })
    expect(result.success).toBe(false)
  })

  it("accepts creditLimit of 0", () => {
    const result = updateCustomerSchema.safeParse({ creditLimit: 0 })
    expect(result.success).toBe(true)
  })

  it("rejects creditLimit above 10_000_000", () => {
    const result = updateCustomerSchema.safeParse({ creditLimit: 10_000_001 })
    expect(result.success).toBe(false)
  })

  it("rejects discountRate above 100", () => {
    const result = updateCustomerSchema.safeParse({ discountRate: 101 })
    expect(result.success).toBe(false)
  })

  it("accepts discountRate of 100", () => {
    const result = updateCustomerSchema.safeParse({ discountRate: 100 })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email when provided", () => {
    const result = updateCustomerSchema.safeParse({ email: "not-an-email" })
    expect(result.success).toBe(false)
  })

  it("accepts valid UUID priceListId", () => {
    const result = updateCustomerSchema.safeParse({ priceListId: VALID_UUID })
    expect(result.success).toBe(true)
  })

  it("rejects non-UUID priceListId", () => {
    const result = updateCustomerSchema.safeParse({ priceListId: "not-a-uuid" })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// balanceAdjustmentSchema
// ---------------------------------------------------------------------------
describe("balanceAdjustmentSchema", () => {
  const validAdjustment = {
    amount: 500,
    description: "Ödeme alındı",
    type: "PAYMENT" as const,
  }

  it("accepts a valid adjustment", () => {
    const result = balanceAdjustmentSchema.safeParse(validAdjustment)
    expect(result.success).toBe(true)
  })

  it("rejects amount of 0", () => {
    const result = balanceAdjustmentSchema.safeParse({ ...validAdjustment, amount: 0 })
    expect(result.success).toBe(false)
  })

  it("accepts negative amounts (debit)", () => {
    const result = balanceAdjustmentSchema.safeParse({ ...validAdjustment, amount: -100 })
    expect(result.success).toBe(true)
  })

  it("rejects amount exceeding 1_000_000", () => {
    const result = balanceAdjustmentSchema.safeParse({ ...validAdjustment, amount: 1_000_001 })
    expect(result.success).toBe(false)
  })

  it("accepts amount of exactly 1_000_000", () => {
    const result = balanceAdjustmentSchema.safeParse({ ...validAdjustment, amount: 1_000_000 })
    expect(result.success).toBe(true)
  })

  it("rejects description shorter than 3 chars", () => {
    const result = balanceAdjustmentSchema.safeParse({ ...validAdjustment, description: "AB" })
    expect(result.success).toBe(false)
  })

  it("accepts all valid type values", () => {
    for (const type of ["ADJUSTMENT", "OPENING_BALANCE", "PAYMENT", "REFUND"]) {
      const result = balanceAdjustmentSchema.safeParse({ ...validAdjustment, type })
      expect(result.success, `type ${type} should be valid`).toBe(true)
    }
  })

  it("rejects invalid type", () => {
    const result = balanceAdjustmentSchema.safeParse({ ...validAdjustment, type: "INVOICE" })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// changePasswordSchema
// ---------------------------------------------------------------------------
describe("changePasswordSchema", () => {
  const validChange = {
    currentPassword: "oldpassword",
    newPassword: "newpassword123",
    confirmPassword: "newpassword123",
  }

  it("accepts matching passwords", () => {
    const result = changePasswordSchema.safeParse(validChange)
    expect(result.success).toBe(true)
  })

  it("rejects when newPassword and confirmPassword do not match", () => {
    const result = changePasswordSchema.safeParse({ ...validChange, confirmPassword: "different" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain("confirmPassword")
    }
  })

  it("rejects newPassword shorter than 6 chars", () => {
    const result = changePasswordSchema.safeParse({
      ...validChange,
      newPassword: "abc",
      confirmPassword: "abc",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty currentPassword", () => {
    const result = changePasswordSchema.safeParse({ ...validChange, currentPassword: "" })
    expect(result.success).toBe(false)
  })

  it("rejects newPassword longer than 100 chars", () => {
    const longPass = "A".repeat(101)
    const result = changePasswordSchema.safeParse({
      ...validChange,
      newPassword: longPass,
      confirmPassword: longPass,
    })
    expect(result.success).toBe(false)
  })
})
