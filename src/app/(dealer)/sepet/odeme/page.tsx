"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Loader2, Package, Lock, ExternalLink } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/use-cart"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { formatCurrency } from "@/lib/utils/format"

export default function OdemePage() {
  const { items, getGrandTotal, getSubtotal, getVatTotal } = useCart()
  const { usd } = useExchangeRate()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)

  const grandTotal = getGrandTotal()
  const subtotal = getSubtotal()
  const vatTotal = getVatTotal()
  const grandTotalTRY = usd ? grandTotal * usd : 0

  async function handlePay() {
    setIsRedirecting(true)
    setError("")
    setDebugInfo(null)

    try {
      // Step 1: Create order in DB first (status: PENDING, payment: CREDIT_CARD)
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          paymentMethod: "CREDIT_CARD",
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Sipariş oluşturulamadı")
      }

      const mpay = orderData.data.orderNumber

      // Step 2: Create NomuPay ticket with order number as MPAY
      const res = await fetch("/api/payment/nomupay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotalTRY || grandTotal,
          mpay,
          description: `Next AI - ${items.length} ürün sipariş (${mpay})`,
          paymentContent: items.map((i) => i.productName).join(", ").slice(0, 200),
        }),
      })

      const data = await res.json()
      console.log("[ODEME] API response:", data)

      if (data.success && data.returnUrl) {
        // Redirect to NomuPay hosted payment page
        window.location.href = data.returnUrl
      } else {
        setIsRedirecting(false)
        setError(data.resultMessage || "Ödeme başlatma başarısız")
        setDebugInfo(data)
      }
    } catch (err) {
      setIsRedirecting(false)
      setError(err instanceof Error ? err.message : "Bağlantı hatası oluştu.")
      console.error("[ODEME] Error:", err)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0040a4]/10">
            <Package className="h-8 w-8 text-[#0040a4]" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-[#333] mb-2">Sepetiniz boş</h1>
        <p className="text-[#767676] mb-6">Ödeme yapabilmek için sepetinize ürün ekleyin.</p>
        <Link
          href="/urunler"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0040a4] px-6 text-sm font-semibold text-white hover:bg-[#003080] transition-colors"
        >
          Ürünlere Göz At
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <Link
          href="/sepet"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5e5e5] text-[#767676] hover:text-[#0040a4] hover:border-[#0040a4] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#333]">Kredi Kartı ile Ödeme</h1>
          <p className="text-sm text-[#767676]">Güvenli ödeme sayfasına yönlendirileceksiniz</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Card */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-[#0040a4]" />
              <h2 className="font-semibold text-[#333]">Ödeme Bilgileri</h2>
            </div>

            <div className="rounded-xl bg-[#f0f5ff] border border-[#c5d9f8] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-[#0040a4] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#333]">Güvenli Ödeme</p>
                  <p className="text-[13px] text-[#767676] mt-1">
                    Kart bilgilerinizi girme işlemi NomuPay&apos;in güvenli ödeme sayfasında gerçekleşecektir.
                    Kart bilgileriniz bizim sunucularımızdan geçmez, 256-bit SSL ile korunur.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#e5e5e5] p-4 space-y-3">
              <p className="text-sm font-medium text-[#333]">Ödeme Adımları</p>
              <ol className="space-y-2 text-[13px] text-[#767676]">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0040a4] text-white text-[10px] font-bold shrink-0">1</span>
                  <span>&quot;Ödeme Sayfasına Git&quot; butonuna tıklayın</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0040a4] text-white text-[10px] font-bold shrink-0">2</span>
                  <span>NomuPay güvenli ödeme sayfasında kart bilgilerinizi girin</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0040a4] text-white text-[10px] font-bold shrink-0">3</span>
                  <span>3D Secure doğrulamasını tamamlayın</span>
                </li>
              </ol>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-medium text-red-700">{error}</p>
                {debugInfo && (
                  <pre className="mt-2 text-[11px] bg-white rounded-lg p-3 overflow-auto text-[#333]">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <Separator className="bg-[#e5e5e5]" />

            <button
              type="button"
              onClick={handlePay}
              disabled={isRedirecting}
              className="w-full h-12 rounded-xl bg-[#0040a4] text-white font-semibold text-sm hover:bg-[#003080] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Yönlendiriliyor...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Ödeme Sayfasına Git ({formatCurrency(grandTotalTRY || grandTotal, grandTotalTRY ? "TRY" : "USD")})
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 pt-1">
              <img src="/images/visa-logo.svg" alt="Visa" className="h-6 opacity-60" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <img src="/images/mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-60" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="text-[11px] text-[#999]">Güvenli ödeme altyapısı</span>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-4 sticky top-24">
            <div className="flex items-center gap-2 pb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0040a4]/10">
                <Package className="h-4 w-4 text-[#0040a4]" />
              </div>
              <h2 className="font-semibold text-base text-[#333]">Sipariş Özeti</h2>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-[#767676] truncate pr-2">{item.productName} x{item.quantity}</span>
                  <span className="text-[#333] font-medium whitespace-nowrap">
                    {formatCurrency(item.unitPriceExVat * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="bg-[#e5e5e5]" />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#767676]">Ara Toplam</span>
                <span className="text-[#333]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#767676]">KDV</span>
                <span className="text-[#333]">{formatCurrency(vatTotal)}</span>
              </div>
            </div>

            <Separator className="bg-[#e5e5e5]" />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#333]">Toplam</span>
              <span className="font-bold text-lg text-[#0040a4]">{formatCurrency(grandTotal)}</span>
            </div>

            {usd > 0 && (
              <div className="rounded-xl bg-[#f0f5ff] border border-[#c5d9f8] p-4 space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#0040a4] font-medium">TL Karşılığı (POS Tutarı)</span>
                  <span className="font-bold text-[#0040a4]">{formatCurrency(grandTotalTRY, "TRY")}</span>
                </div>
                <p className="text-[11px] text-[#767676]">
                  1 USD = {usd.toFixed(2)} TL (TCMB günlük kur)
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
