import { api } from "./client"
import type { CategoryTreeResponse, CategoryFlatResponse } from "../types"

export const categoriesApi = {
  tree() {
    return api.get<CategoryTreeResponse>("/api/catalog/categories")
  },

  flat() {
    return api.get<CategoryFlatResponse>("/api/catalog/categories", { flat: "true" })
  },
}
