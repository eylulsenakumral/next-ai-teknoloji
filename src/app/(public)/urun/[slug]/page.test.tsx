// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src as string}
      alt={props.alt as string}
      data-testid="next-image"
      width={props.width as number}
      height={props.height as number}
    />
  ),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/urun/test-product",
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    isDealer: false,
    isAdmin: false,
  }),
}))

// Import components after mocks
import {
  Breadcrumb,
  ProductImageGallery,
  ProductDetails,
  ProductSpecsTable,
  RelatedProducts,
  CustomerReviews,
  ProductQA,
} from "./components"

/* ------------------------------------------------------------------ */
/*  Task #15: Product Detail Page Components                           */
/* ------------------------------------------------------------------ */

describe("Product Detail Page", () => {
  /* ── Breadcrumb ── */

  describe("Breadcrumb", () => {
    it("renders Home > Kategori > Urun links", () => {
      render(
        <Breadcrumb
          items={[
            { label: "Ana Sayfa", href: "/" },
            { label: "Bilgisayarlar", href: "/kategori/bilgisayarlar" },
            { label: "Test Laptop" },
          ]}
        />
      )
      expect(screen.getByText("Ana Sayfa")).toBeInTheDocument()
      expect(screen.getByText("Bilgisayarlar")).toBeInTheDocument()
      expect(screen.getByText("Test Laptop")).toBeInTheDocument()
    })

    it("renders navigation landmark with aria-label", () => {
      render(
        <Breadcrumb
          items={[
            { label: "Ana Sayfa", href: "/" },
            { label: "Test" },
          ]}
        />
      )
      expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument()
    })

    it("last item is not a link", () => {
      render(
        <Breadcrumb
          items={[
            { label: "Ana Sayfa", href: "/" },
            { label: "Current Page" },
          ]}
        />
      )
      const currentItem = screen.getByText("Current Page")
      expect(currentItem.closest("a")).toBeNull()
    })
  })

  /* ── Product Image Gallery ── */

  describe("ProductImageGallery", () => {
    const images = [
      "https://example.com/img1.jpg",
      "https://example.com/img2.jpg",
      "https://example.com/img3.jpg",
    ]

    it("renders main image", () => {
      render(<ProductImageGallery images={images} productName="Test Product" />)
      const mainImg = screen.getByAltText("Test Product")
      expect(mainImg).toBeInTheDocument()
    })

    it("renders thumbnail images", () => {
      render(<ProductImageGallery images={images} productName="Test Product" />)
      const thumbnails = screen.getAllByRole("button", { name: /gorsel|resim|thumbnail/i })
      expect(thumbnails.length).toBe(3)
    })

    it("renders placeholder when no images", () => {
      render(<ProductImageGallery images={[]} productName="No Image Product" />)
      expect(screen.getByTestId("no-image-placeholder")).toBeInTheDocument()
    })

    it("has bg-[#f3f3f3] product background", () => {
      const { container } = render(
        <ProductImageGallery images={images} productName="Test" />
      )
      const wrapper = container.firstElementChild
      expect(wrapper?.className).toContain("f3f3f3")
    })
  })

  /* ── Product Details ── */

  describe("ProductDetails", () => {
    const product = {
      name: "HP ProBook 450 G10",
      brand: { name: "HP", slug: "hp" },
      description: "High performance laptop for professionals",
      stockStatus: true,
      specs: { RAM: "16GB", SSD: "512GB" },
    }

    it("renders product name as heading", () => {
      render(<ProductDetails {...product} />)
      expect(screen.getByRole("heading", { name: /HP ProBook 450 G10/i })).toBeInTheDocument()
    })

    it("renders brand name", () => {
      render(<ProductDetails {...product} />)
      expect(screen.getByText("HP")).toBeInTheDocument()
    })

    it("renders stock badge when in stock", () => {
      render(<ProductDetails {...product} />)
      expect(screen.getByText(/stokta/i)).toBeInTheDocument()
    })

    it("renders out of stock badge", () => {
      render(<ProductDetails {...{ ...product, stockStatus: false }} />)
      expect(screen.getByText(/tukendi|stok yok/i)).toBeInTheDocument()
    })

    it("renders description", () => {
      render(<ProductDetails {...product} />)
      expect(screen.getByText(/High performance laptop/i)).toBeInTheDocument()
    })

    it("renders Bayi Girisi link to /login", () => {
      render(<ProductDetails {...product} />)
      const ctaButton = screen.getByRole("link", { name: /ozel fiyatlar.*bayi girisi/i })
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).toHaveAttribute("href", "/login")
    })

    it("renders Favorilere Ekle button", () => {
      render(<ProductDetails {...product} />)
      expect(screen.getByRole("button", { name: /favori|wishlist/i })).toBeInTheDocument()
    })
  })

  /* ── Product Specs Table ── */

  describe("ProductSpecsTable", () => {
    it("renders spec rows as a table", () => {
      render(
        <ProductSpecsTable specs={{ RAM: "16GB", SSD: "512GB", CPU: "i7-1355U" }} />
      )
      expect(screen.getByText("RAM")).toBeInTheDocument()
      expect(screen.getByText("16GB")).toBeInTheDocument()
      expect(screen.getByText("SSD")).toBeInTheDocument()
      expect(screen.getByText("512GB")).toBeInTheDocument()
    })

    it("renders nothing when specs is null", () => {
      const { container } = render(<ProductSpecsTable specs={null} />)
      expect(container.innerHTML).toBe("")
    })

    it("renders nothing when specs is empty object", () => {
      const { container } = render(<ProductSpecsTable specs={{}} />)
      expect(container.innerHTML).toBe("")
    })
  })

  /* ── Related Products ── */

  describe("RelatedProducts", () => {
    const products = [
      {
        id: "1",
        name: "Related Product 1",
        slug: "related-1",
        images: ["https://example.com/r1.jpg"],
        brand: { name: "HP", slug: "hp" },
        stockStatus: true,
      },
      {
        id: "2",
        name: "Related Product 2",
        slug: "related-2",
        images: [],
        brand: null,
        stockStatus: false,
      },
    ]

    it("renders section heading", () => {
      render(<RelatedProducts products={products} />)
      expect(screen.getByRole("heading", { name: /ilgili|benzer|related/i })).toBeInTheDocument()
    })

    it("renders product cards in grid", () => {
      render(<RelatedProducts products={products} />)
      expect(screen.getByText("Related Product 1")).toBeInTheDocument()
      expect(screen.getByText("Related Product 2")).toBeInTheDocument()
    })

    it("renders responsive grid classes", () => {
      const { container } = render(<RelatedProducts products={products} />)
      const grid = container.querySelector(".grid")
      expect(grid).toBeInTheDocument()
    })

    it("renders nothing when products array is empty", () => {
      const { container } = render(<RelatedProducts products={[]} />)
      expect(container.innerHTML).toBe("")
    })
  })

  /* ── Customer Reviews ── */

  describe("CustomerReviews", () => {
    it("renders section heading", () => {
      render(<CustomerReviews />)
      expect(
        screen.getByRole("heading", { name: /yorum|degerlendirme|review/i })
      ).toBeInTheDocument()
    })

    it("renders 5-star rating display", () => {
      render(<CustomerReviews />)
      const stars = screen.getAllByTestId("star-icon")
      expect(stars.length).toBe(5)
    })

    it("renders placeholder message when no reviews", () => {
      render(<CustomerReviews />)
      expect(screen.getByText(/henuz.*yorum|ilk.*yorum/i)).toBeInTheDocument()
    })
  })

  /* ── Product Q&A ── */

  describe("ProductQA", () => {
    it("renders section heading", () => {
      render(<ProductQA />)
      expect(
        screen.getByRole("heading", { name: /soru.*cevap|q.*a/i })
      ).toBeInTheDocument()
    })

    it("renders placeholder message when no questions", () => {
      render(<ProductQA />)
      expect(screen.getByText(/henuz.*soru|ilk.*soru/i)).toBeInTheDocument()
    })

    it("renders ask question button", () => {
      render(<ProductQA />)
      expect(screen.getByRole("button", { name: /soru.*sor/i })).toBeInTheDocument()
    })
  })
})
