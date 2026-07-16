// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { DealerFooter } from "./dealer-footer"

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

describe("DealerFooter", () => {
  /* ── Structure ── */

  it("renders the footer element with contentinfo role", () => {
    render(<DealerFooter />)
    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
  })

  it("renders the brand name", () => {
    render(<DealerFooter />)
    const matches = screen.getAllByText(/Next AI Teknoloji/i)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  /* ── Contact Info ── */

  it("renders address", () => {
    render(<DealerFooter />)
    expect(
      screen.getByText(/Esentepe Mh.*Sancad Cad/i)
    ).toBeInTheDocument()
  })

  it("renders phone numbers", () => {
    render(<DealerFooter />)
    expect(screen.getByText(/0 552 989 5959/)).toBeInTheDocument()
  })

  it("renders email", () => {
    render(<DealerFooter />)
    expect(screen.getByText("info@next-ai.com.tr")).toBeInTheDocument()
  })

  /* ── Social Icons ── */

  it("renders 4 social media icons", () => {
    render(<DealerFooter />)
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument()
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument()
    expect(screen.getByLabelText("Instagram")).toBeInTheDocument()
    expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument()
  })

  /* ── Bayi-Specific Link Columns ── */

  it("renders link column headings", () => {
    render(<DealerFooter />)
    const headings = screen.getAllByRole("heading", { level: 3 })
    expect(headings.length).toBeGreaterThanOrEqual(3)
  })

  it("renders bayi-specific links: Profil, Satis, Raporlar", () => {
    render(<DealerFooter />)
    expect(screen.getByText(/Profilim/i)).toBeInTheDocument()
    expect(screen.getByText(/Satis Yonetimi/i)).toBeInTheDocument()
    expect(screen.getByText(/Raporlar/i)).toBeInTheDocument()
  })

  it("renders bayi-specific links: Depo Yonetimi, Musteri Destek", () => {
    render(<DealerFooter />)
    expect(screen.getByText(/Depo.*Y.*netim|Stok/i)).toBeInTheDocument()
    expect(screen.getByText(/Musteri Destek|M.*teri.*Destek/i)).toBeInTheDocument()
  })

  it("renders at least 8 footer links total", () => {
    render(<DealerFooter />)
    const allLinks = screen.getAllByRole("link")
    expect(allLinks.length).toBeGreaterThanOrEqual(8)
  })

  /* ── Copyright ── */

  it("renders copyright text with current year", () => {
    render(<DealerFooter />)
    const year = new Date().getFullYear().toString()
    expect(
      screen.getByText(new RegExp(`${year}.*Next AI`))
    ).toBeInTheDocument()
  })

  /* ── Payment Icons ── */

  it("renders payment method indicators", () => {
    render(<DealerFooter />)
    const footer = screen.getByRole("contentinfo")
    const paymentSection = footer.querySelector(
      "[data-testid='payment-icons']"
    )
    expect(paymentSection).toBeInTheDocument()
  })

  /* ── Styling ── */

  it("uses bg-[var(--color-foreground)] background color", () => {
    render(<DealerFooter />)
    const footer = screen.getByRole("contentinfo")
    expect(footer.className).toContain("bg-[var(--color-foreground)]")
  })

  it("has responsive grid classes", () => {
    render(<DealerFooter />)
    const footer = screen.getByRole("contentinfo")
    const gridEl = footer.querySelector(".grid")
    expect(gridEl).toBeInTheDocument()
    expect(gridEl?.className).toContain("grid-cols-1")
    expect(gridEl?.className).toContain("sm:grid-cols-2")
    expect(gridEl?.className).toContain("lg:grid-cols-4")
  })

  it("does not have newsletter form (no use client state)", () => {
    render(<DealerFooter />)
    expect(screen.queryByRole("search")).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText(/e-posta/i)
    ).not.toBeInTheDocument()
  })

  it("link hover uses primary color class var(--color-primary)", () => {
    render(<DealerFooter />)
    const footer = screen.getByRole("contentinfo")
    const linkEls = footer.querySelectorAll("a[class*='2189ff']")
    expect(linkEls.length).toBeGreaterThan(0)
  })
})
