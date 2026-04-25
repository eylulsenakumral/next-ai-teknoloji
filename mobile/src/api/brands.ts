import { api } from "./client"
import type { BrandListResponse } from "../types"

export const brandsApi = {
  list() {
    return api.get<BrandListResponse>("/api/public/brands")
  },
}
