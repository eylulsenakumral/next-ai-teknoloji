import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, formatNumber } from "./format"

describe("formatCurrency", () => {
  it("formats TRY amounts with Turkish locale", () => {
    const result = formatCurrency(1234.56, "TRY")
    // Turkish lira symbol and locale formatting
    expect(result).toContain("1.234,56")
    expect(result).toMatch(/TL|₺/)
  })

  it("formats USD amounts with US locale by default", () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain("1,234.56")
    expect(result).toContain("$")
  })

  it("formats USD explicitly", () => {
    const result = formatCurrency(999.99, "USD")
    expect(result).toContain("999.99")
    expect(result).toContain("$")
  })

  it("formats zero correctly", () => {
    const usd = formatCurrency(0)
    expect(usd).toContain("0.00")

    const try_ = formatCurrency(0, "TRY")
    expect(try_).toContain("0,00")
  })

  it("formats large numbers with grouping separators", () => {
    const result = formatCurrency(1000000, "TRY")
    // expect grouping: 1.000.000
    expect(result).toContain("1.000.000")
  })

  it("always shows exactly 2 decimal places", () => {
    // Whole number — must still show ,00 / .00
    const usd = formatCurrency(50, "USD")
    expect(usd).toContain("50.00")

    const trY = formatCurrency(50, "TRY")
    expect(trY).toContain("50,00")
  })

  it("formats EUR amounts", () => {
    const result = formatCurrency(500, "EUR")
    expect(result).toContain("500.00")
    expect(result).toMatch(/€|EUR/)
  })

  it("handles negative amounts", () => {
    const result = formatCurrency(-100, "USD")
    expect(result).toContain("100.00")
    expect(result).toContain("-")
  })
})

describe("formatDate", () => {
  it("formats a Date object using Turkish locale", () => {
    const date = new Date(2024, 0, 15) // 15 January 2024
    const result = formatDate(date)
    expect(result).toContain("2024")
    expect(result).toContain("15")
    // Turkish month name
    expect(result.toLowerCase()).toContain("ocak")
  })

  it("accepts an ISO string", () => {
    const result = formatDate("2024-06-01T00:00:00.000Z")
    expect(result).toContain("2024")
    // June = Haziran in Turkish
    expect(result.toLowerCase()).toContain("haziran")
  })

  it("formats December correctly", () => {
    const result = formatDate(new Date(2023, 11, 25))
    expect(result.toLowerCase()).toContain("aralık")
  })

  it("zero-pads day to 2 digits", () => {
    const result = formatDate(new Date(2024, 2, 5)) // 5 March 2024
    // "05" expected because minimumIntegerDigits = 2
    expect(result).toMatch(/05/)
  })
})

describe("formatNumber", () => {
  it("formats integers with Turkish grouping", () => {
    const result = formatNumber(1234567)
    expect(result).toBe("1.234.567")
  })

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0")
  })

  it("formats small numbers without separator", () => {
    expect(formatNumber(999)).toBe("999")
  })

  it("formats negative numbers", () => {
    const result = formatNumber(-5000)
    expect(result).toContain("5.000")
    expect(result).toContain("-")
  })

  it("formats floating point numbers", () => {
    const result = formatNumber(1234.5)
    expect(result).toContain("1.234")
  })
})
