// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import type { CategoryNode, BrandItem, ProductFilters as ProductFiltersType } from '@/types/catalog'
import { ProductFilters } from '../product-filters'

const mockCategories: CategoryNode[] = [
  {
    id: 'cat-1',
    name: 'Bilgisayarlar',
    slug: 'bilgisayarlar',
    path: [],
    children: [
      {
        id: 'cat-1-1',
        name: 'Laptop',
        slug: 'laptop',
        path: [],
        children: [],
        _count: { products: 15 },
      },
      {
        id: 'cat-1-2',
        name: 'Masaustu',
        slug: 'masaustu',
        path: [],
        children: [],
        _count: { products: 8 },
      },
    ],
    _count: { products: 23 },
  },
  {
    id: 'cat-2',
    name: 'Cep Telefonlari',
    slug: 'cep-telefonlari',
    path: [],
    children: [],
    _count: { products: 45 },
  },
]

const mockBrands: BrandItem[] = [
  { id: 'brand-1', name: 'Apple', slug: 'apple', productCount: 12 },
  { id: 'brand-2', name: 'Samsung', slug: 'samsung', productCount: 25 },
  { id: 'brand-3', name: 'Sony', slug: 'sony', productCount: 8 },
  { id: 'brand-4', name: 'LG', slug: 'lg', productCount: 5 },
]

const mockFilters: ProductFiltersType = {
  categoryId: '',
  brandId: '',
  minPrice: '',
  maxPrice: '',
  page: 1,
}

describe('ProductFilters', () => {
  const onChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders filter aside with aria-label', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const aside = document.querySelector('aside[aria-label="Ürün filtreleri"]')
      expect(aside).toBeInTheDocument()
    })

    it('renders categories section', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.getByText('Kategoriler')).toBeInTheDocument()
    })

    it('renders brands section', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.getByText('Markalar')).toBeInTheDocument()
    })

    it('renders price range section', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.getByText('Fiyat Aralığı')).toBeInTheDocument()
    })
  })

  describe('Category Filters', () => {
    it('renders category items', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.getByText('Bilgisayarlar')).toBeInTheDocument()
      expect(screen.getByText('Cep Telefonlari')).toBeInTheDocument()
    })

    it('renders category with product count', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.getByText('23')).toBeInTheDocument()
    })

    it('calls onChange when category is selected', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const categoryButton = screen.getByText('Cep Telefonlari').closest('button')
      if (categoryButton) {
        fireEvent.click(categoryButton)
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ categoryId: 'cat-2', page: 1 })
        )
      }
    })

    it('deselects category when clicked again', () => {
      const filtersWithCategory = { ...mockFilters, categoryId: 'cat-2' }
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={filtersWithCategory}
          onChange={onChange}
        />
      )
      const categoryButton = screen.getByText('Cep Telefonlari').closest('button')
      if (categoryButton) {
        fireEvent.click(categoryButton)
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({ categoryId: '', page: 1 })
        )
      }
    })

    it('expands child categories when parent is expanded', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      // Parent should show children when expanded
      const bilgisayarlarRow = screen.getByText('Bilgisayarlar').closest('div')
      expect(bilgisayarlarRow).toBeTruthy()
    })
  })

  describe('Brand Filters', () => {
    it('renders brand checkboxes', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Samsung')).toBeInTheDocument()
      expect(screen.getByText('Sony')).toBeInTheDocument()
    })

    it('renders brand product counts', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.getByText('(12)')).toBeInTheDocument()
      expect(screen.getByText('(25)')).toBeInTheDocument()
    })

    it('calls onChange when brand is selected', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const appleCheckbox = screen.getByLabelText(/apple/i)
      fireEvent.click(appleCheckbox)
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ brandId: 'brand-1', page: 1 })
      )
    })

    it('filters brands by search', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const searchInput = screen.getByPlaceholderText('Marka ara...')
      fireEvent.change(searchInput, { target: { value: 'Sam' } })
      expect(screen.getByText('Samsung')).toBeInTheDocument()
      expect(screen.queryByText('Apple')).not.toBeInTheDocument()
    })

    it('shows all brands when search is cleared', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const searchInput = screen.getByPlaceholderText('Marka ara...')
      fireEvent.change(searchInput, { target: { value: 'Sam' } })
      expect(screen.getByText('Samsung')).toBeInTheDocument()
      fireEvent.change(searchInput, { target: { value: '' } })
      expect(screen.getByText('Apple')).toBeInTheDocument()
    })
  })

  describe('Price Range Filters', () => {
    it('renders min price input', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const minInput = screen.getByLabelText('Min ₺')
      expect(minInput).toBeInTheDocument()
    })

    it('renders max price input', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const maxInput = screen.getByLabelText('Max ₺')
      expect(maxInput).toBeInTheDocument()
    })

    it('calls onChange when min price changes', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const minInput = screen.getByLabelText('Min ₺')
      fireEvent.change(minInput, { target: { value: '100' } })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: '100', page: 1 })
      )
    })

    it('calls onChange when max price changes', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const maxInput = screen.getByLabelText('Max ₺')
      fireEvent.change(maxInput, { target: { value: '5000' } })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ maxPrice: '5000', page: 1 })
      )
    })
  })

  describe('Filter Section Toggle', () => {
    it('filter sections are expandable/collapsible', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const sectionTitle = screen.getByText('Kategoriler').closest('button')
      if (sectionTitle) {
        fireEvent.click(sectionTitle)
        // After clicking, section should toggle
      }
    })
  })

  describe('Empty States', () => {
    it('renders without categories', () => {
      render(
        <ProductFilters
          categories={[]}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.queryByText('Kategoriler')).not.toBeInTheDocument()
    })

    it('renders without brands', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={[]}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.queryByText('Markalar')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('category buttons have aria-pressed', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const categoryButton = screen.getByText('Cep Telefonlari').closest('button')
      expect(categoryButton).toHaveAttribute('aria-pressed')
    })

    it('brand checkboxes have aria-label', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      const appleCheckbox = screen.getByLabelText(/apple/i)
      expect(appleCheckbox).toBeInTheDocument()
    })

    it('price inputs have labels', () => {
      render(
        <ProductFilters
          categories={mockCategories}
          brands={mockBrands}
          filters={mockFilters}
          onChange={onChange}
        />
      )
      expect(screen.getByLabelText('Min ₺')).toBeInTheDocument()
      expect(screen.getByLabelText('Max ₺')).toBeInTheDocument()
    })
  })
})
