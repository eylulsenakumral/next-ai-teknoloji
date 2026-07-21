"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingCart, Package, ArrowRight, CreditCard, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/use-cart"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
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
        className="h-9 w-9 flex items-center justify-center hover:bg-[var(--color-surface-muted)] transition-colors text-[var(--color-foreground)]"
        aria-label="Adeti azalt"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="w-12 text-center text-sm font-semibold tabular-nums py-1 text-[var(--color-foreground)]">
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={item.quantity >= item.stockQuantity}
        className="h-9 w-9 flex items-center justify-center hover:bg-[var(--color-surface-muted)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-foreground)]"
        aria-label="Adeti artır"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  )
}

function OrderSummary() {
  const { getSubtotal, getVatTotal, getGrandTotal } = useCart()
  const { usd } = useExchangeRate()
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "credit-card">("transfer")
  const subtotal = getSubtotal()
  const vatTotal = getVatTotal()
  const grandTotal = getGrandTotal()
  const grandTotalTRY = usd ? grandTotal * usd : 0

  return (
    <aside className="lg:col-span-1">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-5 sticky top-24">
        <div className="flex items-center gap-2 pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
            <Package className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <h2 className="font-semibold text-base text-[var(--color-foreground)]">Sipariş Özeti</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Ara Toplam</span>
            <span className="font-medium text-[var(--color-foreground)]">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">KDV Tutarı</span>
            <span className="font-medium text-[var(--color-foreground)]">{formatCurrency(vatTotal)}</span>
          </div>
        </div>

        <Separator className="bg-[#e5e5e5]" />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-base text-[var(--color-foreground)]">Genel Toplam</span>
          <span className="font-bold text-lg text-[var(--color-primary)]">{formatCurrency(grandTotal)}</span>
        </div>

        {usd > 0 && (
          <div className="rounded-xl bg-[#f0f5ff] border border-[#c5d9f8] p-4 space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--color-primary)] font-medium">TL Karsiligi</span>
              <span className="font-bold text-[var(--color-primary)]">{formatCurrency(grandTotalTRY, "TRY")}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              1 USD = {usd.toFixed(2)} TL (TCMB gunluk kur)
            </p>
          </div>
        )}

        {/* Ödeme Yöntemi Seçimi */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Ödeme Yöntemi</p>

          {/* Havale / EFT */}
          <button
            type="button"
            onClick={() => setPaymentMethod("transfer")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              paymentMethod === "transfer"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "border-[#e5e5e5] hover:border-[#ccc] bg-white"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
              paymentMethod === "transfer" ? "bg-[var(--color-primary)]/10" : "bg-[var(--color-surface-muted)]"
            }`}>
              <Truck className={`h-5 w-5 ${paymentMethod === "transfer" ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${paymentMethod === "transfer" ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"}`}>
                Havale / EFT
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Banka havalesi ile ödeme
              </p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              paymentMethod === "transfer" ? "border-[var(--color-primary)]" : "border-[#ccc]"
            }`}>
              {paymentMethod === "transfer" && (
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </div>
          </button>

          {/* Kredi Kartı */}
          <button
            type="button"
            onClick={() => setPaymentMethod("credit-card")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              paymentMethod === "credit-card"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "border-[#e5e5e5] hover:border-[#ccc] bg-white"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
              paymentMethod === "credit-card" ? "bg-[var(--color-primary)]/10" : "bg-[var(--color-surface-muted)]"
            }`}>
              <CreditCard className={`h-5 w-5 ${paymentMethod === "credit-card" ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${paymentMethod === "credit-card" ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"}`}>
                Kredi Kartı
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Taksitli veya tek çekim
              </p>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              paymentMethod === "credit-card" ? "border-[var(--color-primary)]" : "border-[#ccc]"
            }`}>
              {paymentMethod === "credit-card" && (
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </div>
          </button>
        </div>

        <Link
          href={paymentMethod === "credit-card" ? "/sepet/odeme" : "/sepet/onay"}
          className="w-full rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors h-12 text-sm font-semibold inline-flex items-center justify-center gap-2"
        >
          {paymentMethod === "credit-card" ? "Kredi Kartı ile Öde" : "Siparişi Tamamla"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
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
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
              <ShoppingCart className="h-12 w-12 text-[var(--color-primary)]" aria-hidden />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Sepetiniz boş</h1>
            <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
              Henüz sepetinize ürün eklemediniz. Ürünlerimizi inceleyerek alışverişe başlayabilirsiniz.
            </p>
          </div>
          <Link
            href="/urunler"
            className="rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors h-12 px-6 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            Ürünlere Göz At
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Alışveriş Sepetim</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Sepetinizde <span className="font-semibold text-[var(--color-foreground)]">{items.length}</span> ürün bulunuyor
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg h-10"
        >
          <Trash2 className="h-4 w-4 mr-2" aria-hidden />
          Sepeti Temizle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 rounded-t-2xl bg-[#f9fafb] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            <span>Ürün</span>
            <span className="text-right w-28">Birim Fiyat</span>
            <span className="text-center w-32">Adet</span>
            <span className="text-right w-28">Toplam</span>
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 divide-y divide-[var(--color-surface-muted)] overflow-hidden">
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
                          <Package className="h-6 w-6 text-[var(--color-text-muted)]/40" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-primary)] uppercase tracking-wide mb-1">{item.brandName}</p>
                      <Link
                        href={`/urunler/${item.productSlug}`}
                        className="text-sm font-semibold text-[var(--color-foreground)] leading-snug hover:text-[var(--color-primary)] transition-colors line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="flex sm:block items-center justify-between sm:text-right">
                    <span className="text-xs text-[var(--color-text-muted)] sm:hidden">Birim Fiyat</span>
                    <div className="text-sm font-medium w-28 text-right">
                      <div>
                        <span className="text-[var(--color-foreground)]">{formatCurrency(item.unitPriceExVat)}</span>
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
                    <span className="text-xs text-[var(--color-text-muted)] sm:hidden">Adet</span>
                    <div className="w-32 flex justify-center">
                      <QuantityControl item={item} />
                    </div>
                  </div>

                  {/* Line Total + Remove */}
                  <div className="flex sm:block items-center justify-between sm:text-right">
                    <span className="text-xs text-[var(--color-text-muted)] sm:hidden">Toplam</span>
                    <div className="flex items-center gap-4 sm:justify-end w-28">
                      <span className="text-base font-bold text-[var(--color-foreground)]">
                        {formatCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-[var(--color-text-muted)] hover:text-red-600 transition-colors shrink-0 p-1.5 rounded-lg hover:bg-red-50"
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
            <Link
              href="/urunler"
              className="rounded-lg border border-[#e5e5e5] text-[var(--color-foreground)] hover:bg-[#f9fafb] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] h-10 px-4 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              Alışverişe Devam Et
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <OrderSummary />
      </div>
    </div>
  )
}
