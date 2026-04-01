import { describe, it, expect } from "vitest"
import { generateSlug } from "./slug"

describe("generateSlug", () => {
  it("converts basic ASCII text to lowercase slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world")
  })

  it("replaces Turkish ğ → g", () => {
    expect(generateSlug("Dağ")).toBe("dag")
  })

  it("replaces Turkish ü → u", () => {
    expect(generateSlug("Üst")).toBe("ust")
  })

  it("replaces Turkish ş → s", () => {
    expect(generateSlug("Şeker")).toBe("seker")
  })

  it("replaces Turkish ı → i", () => {
    expect(generateSlug("Işık")).toBe("isik")
  })

  it("replaces Turkish ö → o", () => {
    expect(generateSlug("Öğrenci")).toBe("ogrenci")
  })

  it("replaces Turkish ç → c", () => {
    expect(generateSlug("Çiçek")).toBe("cicek")
  })

  it("handles a full Turkish sentence", () => {
    expect(generateSlug("Güneş Işığında Çalışmak")).toBe("gunes-isiginda-calismak")
  })

  it("replaces consecutive special characters with a single dash", () => {
    expect(generateSlug("Hello   World")).toBe("hello-world")
    expect(generateSlug("foo--bar")).toBe("foo-bar")
  })

  it("strips leading and trailing dashes", () => {
    expect(generateSlug("-hello-")).toBe("hello")
    expect(generateSlug(" hello ")).toBe("hello")
  })

  it("allows digits in slug", () => {
    expect(generateSlug("Product 123")).toBe("product-123")
    expect(generateSlug("iPhone 14 Pro")).toBe("iphone-14-pro")
  })

  it("removes punctuation and special characters", () => {
    expect(generateSlug("Hello, World!")).toBe("hello-world")
    expect(generateSlug("price: 100$")).toBe("price-100")
    expect(generateSlug("a/b/c")).toBe("a-b-c")
  })

  it("handles an empty string", () => {
    expect(generateSlug("")).toBe("")
  })

  it("handles a string of only special characters", () => {
    expect(generateSlug("---!!!---")).toBe("")
  })

  it("does not double-encode already lowercase ASCII", () => {
    expect(generateSlug("already-a-slug")).toBe("already-a-slug")
  })

  it("handles uppercase Turkish letters", () => {
    expect(generateSlug("ĞÜŞIÖÇ")).toBe("gusioc")
  })

  it("produces deterministic output for the same input", () => {
    const input = "Türkiye'nin En Büyük B2B Platformu"
    expect(generateSlug(input)).toBe(generateSlug(input))
  })

  it("handles mixed Latin and Turkish", () => {
    expect(generateSlug("SEO & Çözüm Merkezi")).toBe("seo-cozum-merkezi")
  })
})
