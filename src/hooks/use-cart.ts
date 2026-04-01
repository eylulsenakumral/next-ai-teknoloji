"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  productName: string
  productSlug: string
  brandName: string
  imageUrl: string
  unitPriceExVat: number
  vatRate: number
  quantity: number
  minOrderQuantity: number
  stockQuantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
  getVatTotal: () => number
  getGrandTotal: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (incoming) => {
        const quantity = incoming.quantity ?? incoming.minOrderQuantity ?? 1
        const existing = get().items.find(
          (i) => i.productId === incoming.productId
        )

        if (existing) {
          const newQty = existing.quantity + quantity
          const clamped = Math.min(newQty, incoming.stockQuantity)
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === incoming.productId
                ? { ...i, quantity: clamped }
                : i
            ),
          }))
        } else {
          const clamped = Math.min(
            Math.max(quantity, incoming.minOrderQuantity),
            incoming.stockQuantity
          )
          set((state) => ({
            items: [
              ...state.items,
              {
                ...incoming,
                quantity: clamped,
              },
            ],
          }))
        }
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) => {
        const item = get().items.find((i) => i.productId === productId)
        if (!item) return

        const clamped = Math.min(
          Math.max(quantity, item.minOrderQuantity),
          item.stockQuantity
        )

        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: clamped } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (sum, i) => sum + i.unitPriceExVat * i.quantity,
          0
        ),

      getVatTotal: () =>
        get().items.reduce(
          (sum, i) =>
            sum + i.unitPriceExVat * i.quantity * (i.vatRate / 100),
          0
        ),

      getGrandTotal: () => {
        const { getSubtotal, getVatTotal } = get()
        return getSubtotal() + getVatTotal()
      },
    }),
    {
      name: "next-ai-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
)
