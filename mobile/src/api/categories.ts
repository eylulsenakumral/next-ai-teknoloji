import { api } from "./client"
import type { CategoryTreeResponse, CategoryFlatResponse } from "../types"

export const categoriesApi = {
  tree() {
    return api.get<CategoryTreeResponse>("/api/public/categories")
  },

  flat() {
    return api.get<CategoryFlatResponse>("/api/public/categories", { flat: "true" })
  },
}
