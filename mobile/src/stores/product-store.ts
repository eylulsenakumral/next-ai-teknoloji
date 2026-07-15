import { create } from "zustand"
import type { ProductListItem, ProductListParams } from "../types"
import { productsApi } from "../api/products"
import { toNumber } from "../lib/format"

interface ProductState {
  products: ProductListItem[]
  meta: { total: number; totalPages: number; page: number } | null
  isLoading: boolean
  errorMessage: string | null
  params: ProductListParams

  fetch: (params?: ProductListParams, append?: boolean) => Promise<void>
  reset: () => void
}


function normalizeProduct(product: ProductListItem): ProductListItem {
  const raw = product as ProductListItem & Record<string, unknown>
  const brand = product.brand ?? { name: "Marka", slug: "" }
  const category = product.category ?? { name: "Kategori", slug: "" }

  return {
    ...product,
    name: product.name ?? "Ürün",
    slug: product.slug ?? String(raw.id ?? ""),
    images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
    brand: {
      name: brand.name ?? "Marka",
      slug: brand.slug ?? "",
    },
    category: {
      name: category.name ?? "Kategori",
      slug: category.slug ?? "",
    },
    stockCount: toNumber(product.stockCount),
    stockStatus: Boolean(product.stockStatus) || toNumber(product.stockCount) > 0,
    price: product.price == null ? null : toNumber(product.price),
    priceTry: product.priceTry == null ? null : toNumber(product.priceTry),
    currency: product.currency ?? "TRY",
    usdTryRate: toNumber(product.usdTryRate),
  }
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  meta: null,
  isLoading: false,
  errorMessage: null,
  params: { page: 1, limit: 20, sortBy: "newest" },

  fetch: async (params, append = false) => {
    const merged = { ...get().params, ...params }
    set({ isLoading: true, errorMessage: null, params: merged, ...(append ? {} : { products: [] }) })
    try {
      const res = await productsApi.list(merged)
      set({
        products: append
          ? [...get().products, ...res.data.map(normalizeProduct)]
          : res.data.map(normalizeProduct),
        meta: {
          total: res.meta.total,
          totalPages: res.meta.totalPages,
          page: res.meta.page,
        },
        isLoading: false,
      })
    } catch (err) {
      const error = err as { data?: { message?: string; error?: string }; message?: string }
      set({
        isLoading: false,
        errorMessage:
          error?.data?.message ??
          error?.data?.error ??
          error?.message ??
          "Ürünler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
      })
    }
  },

  reset: () => set({ products: [], meta: null, errorMessage: null, params: { page: 1, limit: 20, sortBy: "newest" } }),
}))
