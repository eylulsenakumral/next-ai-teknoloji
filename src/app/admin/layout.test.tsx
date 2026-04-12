// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"

// Mock AdminSidebar
vi.mock("@/components/layout/admin-sidebar", () => ({
  AdminSidebar: () => <aside data-testid="admin-sidebar">Sidebar</aside>,
}))

// Mock AdminHeader
vi.mock("@/components/layout/admin-header", () => ({
  AdminHeader: () => <header data-testid="admin-header">Header</header>,
}))

import AdminLayout from "./layout"

describe("AdminLayout", () => {
  it("renders children content", () => {
    render(
      <AdminLayout>
        <div data-testid="child-content">Test Content</div>
      </AdminLayout>
    )
    expect(screen.getByTestId("child-content")).toBeInTheDocument()
  })

  it("renders the sidebar component", () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )
    expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument()
  })

  it("renders the header component", () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )
    expect(screen.getByTestId("admin-header")).toBeInTheDocument()
  })

  it("main content area has product bg color class", () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )
    // Main area should use #f3f3f3 background
    const main = screen.getByRole("main")
    expect(main.className).toMatch(/bg-\[var\(--DT_product_bg_color\)\]|bg-\[#f3f3f3\]/)
  })

  it("layout uses flex structure", () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )
    const wrapper = screen.getByTestId("admin-sidebar").parentElement
    expect(wrapper).toBeTruthy()
    expect(wrapper!.className).toContain("flex")
  })

  it("main content area has min-h-screen", () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    )
    const wrapper = screen.getByTestId("admin-sidebar").parentElement
    expect(wrapper!.className).toContain("min-h-screen")
  })
})
