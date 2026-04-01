export interface ProductPricing {
  salePriceExVat: number
  salePriceIncVat: number
  vatRate: number
  currency: string
}

export interface ProductStock {
  quantity: number
  isAvailable: boolean
}

export interface ProductBrand {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  parentId?: string | null
  parent?: {
    id: string
    name: string
    slug: string
    parentId?: string | null
  } | null
}

export interface CatalogProduct {
  id: string
  name: string
  slug: string
  barcode?: string | null
  sku?: string | null
  modelCode?: string | null
  shortDescription?: string | null
  images: string[]
  warrantyMonths?: number | null
  minOrderQuantity: number
  unit: string
  isNew: boolean
  isFeatured: boolean
  isOutlet: boolean
  brand?: ProductBrand | null
  category?: ProductCategory | null
  pricing?: ProductPricing | null
  stock: ProductStock
}

export interface CatalogProductDetail extends CatalogProduct {
  description?: string | null
  specs?: Record<string, unknown> | null
}

export interface ProductListResponse {
  products: CatalogProduct[]
  total: number
  page: number
  totalPages: number
}

export interface CategoryNode {
  id: string
  name: string
  slug: string
  parentId?: string | null
  depth: number
  _count: { products: number }
  children?: CategoryNode[]
}

export interface BrandItem {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  productCount: number
}

export interface SupplierItem {
  id: string
  name: string
  code: string
}

export interface SearchResult {
  id: string
  name: string
  slug: string
  barcode?: string | null
  sku?: string | null
  image?: string | null
  brand?: string | null
  category?: string | null
}

export type SortOption = "newest" | "name" | "price"
export type ViewMode = "grid" | "list"

export interface ProductFilters {
  q: string
  brandId: string
  categoryId: string
  supplierId: string
  minPrice: string
  maxPrice: string
  inStock: boolean | undefined
  sortBy: SortOption
  page: number
}
