import { api } from "./client"
import type { Wishlist, WishlistMutationResponse } from "../types"

export const wishlistApi = {
  get() {
    return api.get<Wishlist>("/api/wishlist")
  },

  add(productId: string) {
    return api.post<WishlistMutationResponse>("/api/wishlist", { productId })
  },

  remove(productId: string) {
    return api.del<WishlistMutationResponse>("/api/wishlist", { productId })
  },
}
