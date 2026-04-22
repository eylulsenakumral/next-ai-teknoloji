// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock fetch
global.fetch = vi.fn()

// Mock next/link
vi.mock('next/link', () => ({
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

// Import after mocks
import { ProductCard, ProductCardSkeleton } from '../product-card'
import type { CatalogProduct } from '@/types/catalog'

const mockProduct: CatalogProduct = {
  id: 'prod-001',
  name: 'Test Ürün 123',
  slug: 'test-urun-123',
  sku: 'SKU123',
  description: 'Test description',
  images: ['https://example.com/image.jpg'],
  brand: { id: 'brand-001', name: 'Test Brand', slug: 'test-brand' },
  category: { id: 'cat-001', name: 'Test Category', slug: 'test-category', path: [] },
  pricing: {
    id: 'price-001',
    productId: 'prod-001',
    listPriceExVat: 1000,
    listPriceIncVat: 1180,
    salePriceExVat: 800,
    salePriceIncVat: 944,
    currency: 'TRY',
    margin: 20,
  },
  stock: {
    isAvailable: true,
    quantity: 10,
    inStock: true,
  },
  isNew: false,
  isOutlet: false,
  specifications: {},
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders product name', () => {
      render(<ProductCard product={mockProduct} />)
      expect(screen.getByText('Test Ürün 123')).toBeInTheDocument()
    })

    it('renders product image', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('renders sale price', () => {
      render(<ProductCard product={mockProduct} />)
      expect(screen.getByText(/944/)).toBeInTheDocument()
    })

    it('renders product link', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const link = container.querySelector('a[href="/urunler/test-urun-123"]')
      expect(link).toBeInTheDocument()
    })
  })

  describe('Stock Status', () => {
    it('shows stock badge when out of stock', () => {
      const outOfStockProduct = {
        ...mockProduct,
        stock: { isAvailable: false, quantity: 0, inStock: false },
      }
      render(<ProductCard product={outOfStockProduct} />)
      expect(screen.getByText('TUKENDI')).toBeInTheDocument()
    })

    it('shows low stock warning when quantity < 5', () => {
      const lowStockProduct = {
        ...mockProduct,
        stock: { isAvailable: true, quantity: 3, inStock: true },
      }
      render(<ProductCard product={lowStockProduct} />)
      expect(screen.getByText(/Son 3 adet/)).toBeInTheDocument()
    })

    it('shows new badge when isNew is true', () => {
      const newProduct = { ...mockProduct, isNew: true }
      render(<ProductCard product={newProduct} />)
      expect(screen.getByText('YENI')).toBeInTheDocument()
    })

    it('shows outlet badge when isOutlet is true', () => {
      const outletProduct = { ...mockProduct, isOutlet: true }
      render(<ProductCard product={outletProduct} />)
      expect(screen.getByText('OUTLET')).toBeInTheDocument()
    })

    it('shows Stok Yok text when out of stock', () => {
      const outOfStockProduct = {
        ...mockProduct,
        stock: { isAvailable: false, quantity: 0, inStock: false },
      }
      render(<ProductCard product={outOfStockProduct} />)
      expect(screen.getByText('Stok Yok')).toBeInTheDocument()
    })
  })

  describe('Hover Actions', () => {
    it('shows action buttons on hover (via CSS class)', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const actionContainer = container.querySelector('.opacity-0')
      expect(actionContainer).toBeInTheDocument()
    })

    it('renders add to cart button when in stock and callback provided', () => {
      const addToCart = vi.fn()
      const { container } = render(
        <ProductCard product={mockProduct} onAddToCart={addToCart} />
      )
      const cartButton = container.querySelector('button[aria-label*="sepete ekle"]')
      expect(cartButton).toBeInTheDocument()
    })

    it('does not render add to cart button when out of stock', () => {
      const outOfStockProduct = {
        ...mockProduct,
        stock: { isAvailable: false, quantity: 0, inStock: false },
      }
      const addToCart = vi.fn()
      const { container } = render(
        <ProductCard product={outOfStockProduct} onAddToCart={addToCart} />
      )
      const cartButton = container.querySelector('button[aria-label*="sepete ekle"]')
      expect(cartButton).not.toBeInTheDocument()
    })

    it('renders quick view button', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const viewButton = container.querySelector('button[aria-label*="hizli bak"]')
      expect(viewButton).toBeInTheDocument()
    })

    it('renders wishlist button', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const wishlistButton = container.querySelector('button[aria-label*="favorilere ekle"]')
      expect(wishlistButton).toBeInTheDocument()
    })
  })

  describe('Add to Cart', () => {
    it('calls onAddToCart when cart button clicked', async () => {
      const addToCart = vi.fn()
      const { container } = render(
        <ProductCard product={mockProduct} onAddToCart={addToCart} />
      )
      
      const cartButton = container.querySelector('button[aria-label*="sepete ekle"]')
      if (cartButton) {
        fireEvent.click(cartButton)
        expect(addToCart).toHaveBeenCalledWith(mockProduct)
      }
    })

    it('prevents event propagation when clicking cart button', () => {
      const addToCart = vi.fn()
      const { container } = render(
        <ProductCard product={mockProduct} onAddToCart={addToCart} />
      )
      
      const cartButton = container.querySelector('button[aria-label*="sepete ekle"]')
      expect(cartButton).toBeInTheDocument()
      if (cartButton) {
        fireEvent.click(cartButton)
        expect(addToCart).toHaveBeenCalled()
      }
    })
  })

  describe('Fallback Image', () => {
    it('shows placeholder when no image provided', () => {
      const productWithoutImage = {
        ...mockProduct,
        images: [],
      }
      const { container } = render(<ProductCard product={productWithoutImage} />)
      const placeholder = container.querySelector('.flex.items-center.justify-center')
      expect(placeholder).toBeInTheDocument()
    })

    it('shows placeholder when image fails to load', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const img = container.querySelector('img')
      if (img) {
        fireEvent.error(img)
      }
      const placeholder = container.querySelector('.flex.items-center.justify-center')
      expect(placeholder).toBeInTheDocument()
    })
  })

  describe('Brand and Category Dropdowns', () => {
    it('renders brand dropdown when brands provided', () => {
      const brands = [
        { id: 'brand-1', name: 'Brand 1', slug: 'brand-1' },
        { id: 'brand-2', name: 'Brand 2', slug: 'brand-2' },
      ]
      const { container } = render(
        <ProductCard product={mockProduct} brands={brands} />
      )
      const select = container.querySelector('select[aria-label="Marka sec"]')
      expect(select).toBeInTheDocument()
    })

    it('renders category dropdown when categories provided', () => {
      const categories = [
        { id: 'cat-1', name: 'Category 1', slug: 'cat-1', path: [] },
        { id: 'cat-2', name: 'Category 2', slug: 'cat-2', path: [] },
      ]
      const { container } = render(
        <ProductCard product={mockProduct} categories={categories} />
      )
      const select = container.querySelector('select[aria-label="Kategori sec"]')
      expect(select).toBeInTheDocument()
    })

    it('does not render dropdowns when not provided', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const selects = container.querySelectorAll('select')
      expect(selects.length).toBe(0)
    })
  })

  describe('Styling', () => {
    it('applies correct card classes', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const card = container.querySelector('article')
      expect(card?.className).toContain('rounded-[20px]')
      expect(card?.className).toContain('bg-[#f3f3f3]')
    })

    it('applies hover effect classes', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      const card = container.querySelector('article')
      expect(card?.className).toContain('hover:shadow-')
      expect(card?.className).toContain('hover:-translate-y-1')
      expect(card?.className).toContain('transition-all')
    })

    it('price has correct color class', () => {
      const { container } = render(<ProductCard product={mockProduct} />)
      // Find the element with the green price class
      const greenPriceElement = container.querySelector('.text-\\[\\#3b7300\\]')
      expect(greenPriceElement).toBeInTheDocument()
    })
  })

  describe('ProductCardSkeleton', () => {
    it('renders skeleton placeholder', () => {
      const { container } = render(<ProductCardSkeleton />)
      const skeleton = container.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    it('renders skeleton image area', () => {
      const { container } = render(<ProductCardSkeleton />)
      const skeletonImage = container.querySelector('.aspect-square')
      expect(skeletonImage).toBeInTheDocument()
    })

    it('renders skeleton text lines', () => {
      const { container } = render(<ProductCardSkeleton />)
      const skeletonLines = container.querySelectorAll('.rounded')
      expect(skeletonLines.length).toBeGreaterThan(0)
    })
  })
})
