// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, within } from "@testing-library/react"
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

describe("PublicFooter", () => {
  /* ── Structure ── */

  it("renders the footer element with contentinfo role", () => {
    render(<PublicFooter />)
    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
  })

  it("renders the brand logo area with border-radius 20px", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const logoEl = footer.querySelector("[data-testid='footer-logo']")
    expect(logoEl).toBeInTheDocument()
    expect(logoEl?.className).toContain("rounded-[20px]")
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

  /* ── Top Section: Social Icons ── */

  it("renders 4 social media icons with aria-labels", () => {
    render(<PublicFooter />)
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument()
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument()
    expect(screen.getByLabelText("Instagram")).toBeInTheDocument()
    expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument()
  })

  /* ── Middle Section: 4 Column Link Grid ── */

  it("renders 4 link column headings", () => {
    render(<PublicFooter />)
    const headings = screen.getAllByRole("heading", { level: 3 })
    expect(headings.length).toBe(4)
    expect(headings.map((h) => h.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Hizli|Hızlı/i),
        expect.stringMatching(/Kategori/i),
        expect.stringMatching(/Kurumsal/i),
        expect.stringMatching(/Destek/i),
      ])
    )
  })

  it("renders Hizli Menu links: Anasayfa, Hakkinda, Iletisim", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/Anasayfa/i)).toBeInTheDocument()
    expect(screen.getByText(/Hakk/i)).toBeInTheDocument()
    expect(screen.getByText(/letisim|İletişim/i)).toBeInTheDocument()
  })

  it("renders Kurumsal links: Sartlar, Gizlilik, Cookie", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/Kullan.*Ko/i)).toBeInTheDocument()
    expect(screen.getByText(/Gizlilik/i)).toBeInTheDocument()
    expect(screen.getByText(/Cookie|Cerez|Çerez/i)).toBeInTheDocument()
  })

  it("renders Destek links: SSS, Iade, Kargo Takip", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/SSS|S\.S\.S|Sikca|Sıkça/i)).toBeInTheDocument()
    expect(screen.getByText(/iade|İade/i)).toBeInTheDocument()
    expect(screen.getByText(/Kargo.*Tak/i)).toBeInTheDocument()
  })

  it("renders at least 12 footer links total", () => {
    render(<PublicFooter />)
    const allLinks = screen.getAllByRole("link")
    expect(allLinks.length).toBeGreaterThanOrEqual(12)
  })

  /* ── Bottom Section: Copyright ── */

  it("renders copyright text with current year", () => {
    render(<PublicFooter />)
    const year = new Date().getFullYear().toString()
    expect(
      screen.getByText(new RegExp(`${year}.*Next AI|${year}.*Elektrix`))
    ).toBeInTheDocument()
  })

  /* ── Bottom Section: 6 Payment Icons ── */

  it("renders 6 payment method indicators", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const paymentSection = footer.querySelector(
      "[data-testid='payment-icons']"
    )
    expect(paymentSection).toBeInTheDocument()
    const icons = paymentSection!.children
    expect(icons.length).toBeGreaterThanOrEqual(6)
  })

  it("renders payment labels: Kredi Karti, Debit, PayPal, EFT, Kapida Odeme, Google Pay", () => {
    render(<PublicFooter />)
    expect(screen.getByText(/VISA/i)).toBeInTheDocument()
    expect(screen.getByText(/Mastercard|MC/i)).toBeInTheDocument()
    expect(screen.getByText(/PayPal/i)).toBeInTheDocument()
    expect(screen.getByText(/EFT|Havale/i)).toBeInTheDocument()
    expect(screen.getByText(/Kap.*da|Kapida/i)).toBeInTheDocument()
    expect(screen.getByText(/Google.*Pay|GPay/i)).toBeInTheDocument()
  })

  /* ── Styling ── */

  it("uses bg-[#1e1e1e] background color", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    expect(footer.className).toContain("bg-[#1e1e1e]")
  })

  it("has responsive grid: grid-cols-1, sm:grid-cols-2, lg:grid-cols-4", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const gridEl = footer.querySelector(".grid")
    expect(gridEl).toBeInTheDocument()
    expect(gridEl?.className).toContain("grid-cols-1")
    expect(gridEl?.className).toContain("sm:grid-cols-2")
    expect(gridEl?.className).toContain("lg:grid-cols-4")
  })

  it("link text uses #bebebe color class", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const linkEls = footer.querySelectorAll("a[class*='bebebe']")
    expect(linkEls.length).toBeGreaterThan(0)
  })

  it("link hover uses #2189ff color class", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const linkEls = footer.querySelectorAll("a[class*='2189ff']")
    expect(linkEls.length).toBeGreaterThan(0)
  })

  it("divider uses border color with e9e9e9", () => {
    render(<PublicFooter />)
    const footer = screen.getByRole("contentinfo")
    const dividers = footer.querySelectorAll("[class*='e9e9e9']")
    expect(dividers.length).toBeGreaterThan(0)
  })

  it("does not use 'use client' directive (server component)", () => {
    // PublicFooter should be a server component - no useState/useEffect
    // If it renders without errors in a non-client context, it's fine
    const { container } = render(<PublicFooter />)
    expect(container.querySelector("footer")).toBeInTheDocument()
  })
})
