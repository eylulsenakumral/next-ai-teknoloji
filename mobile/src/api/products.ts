import { api } from "./client"
import type { ProductListResponse, ProductDetailResponse, ProductListParams } from "../types"

export const productsApi = {
  list(params?: ProductListParams) {
    const { brandSlugs, ...rest } = params ?? {}
    const query = {
      ...rest,
      search: params?.search,
      brandSlug: brandSlugs?.length ? brandSlugs.join(",") : params?.brandSlug,
      q: undefined,
    } as Record<string, string | number | boolean | undefined>
    return api.get<ProductListResponse>("/api/public/catalog/products", query)
  },

  detail(slug: string) {
    return api.get<ProductDetailResponse>(`/api/catalog/products/${slug}`)
  },
}
