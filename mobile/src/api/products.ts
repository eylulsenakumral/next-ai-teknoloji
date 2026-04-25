import { api } from "./client"
import type { ProductListResponse, ProductDetailResponse, ProductListParams } from "../types"

export const productsApi = {
  list(params?: ProductListParams) {
    const query = {
      ...params,
      search: params?.search,
      q: undefined,
    } as Record<string, string | number | boolean | undefined>
    return api.get<ProductListResponse>("/api/public/catalog/products", query)
  },

  detail(slug: string) {
    return api.get<ProductDetailResponse>(`/api/catalog/products/${slug}`)
  },
}
