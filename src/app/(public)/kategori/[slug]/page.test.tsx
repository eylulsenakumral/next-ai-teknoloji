// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/kategori/bilgisayarlar",
  useSearchParams: () => new URLSearchParams(),
}))

// Import components after mocks
import {
  CategoryBanner,
  FilterSidebar,
  CategoryProductGrid,
  SortDropdown,
  LoadMoreButton,
} from "./components"

/* ------------------------------------------------------------------ */
/*  Task #16: Category Landing Page Components                         */
/* ------------------------------------------------------------------ */

describe("Category Landing Page", () => {
  /* ── Category Banner ── */

  describe("CategoryBanner", () => {
    it("renders category title as heading", () => {
      render(
        <CategoryBanner
          title="Dizustu Bilgisayarlar"
          image="https://example.com/banner.jpg"
        />
      )
      expect(
        screen.getByRole("heading", { name: /Dizustu Bilgisayarlar/i })
      ).toBeInTheDocument()
    })

    it("renders banner image", () => {
      render(
        <CategoryBanner
          title="Test Category"
          image="https://example.com/banner.jpg"
        />
      )
      expect(screen.getByTestId("next-image")).toBeInTheDocument()
    })

    it("renders overlay on top of image", () => {
      const { container } = render(
        <CategoryBanner
          title="Test Category"
          image="https://example.com/banner.jpg"
        />
      )
      // The overlay should have an absolute positioning class
      const overlay = container.querySelector("[class*='absolute']")
      expect(overlay).toBeInTheDocument()
    })

    it("renders product count when provided", () => {
      render(
        <CategoryBanner
          title="Test"
          image="https://example.com/banner.jpg"
          productCount={42}
        />
      )
      expect(screen.getByText(/42/)).toBeInTheDocument()
    })
  })

  /* ── Filter Sidebar ── */

  describe("FilterSidebar", () => {
    const brands = [
      { id: "1", name: "HP", slug: "hp" },
      { id: "2", name: "Dell", slug: "dell" },
      { id: "3", name: "Lenovo", slug: "lenovo" },
    ]

    it("renders price range section", () => {
      render(
        <FilterSidebar
          brands={brands}
          selectedBrands={[]}
          priceRange={[0, 50000]}
          onBrandChange={vi.fn()}
          onPriceChange={vi.fn()}
        />
      )
      expect(screen.getByText(/Fiyat Araligi/i)).toBeInTheDocument()
    })

    it("renders brand checkboxes", () => {
      render(
        <FilterSidebar
          brands={brands}
          selectedBrands={[]}
          priceRange={[0, 50000]}
          onBrandChange={vi.fn()}
          onPriceChange={vi.fn()}
        />
      )
      expect(screen.getByLabelText(/HP/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Dell/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Lenovo/i)).toBeInTheDocument()
    })

    it("shows selected brand as checked", () => {
      render(
        <FilterSidebar
          brands={brands}
          selectedBrands={["hp"]}
          priceRange={[0, 50000]}
          onBrandChange={vi.fn()}
          onPriceChange={vi.fn()}
        />
      )
      const hpCheckbox = screen.getByLabelText(/HP/i) as HTMLInputElement
      expect(hpCheckbox.checked).toBe(true)
    })

    it("calls onBrandChange when checkbox is clicked", () => {
      const onBrandChange = vi.fn()
      render(
        <FilterSidebar
          brands={brands}
          selectedBrands={[]}
          priceRange={[0, 50000]}
          onBrandChange={onBrandChange}
          onPriceChange={vi.fn()}
        />
      )
      fireEvent.click(screen.getByLabelText(/HP/i))
      expect(onBrandChange).toHaveBeenCalled()
    })

    it("renders min and max price inputs", () => {
      render(
        <FilterSidebar
          brands={brands}
          selectedBrands={[]}
          priceRange={[100, 5000]}
          onBrandChange={vi.fn()}
          onPriceChange={vi.fn()}
        />
      )
      expect(screen.getByLabelText(/min.*fiyat|en.*dusuk/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/max.*fiyat|en.*yuksek/i)).toBeInTheDocument()
    })

    it("renders aside element with filter landmark", () => {
      render(
        <FilterSidebar
          brands={brands}
          selectedBrands={[]}
          priceRange={[0, 50000]}
          onBrandChange={vi.fn()}
          onPriceChange={vi.fn()}
        />
      )
      expect(screen.getByRole("complementary")).toBeInTheDocument()
    })

    it("has 250px width class on desktop", () => {
      const { container } = render(
        <FilterSidebar
          brands={brands}
          selectedBrands={[]}
          priceRange={[0, 50000]}
          onBrandChange={vi.fn()}
          onPriceChange={vi.fn()}
        />
      )
      const sidebar = container.firstElementChild
      expect(sidebar?.className).toMatch(/w-\[250px\]|w-64/)
    })
  })

  /* ── Sort Dropdown ── */

  describe("SortDropdown", () => {
    it("renders sort options", () => {
      render(<SortDropdown value="popular" onChange={vi.fn()} />)
      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })

    it("calls onChange when selection changes", () => {
      const onChange = vi.fn()
      render(<SortDropdown value="popular" onChange={onChange} />)
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "price-asc" },
      })
      expect(onChange).toHaveBeenCalledWith("price-asc")
    })

    it("has options for popularity, price low-high, price high-low, newest", () => {
      render(<SortDropdown value="popular" onChange={vi.fn()} />)
      const select = screen.getByRole("combobox")
      const options = select.querySelectorAll("option")
      expect(options.length).toBeGreaterThanOrEqual(3)
    })
  })

  /* ── Category Product Grid ── */

  describe("CategoryProductGrid", () => {
    const products = [
      {
        id: "1",
        name: "Product A",
        slug: "product-a",
        images: ["https://example.com/a.jpg"],
        brand: { name: "HP", slug: "hp" },
        stockStatus: true,
      },
      {
        id: "2",
        name: "Product B",
        slug: "product-b",
        images: [],
        brand: null,
        stockStatus: false,
      },
    ]

    it("renders products in grid", () => {
      render(<CategoryProductGrid products={products} />)
      expect(screen.getByText("Product A")).toBeInTheDocument()
      expect(screen.getByText("Product B")).toBeInTheDocument()
    })

    it("renders responsive grid classes (3-4 column)", () => {
      const { container } = render(<CategoryProductGrid products={products} />)
      const grid = container.querySelector(".grid")
      expect(grid).toBeInTheDocument()
      expect(grid?.className).toMatch(/grid-cols/)
    })

    it("renders product count display", () => {
      render(<CategoryProductGrid products={products} totalCount={42} />)
      expect(screen.getByText(/42/)).toBeInTheDocument()
    })

    it("renders empty state when no products", () => {
      render(<CategoryProductGrid products={[]} />)
      expect(screen.getByText(/bulunamadi|urun yok/i)).toBeInTheDocument()
    })
  })

  /* ── Load More Button ── */

  describe("LoadMoreButton", () => {
    it("renders load more button", () => {
      render(<LoadMoreButton onClick={vi.fn()} hasMore={true} isLoading={false} />)
      expect(screen.getByRole("button", { name: /daha fazla|devam/i })).toBeInTheDocument()
    })

    it("is disabled when no more items", () => {
      render(<LoadMoreButton onClick={vi.fn()} hasMore={false} isLoading={false} />)
      expect(screen.getByRole("button")).toBeDisabled()
    })

    it("shows loading state", () => {
      render(<LoadMoreButton onClick={vi.fn()} hasMore={true} isLoading={true} />)
      expect(screen.getByText(/yukleniyor|loading/i)).toBeInTheDocument()
    })

    it("calls onClick when clicked", () => {
      const onClick = vi.fn()
      render(<LoadMoreButton onClick={onClick} hasMore={true} isLoading={false} />)
      fireEvent.click(screen.getByRole("button"))
      expect(onClick).toHaveBeenCalled()
    })
  })
})
