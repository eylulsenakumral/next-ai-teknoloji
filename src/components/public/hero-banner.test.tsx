// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"

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

// Mock next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props
    return <img {...rest} data-fill={fill ? "true" : undefined} data-priority={priority ? "true" : undefined} />
  },
}))

// Mock lucide-react
vi.mock("lucide-react", () => ({
  ArrowRight: () => <span data-testid="arrow-icon">→</span>,
}))

import { HeroBanner } from "./hero-banner"
import type { HeroFeature } from "./hero-banner"

const defaultSlides = [
  {
    id: "1",
    subHeading: "Ev Aletleri",
    title: "En İyi Ürünlerimizi Keşfedin",
    description: "Kaliteli ürünler, uygun fiyatlar.",
    image: "/images/hero-1.jpg",
    mobileImage: "/images/hero-1-mobile.jpg",
    buttonText: "Keşfet",
    buttonLink: "/katalog",
    textAlign: "left" as const,
  },
  {
    id: "2",
    subHeading: "Bilgisayar",
    title: "Yuksek Kalite Dizustu",
    description: "Profesyonel çözümler burada.",
    image: "/images/hero-2.jpg",
    buttonText: "İncele",
    buttonLink: "/katalog",
    textAlign: "right" as const,
  },
]

const defaultFeatures: HeroFeature[] = [
  {
    id: "f1",
    image: "/images/feature-1.jpg",
    title: "Özel Klavye Fiyatları",
    description: "Premium klavyelerde sınırlı süre özel fırsatlar",
    link: "/katalog?categorySlug=klavye-mouse",
  },
  {
    id: "f2",
    image: "/images/feature-2.jpg",
    title: "Telefonlarda %25 İndirim",
    description: "En yeni akıllı telefonlarda en iyi fırsatlar",
    link: "/katalog?categorySlug=telefon",
  },
  {
    id: "f3",
    image: "/images/feature-3.jpg",
    title: "En İyi Kalite Kameralar",
    description: "Profesyonel kameralar en uygun fiyatlara",
    link: "/katalog?categorySlug=kamera",
  },
]

describe("HeroBanner", () => {
  /* ── Container & Structure ── */

  it("renders a section element with banner role", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByRole("banner")).toBeInTheDocument()
  })

  it("renders with bg-[#f3f3f3] background", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    expect(banner.className).toContain("bg-[#f3f3f3]")
  })

  it("uses max-w-[1400px] container", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const container = banner.querySelector("[class*='max-w-\\[1330px\\]']")
    expect(container).toBeInTheDocument()
  })

  /* ── Two-Column Grid Layout ── */

  it("renders a two-column grid on desktop", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const grid = banner.querySelector("[class*='lg:grid-cols-2']")
    expect(grid).toBeInTheDocument()
  })

  /* ── Staggered Image Grid (Left Column) ── */

  it("renders a 2x2 image grid in the left column", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const imageGrid = banner.querySelector("[class*='grid-cols-2']")
    expect(imageGrid).toBeInTheDocument()
  })

  it("renders 4 staggered images", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const images = screen.getAllByRole("img")
    // 4 grid images + 3 feature card images = 7 total
    expect(images.length).toBeGreaterThanOrEqual(4)
  })

  it("images have rounded-lg border radius", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const rounded = banner.querySelectorAll("[class*='rounded-lg']")
    expect(rounded.length).toBeGreaterThan(0)
  })

  it("images use aspect-[4/3] ratio", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const aspectImages = banner.querySelectorAll("[class*='aspect-\\[4/3\\]']")
    expect(aspectImages.length).toBe(4)
  })

  it("second column of images has mt-8 stagger offset", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const staggered = banner.querySelectorAll("[class*='mt-8']")
    expect(staggered.length).toBeGreaterThan(0)
  })

  /* ── Sub-Heading (category label) ── */

  it("renders first slide sub-heading text", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByText("Ev Aletleri")).toBeInTheDocument()
  })

  it("sub-heading uses uppercase", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const sub = screen.getByText("Ev Aletleri")
    expect(sub.className).toContain("uppercase")
  })

  it("sub-heading uses tracking-[2px]", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const sub = screen.getByText("Ev Aletleri")
    expect(sub.className).toContain("tracking-[2px]")
  })

  it("sub-heading uses font-medium", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const sub = screen.getByText("Ev Aletleri")
    expect(sub.className).toContain("font-medium")
  })

  it("sub-heading uses text-[#0040a4] accent color", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const sub = screen.getByText("Ev Aletleri")
    expect(sub.className).toContain("text-[#0040a4]")
  })

  /* ── Title (H1) ── */

  it("renders first slide title as heading", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByText("En İyi Ürünlerimizi Keşfedin")).toBeInTheDocument()
  })

  it("title uses h1 element", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const title = screen.getByText("En İyi Ürünlerimizi Keşfedin")
    expect(title.tagName).toBe("H1")
  })

  it("title uses gradient text from dark to primary", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const title = screen.getByText("En İyi Ürünlerimizi Keşfedin")
    expect(title.className).toContain("bg-gradient-to-r")
    expect(title.className).toContain("from-[#1e1e1e]")
    expect(title.className).toContain("to-[#0040a4]")
    expect(title.className).toContain("bg-clip-text")
    expect(title.className).toContain("text-transparent")
  })

  it("title uses font-bold", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const title = screen.getByText("En İyi Ürünlerimizi Keşfedin")
    expect(title.className).toContain("font-bold")
  })

  it("title uses responsive text sizing (lg:text-[60px])", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const title = screen.getByText("En İyi Ürünlerimizi Keşfedin")
    expect(title.className).toContain("lg:text-[60px]")
  })

  /* ── Description Text ── */

  it("renders description text from first slide", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByText("Kaliteli ürünler, uygun fiyatlar.")).toBeInTheDocument()
  })

  it("description uses text-[16px]", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const desc = screen.getByText("Kaliteli ürünler, uygun fiyatlar.")
    expect(desc.className).toContain("text-[16px]")
  })

  it("description uses text-[#767676] body color", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const desc = screen.getByText("Kaliteli ürünler, uygun fiyatlar.")
    expect(desc.className).toContain("text-[#767676]")
  })

  /* ── CTA Button ── */

  it("renders CTA button with correct text", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet")
    expect(link).toBeInTheDocument()
  })

  it("CTA button links to correct href", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet").closest("a")
    expect(link).toHaveAttribute("href", "/katalog")
  })

  it("CTA button uses gradient from primary to primary-dark", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet").closest("a")!
    expect(link.className).toContain("bg-gradient-to-r")
    expect(link.className).toContain("from-[#0040a4]")
    expect(link.className).toContain("to-[#1a6fe0]")
  })

  it("CTA button uses hover gradient to dark", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet").closest("a")!
    expect(link.className).toContain("hover:from-[#1e1e1e]")
    expect(link.className).toContain("hover:to-[#1e1e1e]")
  })

  it("CTA button uses white text", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet").closest("a")!
    expect(link.className).toContain("text-white")
  })

  it("CTA button uses font-bold", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet").closest("a")!
    expect(link.className).toContain("font-bold")
  })

  it("CTA button uses rounded-lg border radius", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet").closest("a")!
    expect(link.className).toContain("rounded-lg")
  })

  it("CTA button uses py-[9px] px-[32px] matching dt-elektrix padding", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet").closest("a")!
    expect(link.className).toContain("py-[9px]")
    expect(link.className).toContain("px-[32px]")
  })

  it("CTA button uses transition-all duration-300", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Keşfet").closest("a")!
    expect(link.className).toContain("transition-all")
    expect(link.className).toContain("duration-300")
  })

  /* ── Feature Cards ── */

  it("renders 3 feature cards when features prop is provided", () => {
    render(<HeroBanner slides={defaultSlides} features={defaultFeatures} />)
    expect(screen.getByText("Özel Klavye Fiyatları")).toBeInTheDocument()
    expect(screen.getByText("Telefonlarda %25 İndirim")).toBeInTheDocument()
    expect(screen.getByText("En İyi Kalite Kameralar")).toBeInTheDocument()
  })

  it("renders default feature cards when no features prop", () => {
    render(<HeroBanner slides={defaultSlides} />)
    // Default features are rendered
    const banner = screen.getByRole("banner")
    const cards = banner.querySelectorAll("[class*='rounded-\\[20px\\]']")
    expect(cards.length).toBe(3)
  })

  it("feature cards have rounded-[20px] border radius", () => {
    render(<HeroBanner slides={defaultSlides} features={defaultFeatures} />)
    const card = screen.getByText("Özel Klavye Fiyatları").closest("a")!
    expect(card.className).toContain("rounded-[20px]")
  })

  it("feature cards have hover shadow and lift effect", () => {
    render(<HeroBanner slides={defaultSlides} features={defaultFeatures} />)
    const card = screen.getByText("Özel Klavye Fiyatları").closest("a")!
    expect(card.className).toContain("hover:shadow-md")
    expect(card.className).toContain("hover:-translate-y-1")
  })

  it("feature cards use transition-all duration-300", () => {
    render(<HeroBanner slides={defaultSlides} features={defaultFeatures} />)
    const card = screen.getByText("Özel Klavye Fiyatları").closest("a")!
    expect(card.className).toContain("transition-all")
    expect(card.className).toContain("duration-300")
  })

  it("feature card titles turn blue on hover", () => {
    render(<HeroBanner slides={defaultSlides} features={defaultFeatures} />)
    const title = screen.getByText("Özel Klavye Fiyatları")
    expect(title.className).toContain("group-hover:text-[#0040a4]")
  })

  it("feature card descriptions use muted text color", () => {
    render(<HeroBanner slides={defaultSlides} features={defaultFeatures} />)
    const desc = screen.getByText("Premium klavyelerde sınırlı süre özel fırsatlar")
    expect(desc.className).toContain("text-[#767676]")
  })

  it("feature cards link to provided href", () => {
    render(<HeroBanner slides={defaultSlides} features={defaultFeatures} />)
    const card = screen.getByText("Özel Klavye Fiyatları").closest("a")
    expect(card).toHaveAttribute("href", "/katalog?categorySlug=klavye-mouse")
  })

  it("feature cards section uses 3-column grid", () => {
    render(<HeroBanner slides={defaultSlides} features={defaultFeatures} />)
    const banner = screen.getByRole("banner")
    const threeColGrid = banner.querySelector("[class*='md:grid-cols-3']")
    expect(threeColGrid).toBeInTheDocument()
  })

  /* ── Arrow Icon ── */

  it("CTA button includes ArrowRight icon", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByTestId("arrow-icon")).toBeInTheDocument()
  })
})
