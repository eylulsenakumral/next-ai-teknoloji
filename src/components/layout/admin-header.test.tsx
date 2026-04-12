// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}))

import { AdminHeader } from "./admin-header"

describe("AdminHeader", () => {
  /* ── Structure ── */

  it("renders a header element", () => {
    render(<AdminHeader />)
    const header = screen.getByRole("banner")
    expect(header).toBeInTheDocument()
  })

  /* ── BG: #ffffff ── */

  it("has white background", () => {
    render(<AdminHeader />)
    const header = screen.getByRole("banner")
    expect(header.className).toMatch(/bg-white|bg-\[#ffffff\]/)
  })

  /* ── Text: #1e1e1e ── */

  it("has dark text color", () => {
    render(<AdminHeader />)
    const header = screen.getByRole("banner")
    expect(header.className).toMatch(/text-\[var\(--DTSecondaryColor\)\]|text-\[#1e1e1e\]/)
  })

  /* ── Border bottom: 1px solid #e9e9e9 ── */

  it("has bottom border with DTColor_Border", () => {
    render(<AdminHeader />)
    const header = screen.getByRole("banner")
    expect(header.className).toMatch(/border-b/)
    expect(header.className).toMatch(/border-\[var\(--DTColor_Border\)\]|border-\[#e9e9e9\]/)
  })

  /* ── No hardcoded old colors ── */

  it("does not contain hardcoded #00179e", () => {
    render(<AdminHeader />)
    const header = screen.getByRole("banner")
    expect(header.innerHTML).not.toContain("#00179e")
  })

  /* ── Responsive mobile hamburger ── */

  it("has hamburger menu button for mobile", () => {
    render(<AdminHeader />)
    const hamburger = screen.getByRole("button", { name: /menü/i })
    expect(hamburger).toBeInTheDocument()
    // Should be visible on mobile, hidden on desktop
    expect(hamburger.className).toMatch(/md:hidden|lg:hidden/)
  })
})
