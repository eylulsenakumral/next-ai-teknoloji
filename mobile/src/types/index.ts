// NexaDepo Bayi — TypeScript types (API response shapes)

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Auth / Customer
// ---------------------------------------------------------------------------
export type CustomerStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "BLACKLISTED"

export interface Customer {
  id: string
  dealerCode: string
  companyName: string
  tradeName: string
  contactName: string
  contactTitle: string | null
  phone: string | null
  phone2: string | null
  email: string
  taxOffice: string | null
  taxNumber: string | null
  address: string | null
  city: string | null
  district: string | null
  postalCode: string | null
  whatsappPhone: string | null
  status: CustomerStatus
  balance: number
  creditLimit: number
  discountRate: number
  createdAt: string
  approvedAt: string | null
  lastLoginAt: string | null
}

export interface ProfileResponse {
  data: Customer
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------
export interface ProductListItem {
  id: string
  name: string
  slug: string
  images: string[] | null
  description: string | null
  specifications: Record<string, unknown> | null
  brand: { name: string; slug: string }
  category: { name: string; slug: string }
  stockStatus: boolean
  stockCount: number
  hidePrice: boolean
  price: number | null
  currency: string
  priceTry: number | null
  originalPrice?: number | null
  originalPriceTry?: number | null
  usdTryRate: number
}

export interface ProductListResponse {
  data: ProductListItem[]
  meta: PaginationMeta
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  barcode: string | null
  sku: string | null
  modelCode: string | null
  shortDescription: string | null
  description: string | null
  specs: Record<string, unknown> | null
  images: string[] | null
  brand: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    websiteUrl: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    parentId: string | null
    parent?: {
      id: string
      name: string
      slug: string
      parentId: string | null
      parent?: { id: string; name: string; slug: string; parentId: string | null }
    }
  }
  pricing: {
    purchasePrice: number
    salePriceExVat: number
    salePriceIncVat: number
    vatRate: number
    currency: string
    campaignDiscountPct?: number | null
    originalPrice?: number | null
  }
  stock: {
    quantity: number
    isAvailable: boolean
  }
  warrantyMonths: number | null
  minOrderQuantity: number | null
  unit: string | null
  isNew: boolean
  isFeatured: boolean
  isOutlet: boolean
  suppliers?: { depoName: string; stockQuantity: number }[]
}

export interface RelatedProduct {
  id: string
  name: string
  slug: string
  images: string[] | null
  brand: { id: string; name: string; slug: string }
  pricing: { salePriceExVat: number; salePriceIncVat: number; vatRate: number }
  stock: { quantity: number; isAvailable: boolean }
}

export interface ProductDetailResponse {
  product: ProductDetail
  relatedProducts: RelatedProduct[]
}

export interface ProductListParams {
  page?: number
  limit?: number
  search?: string
  categorySlug?: string
  brandSlug?: string
  brandSlugs?: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  campaign?: boolean
  sortBy?: "newest" | "name-asc" | "name-desc"
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export interface CartItemProduct {
  id: string
  name: string
  slug: string
  images: string[] | null
  brand: { name: string }
  supplierProducts: { stockQuantity: number; purchasePrice: number }[]
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  priceSnapshot: number
  product: CartItemProduct
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
}

export interface CartMutationResponse {
  success: boolean
  alreadyExists?: boolean
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  totalAmount: number
  currency: string
  createdAt: string
  updatedAt: string
  customer: { id: string; contactName: string }
  items: OrderItem[]
  itemCount?: number
  previewItems?: string[]
  shippingAddress: {
    address: string
    city: string
    district: string
    postalCode: string
  } | null
  trackingNumber: string | null
  estimatedDelivery: string | null
}

export interface OrderListResponse {
  data: Order[]
  meta: PaginationMeta
}

export interface OrderCreateResponse {
  data: {
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    currency: string
    createdAt: string
  }
}

export interface OrderCreatePayload {
  items: { productId: string; quantity: number }[]
  shippingAddress: {
    companyName: string
    contactName: string
    phone: string
    address: string
    city: string
    district: string
    postalCode: string
    country: string
  }
  paymentMethod: "BANK_TRANSFER" | "ON_ACCOUNT" | "CREDIT_CARD"
  notes?: string
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------
export type TransactionType =
  | "INVOICE"
  | "PAYMENT"
  | "REFUND"
  | "ADJUSTMENT"
  | "OPENING_BALANCE"

export interface AccountTransaction {
  id: string
  type: TransactionType
  amount: number
  balance: number
  description: string | null
  referenceNumber: string | null
  createdAt: string
}

export interface TransactionMeta extends PaginationMeta {
  currentBalance: number
  creditLimit: number
}

export interface TransactionListResponse {
  data: AccountTransaction[]
  meta: TransactionMeta
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------
export interface WishlistItemProduct {
  id: string
  name: string
  slug: string
  images: string[] | null
  brand: { name: string }
  category: { name: string; slug: string }
  supplierProducts: { stockQuantity: number; purchasePrice: number }[]
}

export interface WishlistItem {
  id: string
  productId: string
  addedAt: string
  product: WishlistItemProduct
}

export interface Wishlist {
  id: string
  userId: string
  items: WishlistItem[]
}

export interface WishlistMutationResponse {
  success: boolean
  alreadyExists?: boolean
}

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------
export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  depth: number
  productCount: number
  imageUrl: string | null
  children: CategoryTreeNode[]
}

export interface CategoryFlat {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  productCount: number
  imageUrl: string | null
}

export interface CategoryTreeResponse {
  data: CategoryTreeNode[]
}

export interface CategoryFlatResponse {
  data: CategoryFlat[]
}

// ---------------------------------------------------------------------------
// Exchange Rate
// ---------------------------------------------------------------------------
export interface ExchangeRate {
  usd: number
  eur: number
  lastUpdated: string | null
}

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------
export interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  productCount?: number
}

export interface BrandListResponse {
  data: Brand[]
}

// ---------------------------------------------------------------------------
// Payment (NomuPay)
// ---------------------------------------------------------------------------
export interface NomuPayTicketResponse {
  success: boolean
  returnUrl: string
  statusCode: string
  resultCode: string
  resultMessage: string
  orderId: string
  maskedCCNo: string
  mpay: string
}

// ---------------------------------------------------------------------------
// Dealer Application
// ---------------------------------------------------------------------------
export interface DealerApplication {
  companyName: string
  contactName: string
  phone: string
  email: string
  taxOffice?: string
  taxNumber?: string
  city?: string
  district?: string
  address?: string
  taxCertificateUrl?: string
  kvkkAccepted: boolean
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------
export interface City {
  id: number
  name: string
}

export interface District {
  id: number
  name: string
  cityId: number
}
