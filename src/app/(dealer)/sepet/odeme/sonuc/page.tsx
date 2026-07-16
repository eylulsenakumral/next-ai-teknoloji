"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import { useCart } from "@/hooks/use-cart"

function SonucContent() {
  const params = useSearchParams()
  const status = params.get("status")
  const order = params.get("order")
  const msg = params.get("msg")
  const { clearCart } = useCart()

  // Clear cart on successful payment
  useEffect(() => {
    if (status === "success") {
      clearCart()
    }
  }, [status, clearCart])

  if (status === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#333] mb-2">Ödeme Başarılı</h1>
        {order && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 mb-4">
            <span className="text-sm text-[var(--color-text-muted)]">Sipariş No:</span>
            <span className="text-lg font-bold text-[var(--color-primary)] font-mono">{order}</span>
          </div>
        )}
        <p className="text-[var(--color-text-muted)] mb-8">Siparişiniz başarıyla alınmıştır.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/siparisler"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Siparişlerime Git
          </Link>
          <Link
            href="/urunler"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e5e5e5] px-6 text-sm font-semibold text-[#333] hover:bg-[#f9fafb] transition-colors"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-[#333] mb-2">Ödeme Başarısız</h1>
      {msg && <p className="text-[var(--color-text-muted)] mb-2">{msg}</p>}
      <p className="text-sm text-[#999] mb-8">Lütfen tekrar deneyin veya bizimle iletişime geçin.</p>
      <Link
        href="/sepet/odeme"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        Tekrar Dene
      </Link>
    </div>
  )
}

export default function SonucPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-[var(--color-text-muted)]">Yükleniyor...</div>}>
      <SonucContent />
    </Suspense>
  )
}
