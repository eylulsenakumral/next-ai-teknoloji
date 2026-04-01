"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingCart, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils/format"
import type { CartItem } from "@/hooks/use-cart"

function QuantityControl({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart()

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
    <div className="flex items-center rounded-md border overflow-hidden w-fit">
      <button
        type="button"
        onClick={handleDecrement}
        className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
        aria-label="Adeti azalt"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="w-10 text-center text-sm font-medium tabular-nums py-1">
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={item.quantity >= item.stockQuantity}
        className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Adeti artır"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}

function OrderSummary() {
  const { getSubtotal, getVatTotal, getGrandTotal } = useCart()
  const subtotal = getSubtotal()
  const vatTotal = getVatTotal()
  const grandTotal = getGrandTotal()

  return (
    <aside className="lg:col-span-1">
      <div className="rounded-xl border bg-card p-5 space-y-4 sticky top-20">
        <h2 className="font-semibold text-base">Sipariş Özeti</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ara Toplam (KDV hariç)</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">KDV Tutarı</span>
            <span className="font-medium">{formatCurrency(vatTotal)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-base">
          <span>Genel Toplam</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>

        <Button className="w-full" size="lg" render={<Link href="/sepet/onay" />}>
          <ShoppingBag className="h-4 w-4 mr-2" aria-hidden />
          Siparişi Tamamla
        </Button>
      </div>
    </aside>
  )
}

export default function CartPage() {
  const { items, clearCart, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="rounded-full bg-muted p-6">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Sepetiniz boş</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Henüz sepetinize ürün eklemediniz. Ürünlerimizi inceleyerek başlayabilirsiniz.
          </p>
        </div>
        <Button size="lg" render={<Link href="/urunler" />}>
          Ürünlere Göz At
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sayfa başlığı */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sepetim</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1.5" aria-hidden />
          Sepeti Temizle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ürün tablosu */}
        <div className="lg:col-span-2 space-y-3">
          {/* Desktop tablo başlığı */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Ürün</span>
            <span className="text-right w-24">Birim Fiyat</span>
            <span className="text-center w-28">Adet</span>
            <span className="text-right w-24">Toplam</span>
          </div>

          <div className="rounded-xl border divide-y bg-card">
            {items.map((item) => {
              const lineTotal = item.unitPriceExVat * item.quantity

              return (
                <div
                  key={item.productId}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-4 p-4 items-center"
                >
                  {/* Ürün */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
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
                          <ShoppingCart className="h-5 w-5 text-muted-foreground/40" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{item.brandName}</p>
                      <Link
                        href={`/urunler/${item.productSlug}`}
                        className="text-sm font-medium leading-snug hover:underline line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                    </div>
                  </div>

                  {/* Birim fiyat */}
                  <div className="flex sm:block items-center justify-between sm:text-right">
                    <span className="text-xs text-muted-foreground sm:hidden">Birim Fiyat</span>
                    <div className="text-sm font-medium w-24 text-right">
                      <span>{formatCurrency(item.unitPriceExVat)}</span>
                      <p className="text-[10px] text-muted-foreground font-normal">KDV hariç</p>
                    </div>
                  </div>

                  {/* Adet */}
                  <div className="flex sm:block items-center justify-between">
                    <span className="text-xs text-muted-foreground sm:hidden">Adet</span>
                    <div className="w-28 flex justify-center">
                      <QuantityControl item={item} />
                    </div>
                  </div>

                  {/* Toplam + kaldır */}
                  <div className="flex sm:block items-center justify-between sm:text-right">
                    <span className="text-xs text-muted-foreground sm:hidden">Toplam</span>
                    <div className="flex items-center gap-3 sm:justify-end w-24">
                      <span className="text-sm font-semibold">
                        {formatCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        aria-label={`${item.productName} sepetten kaldır`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Alışverişe devam */}
          <div className="pt-2">
            <Button variant="outline" size="sm" render={<Link href="/urunler" />}>
              Alışverişe Devam Et
            </Button>
          </div>
        </div>

        {/* Sipariş özeti */}
        <OrderSummary />
      </div>
    </div>
  )
}
