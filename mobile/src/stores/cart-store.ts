import { create } from "zustand"
import type { Cart } from "../types"
import { cartApi } from "../api/cart"

interface CartState {
  cart: Cart | null
  isLoading: boolean
  itemCount: number

  fetch: () => Promise<void>
  addItem: (productId: string, quantity: number) => Promise<void>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
}

function countItems(cart: Cart | null): number {
  if (!cart) return 0
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  itemCount: 0,

  fetch: async () => {
    set({ isLoading: true })
    try {
      const cart = await cartApi.get()
      set({ cart, itemCount: countItems(cart), isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addItem: async (productId, quantity) => {
    await cartApi.add(productId, quantity)
    await get().fetch()
  },

  updateItem: async (itemId, quantity) => {
    await cartApi.update(itemId, quantity)
    await get().fetch()
  },

  removeItem: async (itemId) => {
    const prevCart = get().cart
    if (prevCart) {
      const updated = { ...prevCart, items: prevCart.items.filter((i) => i.id !== itemId) }
      set({ cart: updated, itemCount: countItems(updated) })
    }
    try {
      await cartApi.remove(itemId)
    } catch {
      if (prevCart) set({ cart: prevCart, itemCount: countItems(prevCart) })
    } finally {
      await get().fetch()
    }
  },

  clearCart: async () => {
    await cartApi.clear()
    set({ cart: null, itemCount: 0 })
  },
}))
