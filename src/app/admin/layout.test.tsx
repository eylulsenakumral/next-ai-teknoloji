// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"

// Layout artık async server component — getServerSession ile admin guard içerir.
// Test ortamında admin session döndür ki guard redirect yapmadan render edilsin.
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: "admin-1", role: "admin" },
  }),
}))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

// Mock AdminSidebar
vi.mock("@/components/layout/admin-sidebar", () => ({
  AdminSidebar: () => <aside data-testid="admin-sidebar">Sidebar</aside>,
}))

// Mock AdminHeader
vi.mock("@/components/layout/admin-header", () => ({
  AdminHeader: () => <header data-testid="admin-header">Header</header>,
}))

import AdminLayout from "./layout"

async function renderLayout(children: ReactNode) {
  const ui = await AdminLayout({ children })
  return render(ui)
}

describe("AdminLayout", () => {
  it("renders children content", async () => {
    await renderLayout(<div data-testid="child-content">Test Content</div>)
    expect(screen.getByTestId("child-content")).toBeInTheDocument()
  })

  it("renders the sidebar component", async () => {
    await renderLayout(<div>Content</div>)
    expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument()
  })

  it("renders the header component", async () => {
    await renderLayout(<div>Content</div>)
    expect(screen.getByTestId("admin-header")).toBeInTheDocument()
  })

  it("main content area has product bg color class", async () => {
    await renderLayout(<div>Content</div>)
    const main = screen.getByRole("main")
    expect(main.className).toMatch(/bg-\[var\(--DT_product_bg_color\)\]|bg-\[#f3f3f3\]/)
  })

  it("layout uses flex structure", async () => {
    await renderLayout(<div>Content</div>)
    const wrapper = screen.getByTestId("admin-sidebar").parentElement
    expect(wrapper).toBeTruthy()
    expect(wrapper!.className).toContain("flex")
  })

  it("main content area has min-h-screen", async () => {
    await renderLayout(<div>Content</div>)
    const wrapper = screen.getByTestId("admin-sidebar").parentElement
    expect(wrapper!.className).toContain("min-h-screen")
  })
})
