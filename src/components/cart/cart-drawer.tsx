"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

function CartItemRow({
  item,
}: {
  item: {
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
}) {
  const { updateQuantity, removeItem } = useCart()
  const lineTotal = item.unitPriceExVat * item.quantity

  function handleDecrement() {
    if (item.quantity <= item.minOrderQuantity) {
      removeItem(item.productId)
    } else {
      updateQuantity(item.productId, item.quantity - 1)
    }
  }

  function handleIncrement() {
    updateQuantity(item.productId, item.quantity + 1)
  }

  return (
    <div className="flex gap-3 py-3">
      {/* Ürün görseli */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            className="object-contain p-1"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-muted-foreground/40" aria-hidden />
          </div>
        )}
      </div>

      {/* Ürün bilgisi */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{item.brandName}</p>
        <Link
          href={`/urunler/${item.productSlug}`}
          className="text-sm font-medium leading-tight line-clamp-2 hover:underline"
        >
          {item.productName}
        </Link>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(item.unitPriceExVat)} / adet (KDV hariç)
        </p>

        {/* Adet seçici + kaldır */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={handleDecrement}
              className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
              aria-label="Adeti azalt"
            >
              <Minus className="h-3 w-3" aria-hidden />
            </button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={item.quantity >= item.stockQuantity}
              className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Adeti artır"
            >
              <Plus className="h-3 w-3" aria-hidden />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {formatCurrency(lineTotal)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`${item.productName} sepetten kaldır`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const { items, isOpen, closeCart, getSubtotal, getVatTotal, getGrandTotal } =
    useCart()

  const subtotal = getSubtotal()
  const vatTotal = getVatTotal()
  const grandTotal = getGrandTotal()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className={cn("flex flex-col w-full sm:max-w-md p-0 gap-0")}>
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" aria-hidden />
            Sepetim
            {items.length > 0 && (
              <span className="ml-1 text-muted-foreground font-normal text-sm">
                ({items.length} ürün)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-semibold">Sepetiniz boş</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ürünleri inceleyerek sepetinize ekleyebilirsiniz.
              </p>
            </div>
            <Button render={<Link href="/urunler" onClick={closeCart} />}>
              Ürünlere Göz At
            </Button>
          </div>
        ) : (
          <>
            {/* Ürün listesi */}
            <div className="flex-1 overflow-y-auto px-4 divide-y">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>

            {/* Sipariş özeti + aksiyonlar */}
            <div className="border-t px-4 py-4 space-y-3 bg-muted/30">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ara Toplam (KDV hariç)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KDV</span>
                  <span>{formatCurrency(vatTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Genel Toplam</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/sepet"
                  onClick={closeCart}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e0e0e0] bg-white px-4 text-sm font-medium text-[#333333] transition-colors hover:bg-[#f9f9f9]"
                >
                  Sepeti Görüntüle
                </Link>
                <Link
                  href="/sepet/onay"
                  onClick={closeCart}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[#00179e] px-4 text-sm font-medium text-white transition-colors hover:bg-[#001380]"
                >
                  Siparişi Tamamla
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
