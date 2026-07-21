// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// Mock next modules
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
  default: (props: Record<string, unknown>) => (
    <img
      src={props.src as string}
      alt={props.alt as string}
      data-testid="next-image"
    />
  ),
}))

/* ------------------------------------------------------------------ */
/*  Task #17: Static Pages                                              */
/* ------------------------------------------------------------------ */

/* ── Hakkinda (About) Page ── */
// /hakkinda silindi (duplicate of /hakkimizda). Test bloğu skip.

describe.skip("Hakkinda Page", () => {
  let HakkindaPage: () => React.JSX.Element

  beforeAll(async () => {
    HakkindaPage = () => null as unknown as React.JSX.Element
  })

  it("renders page heading", () => {
    render(<HakkindaPage />)
    expect(
      screen.getByRole("heading", { level: 1 })
    ).toBeInTheDocument()
  })

  it("renders company profile with mission/vision", () => {
    render(<HakkindaPage />)
    expect(screen.getByText(/Misyonumuz/i)).toBeInTheDocument()
  })

  it("renders team member cards (at least 3)", () => {
    render(<HakkindaPage />)
    const teamCards = screen.getAllByTestId("team-member-card")
    expect(teamCards.length).toBeGreaterThanOrEqual(3)
  })

  it("renders stats section with 4 stat items", () => {
    render(<HakkindaPage />)
    const stats = screen.getAllByTestId("stat-item")
    expect(stats.length).toBe(4)
  })

  it("renders CTA button linking to iletisim", () => {
    render(<HakkindaPage />)
    const ctaLink = screen.getByRole("link", { name: /bize.*ulasin|iletisim/i })
    expect(ctaLink).toHaveAttribute("href", "/iletisim")
  })

  it("uses max-w-[1000px] container", () => {
    const { container } = render(<HakkindaPage />)
    expect(container.querySelector("[class*='max-w']")).toBeInTheDocument()
  })

  it("has proper text color (foreground)", () => {
    const { container } = render(<HakkindaPage />)
    expect(container.querySelector("[class*='1e1e1e']")).toBeInTheDocument()
  })
})

/* ── Iletisim (Contact) Page ── */
// Not: /iletisim sayfasi kaldirildi (AGENTS.md ACIL DURUM notu).
// Bu describe bloğu referans modül olmadigi icin skip edildi.

describe.skip("Iletisim Page", () => {
  let IletisimPage: () => React.JSX.Element

  beforeAll(async () => {
    // Sayfa kaldirildi — import yine de kaldirildi, skip blok calismaz
    IletisimPage = () => null as unknown as React.JSX.Element
  })

  it("renders page heading", () => {
    render(<IletisimPage />)
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })

  it("renders contact form with required fields", () => {
    render(<IletisimPage />)
    expect(screen.getByLabelText(/isim|ad/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email|e-posta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/konu|subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mesaj/i)).toBeInTheDocument()
  })

  it("renders optional phone field", () => {
    render(<IletisimPage />)
    expect(screen.getByLabelText(/telefon|phone/i)).toBeInTheDocument()
  })

  it("renders submit button", () => {
    render(<IletisimPage />)
    expect(screen.getByRole("button", { name: /gonder|submit/i })).toBeInTheDocument()
  })

  it("renders contact info: address, phone, email", () => {
    render(<IletisimPage />)
    expect(screen.getByText(/adres|address/i)).toBeInTheDocument()
    expect(screen.getByText(/0 552 989 5959/)).toBeInTheDocument()
    expect(screen.getByText(/info@next-ai.com.tr/)).toBeInTheDocument()
  })

  it("renders working hours", () => {
    render(<IletisimPage />)
    expect(screen.getByText(/09:00.*18:00|9:00.*18:00/)).toBeInTheDocument()
  })

  it("validates required fields on submit", () => {
    render(<IletisimPage />)
    const submitButton = screen.getByRole("button", { name: /gonder|submit/i })
    fireEvent.click(submitButton)
    // Form should have required attributes
    const emailInput = screen.getByLabelText(/email|e-posta/i)
    expect(emailInput).toHaveAttribute("required")
  })

  it("renders social links", () => {
    render(<IletisimPage />)
    const socialLinks = screen.getAllByTestId("social-link")
    expect(socialLinks.length).toBeGreaterThanOrEqual(2)
  })
})

/* ── Gizlilik Politikasi (Privacy Policy) Page ── */

describe("Gizlilik Politikasi Page", () => {
  let GizlilikPage: () => React.JSX.Element

  beforeAll(async () => {
    const mod = await import("./gizlilik-politikasi/page")
    GizlilikPage = mod.default
  })

  it("renders page heading", () => {
    render(<GizlilikPage />)
    expect(
      screen.getByRole("heading", { name: /Gizlilik Politikasi/i })
    ).toBeInTheDocument()
  })

  it("renders content with 500+ words", () => {
    const { container } = render(<GizlilikPage />)
    const text = container.textContent || ""
    const wordCount = text.split(/\s+/).filter(Boolean).length
    expect(wordCount).toBeGreaterThanOrEqual(500)
  })

  it("mentions KVKK (Turkish data protection law)", () => {
    const { container } = render(<GizlilikPage />)
    expect(container.textContent).toContain("KVKK")
  })

  it("mentions GDPR", () => {
    const { container } = render(<GizlilikPage />)
    expect(container.textContent).toContain("GDPR")
  })

  it("has sections for data collection, usage, protection", () => {
    render(<GizlilikPage />)
    expect(screen.getByText(/Kisisel Veri Toplama ve Isleme/i)).toBeInTheDocument()
    expect(screen.getByText(/Veri Kullanim Amaclari/i)).toBeInTheDocument()
    expect(screen.getByText(/Veri Koruma ve Guvenlik Onlemleri/i)).toBeInTheDocument()
  })

  it("has cookie policy section", () => {
    render(<GizlilikPage />)
    expect(screen.getByText(/Cerez.*Politikasi|Cookie/i)).toBeInTheDocument()
  })

  it("uses proper text styling", () => {
    const { container } = render(<GizlilikPage />)
    expect(container.querySelector("[class*='1e1e1e']")).toBeInTheDocument()
  })

  it("uses max-w-[1000px] container", () => {
    const { container } = render(<GizlilikPage />)
    expect(container.querySelector("[class*='max-w']")).toBeInTheDocument()
  })
})

/* ── Kullanim Sartlari (Terms of Service) Page ── */

describe("Kullanim Sartlari Page", () => {
  let KullanimPage: () => React.JSX.Element

  beforeAll(async () => {
    const mod = await import("./kullanim-sartlari/page")
    KullanimPage = mod.default
  })

  it("renders page heading", () => {
    render(<KullanimPage />)
    expect(
      screen.getByRole("heading", { name: /Kullanim Sartlari/i })
    ).toBeInTheDocument()
  })

  it("renders content with 400+ words", () => {
    const { container } = render(<KullanimPage />)
    const text = container.textContent || ""
    const wordCount = text.split(/\s+/).filter(Boolean).length
    expect(wordCount).toBeGreaterThanOrEqual(400)
  })

  it("has return policy section (14 days)", () => {
    const { container } = render(<KullanimPage />)
    expect(container.textContent).toContain("14 gun")
  })

  it("has warranty info section", () => {
    render(<KullanimPage />)
    expect(screen.getByText(/Garanti Bilgileri/i)).toBeInTheDocument()
  })

  it("has dispute resolution section", () => {
    render(<KullanimPage />)
    expect(screen.getByText(/Uyusmazlik Cozumu/i)).toBeInTheDocument()
  })

  it("has refund process section", () => {
    render(<KullanimPage />)
    expect(screen.getByText(/Iade Sureci ve Geri Odeme/i)).toBeInTheDocument()
  })

  it("has user responsibilities section", () => {
    render(<KullanimPage />)
    expect(screen.getByText(/Kullanici Sorumluluklari/i)).toBeInTheDocument()
  })

  it("uses proper text styling", () => {
    const { container } = render(<KullanimPage />)
    expect(container.querySelector("[class*='1e1e1e']")).toBeInTheDocument()
  })
})
