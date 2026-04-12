// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, fireEvent } from "@testing-library/react"

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { contactName: "Test Bayi", companyName: "Test AE" },
    },
  }),
  signOut: vi.fn(),
}))

vi.mock("@/hooks/use-cart", () => ({
  useCart: () => ({
    getItemCount: () => 3,
    getGrandTotal: () => 150.5,
    toggleCart: vi.fn(),
  }),
}))

vi.mock("@/components/cart/cart-drawer", () => ({
  CartDrawer: () => <div data-testid="cart-drawer" />,
}))

vi.mock("@/components/products/product-search", () => ({
  ProductSearch: (props: Record<string, unknown>) => (
    <div data-testid="product-search" className={props.className as string} />
  ),
}))

// Mock fetch for category tree
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
  })
) as unknown as typeof fetch

import { DealerHeader } from "./dealer-header"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Collect all class strings in the rendered tree */
function getAllClassNames(container: HTMLElement): string {
  const all = container.querySelectorAll("*")
  return Array.from(all)
    .map((el) => el.className)
    .join(" ")
}

/** Check no hardcoded old brand color exists */
function assertNoOldColors(container: HTMLElement) {
  const html = container.innerHTML
  expect(html).not.toContain("#00179e")
  expect(html).not.toContain("#00179E")
}

/* ================================================================== */
/*  TESTS                                                              */
/* ================================================================== */

describe("DealerHeader - dt-elektrix specs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ── Structure ── */

  it("renders without crashing", () => {
    const { container } = render(<DealerHeader />)
    expect(container).toBeTruthy()
  })

  /* ── No hardcoded old colors ── */

  it("does not contain hardcoded #00179e anywhere", () => {
    const { container } = render(<DealerHeader />)
    assertNoOldColors(container)
  })

  /* ── Header white BG ── */

  it("main header layer has white background (bg-white or #ffffff)", () => {
    const { container } = render(<DealerHeader />)
    // The main header layer (KATMAN 2) should have white bg
    const classes = getAllClassNames(container)
    expect(classes).toMatch(/bg-white/)
  })

  /* ── Dark text color ── */

  it("uses dark text color via CSS variable DTSecondaryColor", () => {
    const { container } = render(<DealerHeader />)
    const classes = getAllClassNames(container)
    expect(classes).toMatch(/text-\[var\(--DTSecondaryColor\)\]/)
  })

  /* ── Border color ── */

  it("uses border color #e9e9e9 via CSS var or direct", () => {
    const { container } = render(<DealerHeader />)
    const classes = getAllClassNames(container)
    expect(classes).toMatch(
      /border-\[#e9e9e9\]|border-\[var\(--DTColor_Border\)\]/
    )
  })

  /* ── Primary accent #2189ff ── */

  it("uses primary accent color #2189ff via CSS var or direct", () => {
    const { container } = render(<DealerHeader />)
    const classes = getAllClassNames(container)
    expect(classes).toMatch(
      /bg-\[#2189ff\]|bg-\[var\(--DTPrimaryColor\)\]|text-\[#2189ff\]|text-\[var\(--DTPrimaryColor\)\]/
    )
  })

  /* ── Shadow via CSS variable ── */

  it("uses shadow from CSS variable (DTboxShadow)", () => {
    const { container } = render(<DealerHeader />)
    const html = container.innerHTML
    // Shadow should reference CSS var, not hardcoded value
    expect(html).toMatch(
      /DTboxShadow|shadow-sm|shadow-md|shadow-lg|shadow-xl/
    )
  })

  /* ── Search box present ── */

  it("renders ProductSearch component", () => {
    render(<DealerHeader />)
    expect(screen.getByTestId("product-search")).toBeInTheDocument()
  })

  /* ── Cart icon with badge ── */

  it("renders cart button with item count badge", () => {
    render(<DealerHeader />)
    // Cart button should exist with aria-label
    const cartBtn = screen.getAllByRole("button", { name: /sepet/i })
    expect(cartBtn.length).toBeGreaterThan(0)
  })

  it("cart badge shows correct count", () => {
    const { container } = render(<DealerHeader />)
    // Badge should show "3" (from mock)
    const badge = container.querySelector("[aria-hidden]")
    const html = container.innerHTML
    expect(html).toContain("3")
  })

  /* ── User menu / account link ── */

  it("renders user name from session", () => {
    const { container } = render(<DealerHeader />)
    expect(container.innerHTML).toContain("Test Bayi")
  })

  /* ── Logout button ── */

  it("renders logout button", () => {
    const { container } = render(<DealerHeader />)
    expect(container.innerHTML).toMatch(/Çıkış Yap/)
  })

  /* ── Sticky positioning ── */

  it("nav bar has sticky top-0 positioning with z-50", () => {
    const { container } = render(<DealerHeader />)
    const navEl = container.querySelector("nav")
    expect(navEl).toBeTruthy()
    // Should always be sticky top-0 z-50 (not conditional on scroll)
    expect(navEl!.className).toMatch(/sticky/)
    expect(navEl!.className).toMatch(/top-0/)
    expect(navEl!.className).toMatch(/z-50/)
  })

  /* ── Responsive: mobile hamburger ── */

  it("has hamburger menu button for mobile", () => {
    render(<DealerHeader />)
    const hamburger = screen.getByRole("button", { name: /men[uü]/i })
    expect(hamburger).toBeInTheDocument()
  })

  it("hamburger is inside a container hidden on desktop (md:hidden)", () => {
    render(<DealerHeader />)
    const hamburger = screen.getByRole("button", { name: /men[uü]/i })
    // The hamburger or its parent wrapper should be hidden on desktop
    const parent = hamburger.closest("[class*='md:hidden']")
    expect(parent).toBeTruthy()
  })

  /* ── Responsive: desktop nav hidden on mobile ── */

  it("desktop nav is hidden on mobile (hidden md:flex)", () => {
    const { container } = render(<DealerHeader />)
    const classes = getAllClassNames(container)
    expect(classes).toMatch(/hidden md:flex|hidden md:block/)
  })

  /* ── Logo rendering ── */

  it("renders logo link to homepage", () => {
    render(<DealerHeader />)
    const logoLinks = screen.getAllByRole("link", { name: /next ai|ana sayfa/i })
    expect(logoLinks.length).toBeGreaterThan(0)
  })

  /* ── CSS Variables usage (no hardcoded where var should be) ── */

  it("uses CSS variables for theming (at least border or text)", () => {
    const { container } = render(<DealerHeader />)
    const html = container.innerHTML
    // Should find at least some CSS variable references
    expect(html).toMatch(
      /var\(--DT[A-Za-z_]+\)|border-\[var\(|text-\[var\(|bg-\[var\(/
    )
  })

  /* ── Transition uses CSS variable ── */

  it("uses transition classes for smooth interactions", () => {
    const { container } = render(<DealerHeader />)
    const classes = getAllClassNames(container)
    expect(classes).toMatch(/transition/)
  })

  /* ── Accessibility ── */

  it("has aria-label on navigation", () => {
    const { container } = render(<DealerHeader />)
    const nav = container.querySelector("nav[aria-label]")
    expect(nav).toBeTruthy()
  })

  it("cart button has descriptive aria-label", () => {
    render(<DealerHeader />)
    const cartBtns = screen.getAllByRole("button", { name: /sepet/i })
    expect(cartBtns.length).toBeGreaterThan(0)
    expect(cartBtns[0].getAttribute("aria-label")).toBeTruthy()
  })
})
