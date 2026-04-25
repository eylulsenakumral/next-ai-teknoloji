import { api } from "./client"
import type { Cart, CartMutationResponse } from "../types"

export const cartApi = {
  get() {
    return api.get<Cart>("/api/cart")
  },

  add(productId: string, quantity: number) {
    return api.post<CartMutationResponse>("/api/cart", { productId, quantity })
  },

  update(itemId: string, quantity: number) {
    return api.put<CartMutationResponse>("/api/cart", { itemId, quantity })
  },

  remove(itemId: string) {
    return api.del<CartMutationResponse>("/api/cart", { itemId })
  },

  clear() {
    return api.del<CartMutationResponse>("/api/cart")
  },
}
