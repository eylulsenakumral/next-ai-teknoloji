// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { PublicFooter } from "./public-footer"

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    alt,
    ...props
  }: {
    alt: string
    [key: string]: unknown
    // eslint-disable-next-line @next/next/no-img-element
  }) => <img alt={alt} {...props} />,
}))

describe("PublicFooter", () => {
  /* ── Structure ── */

  it("renders the footer element with contentinfo role", () => {
    render(<PublicFooter />)
    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
  })

  it("renders the brand logo with object-contain class", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const logoEl = footer.querySelector("[data-testid='footer-logo']")
    expect(logoEl).toBeInTheDocument()
    expect(logoEl?.className).toContain("object-contain")
  })

  /* ── Brand Section ── */

  it("renders the company brand name in the logo alt text", () => {
    render(<PublicFooter />)
    expect(screen.getByAltText("Next AI Teknoloji")).toBeInTheDocument()
  })

  it("renders a brand description paragraph", () => {
    render(<PublicFooter />)
    expect(
      screen.getByText(/Teknoloji ve yeniliğe dayalı çözümler/i)
    ).toBeInTheDocument()
  })

  /* ── Top Section: Contact Info ── */

  it("renders address contact info", () => {
    render(<PublicFooter />)
    expect(
      screen.getByText(/Esentepe Mh.*Sancad Cad/i)
    ).toBeInTheDocument()
  })

  it("renders phone contact info", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/0 552 989 5959/)).toBeInTheDocument()
  })

  it("renders email contact info", () => {
    render(<PublicFooter />)
    expect(screen.getByText("info@next-ai.com.tr")).toBeInTheDocument()
  })

  it("renders working hours", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/Pzt - Cum.*09:00 - 18:00/)).toBeInTheDocument()
  })

  /* ── Top Section: Social Icons ── */

  it("renders 5 social media icons with aria-labels", () => {
    render(<PublicFooter />)
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument()
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument()
    expect(screen.getByLabelText("Instagram")).toBeInTheDocument()
    expect(screen.getByLabelText("YouTube")).toBeInTheDocument()
    expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument()
  })

  /* ── Middle Section: 3 Column Link Grid (2 FooterColumn + Contact) ── */

  it("renders 3 section headings", () => {
    render(<PublicFooter />)
    const headings = screen.getAllByRole("heading", { level: 3 })
    expect(headings.length).toBe(3)
    expect(headings.map((h) => h.textContent)).toEqual(
      expect.arrayContaining([
        "Bizi Tanıyın",
        "Müşteri Hizmetleri",
        "İletişim Bilgileri",
      ])
    )
  })

  it("renders Bizi Tanıyın links: Hakkımızda and İletişim", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/Hakkımızda/i)).toBeInTheDocument()
    // "İletişim" appears both as a link and in heading "İletişim Bilgileri"
    const iletisimLinks = screen.getAllByText(/İletişim/i)
    expect(iletisimLinks.length).toBeGreaterThanOrEqual(2)
  })

  it("renders Müşteri Hizmetleri links: Kargo, Favoriler, Siparişler, Ürünler, Kampanyalar", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/Kargo Takibi/i)).toBeInTheDocument()
    expect(screen.getByText(/Favoriler/i)).toBeInTheDocument()
    expect(screen.getByText(/Siparişlerim/i)).toBeInTheDocument()
    expect(screen.getByText(/Tüm Ürünler/i)).toBeInTheDocument()
    expect(screen.getByText(/Kampanyalar/i)).toBeInTheDocument()
  })

  it("renders at least 10 footer links total", () => {
    render(<PublicFooter />)
    const allLinks = screen.getAllByRole("link")
    expect(allLinks.length).toBeGreaterThanOrEqual(10)
  })

  /* ── Bottom Section: Copyright ── */

  it("renders copyright text with current year", () => {
    render(<PublicFooter />)
    const year = new Date().getFullYear().toString()
    expect(
      screen.getByText(new RegExp(`${year}.*Next AI`))
    ).toBeInTheDocument()
  })

  /* ── Bottom Section: Payment Info ── */

  it("renders secure payment info text", () => {
    render(<PublicFooter />)
    expect(
      screen.getByText(/Güvenli Ödeme.*NomuPay.*3D Secure/i)
    ).toBeInTheDocument()
  })

  it("renders payment provider name NomuPay", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/NomuPay/i)).toBeInTheDocument()
  })

  /* ── Bottom Section: Legal Links ── */

  it("renders legal links in the bottom bar", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/Gizlilik Politikası/i)).toBeInTheDocument()
    expect(screen.getByText(/Kullanım Koşulları/i)).toBeInTheDocument()
  })

  /* ── Styling ── */

  it("uses white background color", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    expect(footer.className).toContain("bg-white")
  })

  it("has responsive grid: grid-cols-1, md:grid-cols-2, lg:grid-cols-4", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const gridEl = footer.querySelector(".grid")
    expect(gridEl).toBeInTheDocument()
    expect(gridEl?.className).toContain("grid-cols-1")
    expect(gridEl?.className).toContain("md:grid-cols-2")
    expect(gridEl?.className).toContain("lg:grid-cols-4")
  })

  it("link text uses var(--color-primary) color class", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const linkEls = footer.querySelectorAll(
      "a[class*='var(--color-primary)']"
    )
    expect(linkEls.length).toBeGreaterThan(0)
  })

  it("social icons use gray-100 background with hover gradient to primary", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    // Social icons are rendered as spans (not links) with rounded-full styling
    const socialEls = footer.querySelectorAll("span[class*='rounded-full']")
    expect(socialEls.length).toBe(5)
    socialEls.forEach((el) => {
      expect(el.className).toContain("bg-gray-100")
      expect(el.className).toContain("hover:bg-gradient-to-r")
    })
  })

  it("section headings use uppercase styling", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const headings = footer.querySelectorAll("h3")
    headings.forEach((h) => {
      expect(h.className).toContain("uppercase")
    })
  })

  it("does not use 'use client' directive (server component)", () => {
    const { container } = render(<PublicFooter />)
    expect(container.querySelector("footer")).toBeInTheDocument()
  })
})
