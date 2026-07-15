"use client"

import { useState } from "react"
import { ShoppingCart, CheckCircle, Loader2 } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useRouter } from "next/navigation"

interface SetProductItem {
  id: string
  name: string
  slug: string
  images: string[]
  brand: { name: string } | null
  stockStatus: boolean
  quantity: number
}

interface AddSetToCartButtonProps {
  setId: string
  setName: string
  products: SetProductItem[]
  setPrice: string | null
  discountPct: number | null
  currency: string
  stockQuantity: number | null
}

export function AddSetToCartButton({
  setId,
  setName,
  products,
  setPrice,
  discountPct,
  currency,
  stockQuantity,
}: AddSetToCartButtonProps) {
  const router = useRouter()
  const { addItem, openCart } = useCart()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const isOutOfStock = stockQuantity !== null && stockQuantity <= 0
  const hasProducts = products.length > 0

  async function handleAddToCart() {
    if (isOutOfStock || !hasProducts) return
    setAdding(true)

    try {
      const vatRate = 0.20
      const price = setPrice ? Number(setPrice) : 0
      const finalPrice = discountPct ? price * (1 - discountPct / 100) : price

      // Seti tek sepet öğesi olarak ekle
      const firstProduct = products[0]
      addItem({
        productId: `set-${setId}`,
        productName: `[Set] ${setName}`,
        productSlug: "",
        brandName: "",
        imageUrl: firstProduct?.images?.[0] ?? "",
        unitPriceExVat: finalPrice,
        vatRate,
        quantity: 1,
        minOrderQuantity: 1,
        stockQuantity: stockQuantity ?? 9999,
      })

      setAdded(true)
      openCart()
      setTimeout(() => setAdded(false), 3000)
    } catch {
      alert("Sepete eklenirken hata oluştu.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={adding || isOutOfStock || !hasProducts}
      className={`
        inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold
        transition-all duration-300
        ${added
          ? "bg-emerald-600 text-white"
          : isOutOfStock
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#1477ff] text-white hover:bg-[#003080] active:scale-95"
        }
      `}
    >
      {added ? (
        <>
          <CheckCircle className="h-4 w-4" />
          Eklendi!
        </>
      ) : adding ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Ekleniyor...
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Seti Sepete Ekle
        </>
      )}
    </button>
  )
}
