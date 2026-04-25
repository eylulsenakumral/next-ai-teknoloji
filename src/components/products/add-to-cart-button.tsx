"use client"

import { useState } from "react"
import { ShoppingCart, Minus, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toaster"
import { useCart } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps {
  productId: string
  productName: string
  productSlug: string
  brandName: string
  imageUrl: string
  unitPriceExVat: number
  vatRate: number
  stockQuantity: number
  minOrderQuantity?: number
  isAvailable: boolean
  className?: string
}

export function AddToCartButton({
  productId,
  productName,
  productSlug,
  brandName,
  imageUrl,
  unitPriceExVat,
  vatRate,
  stockQuantity,
  minOrderQuantity = 1,
  isAvailable,
  className,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(minOrderQuantity)
  const [isAdded, setIsAdded] = useState(false)
  const { addItem, items, openCart } = useCart()

  const cartItem = items.find((i) => i.productId === productId)
  const cartQuantity = cartItem?.quantity ?? 0

  function handleDecrement() {
    setQuantity((prev) => Math.max(minOrderQuantity, prev - 1))
  }

  function handleIncrement() {
    setQuantity((prev) => Math.min(prev + 1, stockQuantity))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= minOrderQuantity && val <= stockQuantity) {
      setQuantity(val)
    }
  }

  function handleAdd() {
    if (!isAvailable) return

    addItem({
      productId,
      productName,
      productSlug,
      brandName,
      imageUrl,
      unitPriceExVat,
      vatRate,
      minOrderQuantity,
      stockQuantity,
      quantity,
    })

    toast({
      title: "Sepete eklendi",
      description: `${productName} (${quantity} adet) sepetinize eklendi.`,
    })

    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  if (!isAvailable) {
    return (
      <Button
        size="lg"
        disabled
        className={cn("w-full gap-2 cursor-not-allowed", className)}
        aria-label="Ürün stokta yok"
      >
        <ShoppingCart className="h-5 w-5" aria-hidden />
        Stokta Yok
      </Button>
    )
  }

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* Miktar seçici */}
      <div className="flex items-center rounded-lg border overflow-hidden shrink-0">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= minOrderQuantity}
          className="h-9 w-9 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Adeti azalt"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <Input
          id={`qty-${productId}`}
          type="number"
          min={minOrderQuantity}
          max={stockQuantity}
          value={quantity}
          onChange={handleInputChange}
          className="h-9 w-14 border-0 border-x rounded-none text-center text-sm font-medium focus-visible:ring-0"
          aria-label="Ürün adedi"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={quantity >= stockQuantity}
          className="h-9 w-9 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Adeti artır"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {minOrderQuantity > 1 && (
        <span className="text-xs text-muted-foreground">
          Min. {minOrderQuantity} adet
        </span>
      )}

      {/* Sepete Ekle butonu */}
      <Button
        size="lg"
        onClick={handleAdd}
        className={cn(
          "gap-2 transition-all duration-200",
          isAdded && "bg-emerald-600 hover:bg-emerald-700"
        )}
        aria-label={`${productName} - ${quantity} adet sepete ekle`}
      >
        {isAdded ? (
          <>
            <Check className="h-5 w-5" aria-hidden />
            Eklendi
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" aria-hidden />
            Sepete Ekle
          </>
        )}
      </Button>

      {/* Sepette kaç adet olduğu */}
      {cartQuantity > 0 && (
        <button
          type="button"
          onClick={openCart}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Sepette {cartQuantity} adet
        </button>
      )}
    </div>
  )
}
