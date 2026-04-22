"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingCart, ShoppingBag, Package, ArrowRight } from "lucide-react"
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
    <div className="flex items-center rounded-xl border border-[#e5e5e5] overflow-hidden w-fit bg-white">
      <button
        type="button"
        onClick={handleDecrement}
        className="h-9 w-9 flex items-center justify-center hover:bg-[#f3f3f3] transition-colors text-[#333333]"
        aria-label="Adeti azalt"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="w-12 text-center text-sm font-semibold tabular-nums py-1 text-[#333333]">
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={item.quantity >= item.stockQuantity}
        className="h-9 w-9 flex items-center justify-center hover:bg-[#f3f3f3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[#333333]"
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
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-5 sticky top-24">
        <div className="flex items-center gap-2 pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0040a4]/10">
            <Package className="h-4 w-4 text-[#0040a4]" />
          </div>
          <h2 className="font-semibold text-base text-[#333333]">Sipariş Özeti</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-[#767676]">Ara Toplam</span>
            <span className="font-medium text-[#333333]">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#767676]">KDV Tutarı</span>
            <span className="font-medium text-[#333333]">{formatCurrency(vatTotal)}</span>
          </div>
        </div>

        <Separator className="bg-[#e5e5e5]" />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-base text-[#333333]">Genel Toplam</span>
          <span className="font-bold text-lg text-[#0040a4]">{formatCurrency(grandTotal)}</span>
        </div>

        <Button
          className="w-full rounded-xl bg-[#0040a4] text-white hover:bg-[#0040a4] transition-colors h-12 text-sm font-semibold"
          size="lg"
          render={<Link href="/sepet/onay" />}
        >
          Siparişi Tamamla
          <ArrowRight className="h-4 w-4 ml-2" aria-hidden />
        </Button>
      </div>
    </aside>
  )
}

export default function CartPage() {
  const { items, clearCart, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center gap-8 py-16 text-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#0040a4]/10">
              <ShoppingCart className="h-12 w-12 text-[#0040a4]" aria-hidden />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-[#333333]">Sepetiniz boş</h1>
            <p className="text-[#767676] max-w-md mx-auto">
              Henüz sepetinize ürün eklemediniz. Ürünlerimizi inceleyerek alışverişe başlayabilirsiniz.
            </p>
          </div>
          <Button
            size="lg"
            className="rounded-xl bg-[#0040a4] text-white hover:bg-[#0040a4] transition-colors h-12"
            render={<Link href="/urunler" />}
          >
            Ürünlere Göz At
            <ArrowRight className="h-4 w-4 ml-2" aria-hidden />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">Alışveriş Sepetim</h1>
          <p className="text-sm text-[#767676] mt-1">
            Sepetinizde <span className="font-semibold text-[#333333]">{items.length}</span> ürün bulunuyor
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-[#767676] hover:text-red-600 hover:bg-red-50 rounded-lg h-10"
        >
          <Trash2 className="h-4 w-4 mr-2" aria-hidden />
          Sepeti Temizle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 rounded-t-2xl bg-[#f9fafb] text-xs font-semibold text-[#767676] uppercase tracking-wide">
            <span>Ürün</span>
            <span className="text-right w-28">Birim Fiyat</span>
            <span className="text-center w-32">Adet</span>
            <span className="text-right w-28">Toplam</span>
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 divide-y divide-[#f3f3f3] overflow-hidden">
            {items.map((item) => {
              const lineTotal = item.unitPriceExVat * item.quantity

              return (
                <div
                  key={item.productId}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-4 p-5 items-center hover:bg-[#fafafa] transition-colors"
                >
                  {/* Product */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-contain p-2"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#f9fafb]">
                          <Package className="h-6 w-6 text-[#767676]/40" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#0040a4] uppercase tracking-wide mb-1">{item.brandName}</p>
                      <Link
                        href={`/urunler/${item.productSlug}`}
                        className="text-sm font-semibold text-[#333333] leading-snug hover:text-[#0040a4] transition-colors line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="flex sm:block items-center justify-between sm:text-right">
                    <span className="text-xs text-[#767676] sm:hidden">Birim Fiyat</span>
                    <div className="text-sm font-medium w-28 text-right">
                      <div>
                        <span className="text-[#333333]">{formatCurrency(item.unitPriceExVat)}</span>
                        <span className="text-[10px] text-gray-400 font-normal ml-0.5">+KDV</span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-normal">
                        {formatCurrency(item.unitPriceExVat * (1 + item.vatRate / 100))}
                        <span className="text-[9px]"> KDV dahil</span>
                      </p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex sm:block items-center justify-between">
                    <span className="text-xs text-[#767676] sm:hidden">Adet</span>
                    <div className="w-32 flex justify-center">
                      <QuantityControl item={item} />
                    </div>
                  </div>

                  {/* Line Total + Remove */}
                  <div className="flex sm:block items-center justify-between sm:text-right">
                    <span className="text-xs text-[#767676] sm:hidden">Toplam</span>
                    <div className="flex items-center gap-4 sm:justify-end w-28">
                      <span className="text-base font-bold text-[#333333]">
                        {formatCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-[#767676] hover:text-red-600 transition-colors shrink-0 p-1.5 rounded-lg hover:bg-red-50"
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

          {/* Continue Shopping */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg border-[#e5e5e5] text-[#333333] hover:bg-[#f9fafb] hover:border-[#0040a4] hover:text-[#0040a4] h-10"
              render={<Link href="/urunler" />}
            >
              Alışverişe Devam Et
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <OrderSummary />
      </div>
    </div>
  )
}
