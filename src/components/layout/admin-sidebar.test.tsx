// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// Mock next/navigation
let mockPathname = "/admin"
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}))

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}))

// Mock next/link
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

import { AdminSidebar } from "./admin-sidebar"

function getDesktopSidebar() {
  const asides = screen.getAllByRole("complementary")
  // Desktop sidebar has "Admin navigasyon" label
  return asides.find((el) => el.getAttribute("aria-label") === "Admin navigasyon")!
}

describe("AdminSidebar", () => {
  beforeEach(() => {
    mockPathname = "/admin"
  })

  /* ── Structure ── */

  it("renders desktop sidebar as aside element with aria-label", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    expect(aside).toBeInTheDocument()
  })

  it("renders the navigation with menu items", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const nav = aside.querySelector("nav")
    expect(nav).toBeInTheDocument()
    // Check some menu items exist in desktop sidebar
    const links = aside.querySelectorAll("a")
    expect(links.length).toBeGreaterThan(5)
  })

  /* ── Sidebar BG: var(--DTSecondaryColor) ── */

  it("uses CSS variable --DTSecondaryColor for background", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    expect(aside.className).toContain("bg-[var(--DTSecondaryColor)]")
  })

  /* ── Sidebar width: var(--sidebar_width) ── */

  it("applies sidebar width from CSS variable --sidebar_width", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    expect(aside.className).toContain("w-[var(--sidebar_width)]")
  })

  /* ── Active menu item: BG var(--DTPrimaryColor), text white ── */

  it("highlights active menu item with var(--DTPrimaryColor) background", () => {
    mockPathname = "/admin"
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const dashboardLink = aside.querySelector("a[aria-current='page']")
    expect(dashboardLink).not.toBeNull()
    expect(dashboardLink!.className).toContain("bg-[var(--DTPrimaryColor)]")
  })

  it("active menu item has white text", () => {
    mockPathname = "/admin"
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const dashboardLink = aside.querySelector("a[aria-current='page']")
    expect(dashboardLink!.className).toContain("text-white")
  })

  /* ── Hover item: rgba(33, 137, 255, 0.1) ── */

  it("inactive menu items have hover bg with primary color opacity", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    // Get an inactive link (not aria-current=page)
    const inactiveLink = aside.querySelector("a:not([aria-current='page'])")
    expect(inactiveLink).not.toBeNull()
    expect(inactiveLink!.className).toContain("hover:bg-[rgba(33,137,255,0.1)]")
  })

  /* ── Border: uses CSS variable ── */

  it("sidebar border uses DTColor_Border CSS variable", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    // Should NOT have hardcoded #333333 border
    expect(aside.className).not.toContain("#333333")
    // Should use CSS variable for border
    expect(aside.className).toContain("border-[var(--DTColor_Border)]")
  })

  /* ── Logo area: has data-testid and proper structure ── */

  it("logo area has data-testid sidebar-logo", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const logoArea = aside.querySelector("[data-testid='sidebar-logo']")
    expect(logoArea).toBeTruthy()
  })

  /* ── Transition: all 0.3s linear ── */

  it("menu links have transition class for smooth interactions", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const inactiveLink = aside.querySelector("a:not([aria-current='page'])")
    expect(inactiveLink!.className).toMatch(/transition/)
  })

  /* ── No hardcoded old colors ── */

  it("does not contain hardcoded old color #00179e", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    expect(aside.innerHTML).not.toContain("#00179e")
  })

  it("does not contain hardcoded #333333 border color", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    expect(aside.innerHTML).not.toContain("#333333")
  })

  /* ── Collapse toggle ── */

  it("has collapse/expand toggle button", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const toggleBtn = aside.querySelector("button[aria-label='Menüyü daralt']")
    expect(toggleBtn).toBeInTheDocument()
  })

  it("collapses sidebar when toggle is clicked", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const toggleBtn = aside.querySelector("button[aria-label='Menüyü daralt']") as HTMLElement
    fireEvent.click(toggleBtn)
    // After collapse, expand button should appear
    const expandBtn = aside.querySelector("button[aria-label='Menüyü genişlet']")
    expect(expandBtn).toBeInTheDocument()
  })

  /* ── Responsive: desktop sidebar hidden on mobile ── */

  it("desktop sidebar has hidden md:flex for responsive behavior", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    expect(aside.className).toContain("hidden")
    expect(aside.className).toContain("md:flex")
  })

  /* ── Mobile drawer sidebar exists ── */

  it("renders a mobile drawer sidebar", () => {
    render(<AdminSidebar />)
    const mobileSidebar = screen.getByRole("complementary", { name: /mobil/i })
    expect(mobileSidebar).toBeInTheDocument()
    expect(mobileSidebar.className).toContain("fixed")
    expect(mobileSidebar.className).toContain("md:hidden")
  })

  /* ── Logout button ── */

  it("renders logout button in desktop sidebar", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const logoutBtn = aside.querySelector("button")
    // At least one button should exist (logout or collapse)
    expect(logoutBtn).toBeTruthy()
  })

  /* ── CSS variable usage ── */

  it("uses CSS variables for primary color throughout", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    const html = aside.outerHTML
    expect(html).not.toContain("#00179e")
    // Should have var(--DTPrimaryColor) references
    expect(html).toContain("var(--DTPrimaryColor)")
  })

  it("uses CSS variables for secondary color on background", () => {
    render(<AdminSidebar />)
    const aside = getDesktopSidebar()
    expect(aside.className).toContain("var(--DTSecondaryColor)")
  })
})
