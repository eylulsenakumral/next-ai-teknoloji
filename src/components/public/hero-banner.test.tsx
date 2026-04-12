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

// Mock swiper/react
vi.mock("swiper/react", () => ({
  Swiper: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <div data-testid="swiper-container" data-autoplay-delay={
      typeof props.autoplay === "object" && props.autoplay !== null
        ? (props.autoplay as Record<string, unknown>).delay
        : undefined
    } data-loop={props.loop ? "true" : undefined} data-speed={props.speed}>
      {children}
    </div>
  ),
  SwiperSlide: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper-slide">{children}</div>
  ),
}))

// Mock swiper modules
vi.mock("swiper/modules", () => ({
  Navigation: "Navigation",
  Pagination: "Pagination",
  Autoplay: "Autoplay",
  EffectFade: "EffectFade",
}))

// Mock swiper CSS imports
vi.mock("swiper/css", () => ({}))
vi.mock("swiper/css/navigation", () => ({}))
vi.mock("swiper/css/pagination", () => ({}))
vi.mock("swiper/css/effect-fade", () => ({}))

import { HeroBanner } from "./hero-banner"

const defaultSlides = [
  {
    id: "1",
    subHeading: "Ev Aletleri",
    title: "En Iyi Urunlerimizi Kesfedin",
    description: "Kaliteli urunler, uygun fiyatlar.",
    image: "/images/hero-1.jpg",
    mobileImage: "/images/hero-1-mobile.jpg",
    buttonText: "Kesfet",
    buttonLink: "/katalog",
    textAlign: "left" as const,
  },
  {
    id: "2",
    subHeading: "Bilgisayar",
    title: "Yuksek Kalite Dizustu",
    description: "Profesyonel cozumler burada.",
    image: "/images/hero-2.jpg",
    buttonText: "Incele",
    buttonLink: "/katalog",
    textAlign: "right" as const,
  },
]

describe("HeroBanner", () => {
  /* ── Container & Structure ── */

  it("renders a section element with banner role", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByRole("banner")).toBeInTheDocument()
  })

  it("renders full-width container", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    expect(banner.className).toContain("w-full")
  })

  /* ── Swiper Carousel ── */

  it("initializes Swiper container", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByTestId("swiper-container")).toBeInTheDocument()
  })

  it("renders correct number of slides", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const slides = screen.getAllByTestId("swiper-slide")
    expect(slides).toHaveLength(2)
  })

  it("configures autoplay with 5000ms delay", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const swiper = screen.getByTestId("swiper-container")
    expect(swiper.getAttribute("data-autoplay-delay")).toBe("5000")
  })

  it("enables loop mode", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const swiper = screen.getByTestId("swiper-container")
    expect(swiper.getAttribute("data-loop")).toBe("true")
  })

  it("sets transition speed to 800ms", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const swiper = screen.getByTestId("swiper-container")
    expect(swiper.getAttribute("data-speed")).toBe("800")
  })

  /* ── Background Images ── */

  it("renders background images for each slide", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const images = screen.getAllByRole("img")
    expect(images.length).toBeGreaterThanOrEqual(2)
  })

  it("desktop image has fixed height h-[500px]", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const images = screen.getAllByRole("img")
    // First image is the desktop image of first slide
    const desktopImg = images[0]
    expect(desktopImg.className).toContain("h-[500px]")
  })

  it("images use object-cover class", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const images = screen.getAllByRole("img")
    expect(images[0].className).toContain("object-cover")
  })

  /* ── NO Dark Overlay (matches dt-elektrix rgba(0,0,0,0)) ── */

  it("does NOT render a dark overlay", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const overlays = banner.querySelectorAll("[class*='bg-black']")
    expect(overlays.length).toBe(0)
  })

  /* ── Sub-Heading (category label) ── */

  it("renders sub-heading text", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByText("Ev Aletleri")).toBeInTheDocument()
    expect(screen.getByText("Bilgisayar")).toBeInTheDocument()
  })

  it("sub-heading uses uppercase and tracking-[2px]", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const sub = screen.getByText("Ev Aletleri")
    expect(sub.className).toContain("uppercase")
    expect(sub.className).toContain("tracking-[2px]")
  })

  it("sub-heading uses font-medium (500)", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const sub = screen.getByText("Ev Aletleri")
    expect(sub.className).toContain("font-medium")
  })

  it("sub-heading uses text-[#1e1e1e]", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const sub = screen.getByText("Ev Aletleri")
    expect(sub.className).toContain("text-[#1e1e1e]")
  })

  /* ── Title (H2) ── */

  it("renders slide titles as h2 headings", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByText("En Iyi Urunlerimizi Kesfedin")).toBeInTheDocument()
    expect(screen.getByText("Yuksek Kalite Dizustu")).toBeInTheDocument()
  })

  it("title uses #1e1e1e dark text color", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const title = screen.getByText("En Iyi Urunlerimizi Kesfedin")
    expect(title.className).toContain("text-[#1e1e1e]")
  })

  it("title uses font-bold (700)", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const title = screen.getByText("En Iyi Urunlerimizi Kesfedin")
    expect(title.className).toContain("font-bold")
  })

  it("title uses text-[25.5px] md:text-[34px] matching dt-elektrix", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const title = screen.getByText("En Iyi Urunlerimizi Kesfedin")
    expect(title.className).toContain("md:text-[34px]")
  })

  /* ── Description Text ── */

  it("renders description text", () => {
    render(<HeroBanner slides={defaultSlides} />)
    expect(screen.getByText("Kaliteli urunler, uygun fiyatlar.")).toBeInTheDocument()
  })

  it("description uses text-[16px] and text-[#1e1e1e]", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const desc = screen.getByText("Kaliteli urunler, uygun fiyatlar.")
    expect(desc.className).toContain("text-[16px]")
    expect(desc.className).toContain("text-[#1e1e1e]")
  })

  /* ── CTA Button ── */

  it("renders CTA buttons with correct text", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const buttons = screen.getAllByRole("link")
    const buttonTexts = buttons.map((b) => b.textContent)
    expect(buttonTexts).toContain("Kesfet")
    expect(buttonTexts).toContain("Incele")
  })

  it("CTA button links to correct href", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Kesfet")
    expect(link.closest("a")).toHaveAttribute("href", "/katalog")
  })

  it("CTA button uses bg-[#2189ff] primary color", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Kesfet").closest("a")!
    expect(link.className).toContain("bg-[#2189ff]")
  })

  it("CTA button uses hover:bg-[#1e1e1e]", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Kesfet").closest("a")!
    expect(link.className).toContain("hover:bg-[#1e1e1e]")
  })

  it("CTA button uses white text", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Kesfet").closest("a")!
    expect(link.className).toContain("text-white")
  })

  it("CTA button uses font-bold", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Kesfet").closest("a")!
    expect(link.className).toContain("font-bold")
  })

  it("CTA button uses rounded-lg border radius (8px)", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Kesfet").closest("a")!
    expect(link.className).toContain("rounded-lg")
  })

  it("CTA button uses py-[9px] px-[32px] matching dt-elektrix padding", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Kesfet").closest("a")!
    expect(link.className).toContain("py-[9px]")
    expect(link.className).toContain("px-[32px]")
  })

  it("CTA button uses transition-all duration-300", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const link = screen.getByText("Kesfet").closest("a")!
    expect(link.className).toContain("transition-all")
    expect(link.className).toContain("duration-300")
  })

  /* ── Content Alignment ── */

  it("slide 1 content is left-aligned (text-start)", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const leftAligned = banner.querySelectorAll("[class*='text-left']")
    expect(leftAligned.length).toBeGreaterThan(0)
  })

  it("slide 2 content is right-aligned (text-end)", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const rightAligned = banner.querySelectorAll("[class*='text-right']")
    expect(rightAligned.length).toBeGreaterThan(0)
  })

  /* ── Container border-radius (10px) ── */

  it("swiper container has rounded-[10px] border radius", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const rounded = banner.querySelectorAll("[class*='rounded-[10px]']")
    expect(rounded.length).toBeGreaterThan(0)
  })

  /* ── Content Box dimensions (750px width, proper padding/margin) ── */

  it("content block has max-w-[750px]", () => {
    render(<HeroBanner slides={defaultSlides} />)
    const banner = screen.getByRole("banner")
    const contentBoxes = banner.querySelectorAll("[class*='max-w-[750px]']")
    expect(contentBoxes.length).toBeGreaterThan(0)
  })
})
