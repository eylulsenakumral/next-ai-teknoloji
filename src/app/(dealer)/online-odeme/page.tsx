"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  Wallet,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Receipt,
} from "lucide-react"
import Link from "next/link"

export default function OnlineOdemePage() {
  const { data: session } = useSession()
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    redirectUrl?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const parsedAmount = parseFloat(amount.replace(",", "."))
    if (!parsedAmount || parsedAmount <= 0) {
      setResult({ success: false, message: "Geçerli bir tutar girin." })
      setLoading(false)
      return
    }

    const mpay = `ODEME:${session?.user?.id}:${Date.now()}`

    try {
      const res = await fetch("/api/payment/nomupay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          mpay,
          description: description || "Online Ödeme",
          paymentContent: "Next AI Teknoloji - Online Ödeme",
          customerName: session?.user?.companyName || session?.user?.contactName || "",
          customerSurname: "",
          customerEmail: session?.user?.email || "",
        }),
      })

      const data = await res.json()

      if (data.success && data.redirectUrl) {
        setResult({
          success: true,
          message: "Ödeme sayfasına yönlendiriliyorsunuz...",
          redirectUrl: data.redirectUrl,
        })
        setTimeout(() => {
          window.location.href = data.redirectUrl
        }, 500)
      } else {
        setResult({
          success: false,
          message: data.resultMessage || "Ödeme başlatılamadı. Lütfen tekrar deneyin.",
        })
      }
    } catch {
      setResult({
        success: false,
        message: "Bağlantı hatası. Lütfen tekrar deneyin.",
      })
    } finally {
      setLoading(false)
    }
  }

  const companyName = session?.user?.companyName || "Bayi"

  return (
    <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-[#767676] hover:text-[#0040a4] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0040a4]">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#333]">Online Ödeme</h1>
          <p className="text-sm text-[#767676]">
            Kredi kartı ile güvenli ödeme yapın
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Ödeme Formu */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-5 w-5 text-[#0040a4]" />
              <h2 className="text-sm font-semibold text-[#333]">Ödeme Bilgileri</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tutar */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1.5">
                  Ödeme Tutarı (TL)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, "")
                      setAmount(val)
                      if (result) setResult(null)
                    }}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#e5e5e5] px-4 py-3 text-lg font-semibold text-[#333] placeholder:text-[#ccc] focus:border-[#0040a4] focus:outline-none focus:ring-2 focus:ring-[#0040a4]/20 transition-all"
                    disabled={loading}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#999]">
                    TL
                  </span>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1.5">
                  Açıklama <span className="text-[#999]">(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ödeme açıklaması..."
                  className="w-full rounded-xl border border-[#e5e5e5] px-4 py-3 text-sm text-[#333] placeholder:text-[#ccc] focus:border-[#0040a4] focus:outline-none focus:ring-2 focus:ring-[#0040a4]/20 transition-all"
                  disabled={loading}
                />
              </div>

              {/* Hesap Bilgisi */}
              <div className="rounded-xl bg-[#f8f9fa] p-4">
                <div className="flex items-center gap-2 text-sm text-[#767676]">
                  <Receipt className="h-4 w-4" />
                  <span>Hesap: <strong className="text-[#333]">{companyName}</strong></span>
                </div>
              </div>

              {/* Gönder Butonu */}
              <button
                type="submit"
                disabled={loading || !amount}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0040a4] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#003380] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ödeme başlatılıyor...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Ödeme Yap
                  </>
                )}
              </button>
            </form>

            {/* Sonuç Mesajı */}
            {result && (
              <div
                className={`mt-4 flex items-center gap-3 rounded-xl p-4 ${
                  result.success
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0" />
                )}
                <p className="text-sm font-medium">{result.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Bilgi Kartı */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
            <h3 className="text-sm font-semibold text-[#333] mb-3">Güvenli Ödeme</h3>
            <ul className="space-y-2.5 text-sm text-[#767676]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0040a4] shrink-0 mt-0.5" />
                <span>256-bit SSL şifreleme</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0040a4] shrink-0 mt-0.5" />
                <span>3D Secure doğrulama</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0040a4] shrink-0 mt-0.5" />
                <span>Tüm kredi kartları kabul edilir</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0040a4] shrink-0 mt-0.5" />
                <span>Kart bilgileriniz bizde saklanmaz</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
            <h3 className="text-sm font-semibold text-[#333] mb-3">Nasıl Çalışır?</h3>
            <ol className="space-y-2.5 text-sm text-[#767676]">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0040a4] text-[10px] font-bold text-white shrink-0">
                  1
                </span>
                <span>Ödeme tutarını girin</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0040a4] text-[10px] font-bold text-white shrink-0">
                  2
                </span>
                <span>Güvenli ödeme sayfasına yönlendirilirsiniz</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0040a4] text-[10px] font-bold text-white shrink-0">
                  3
                </span>
                <span>Kart bilgilerinizi girip onaylayın</span>
              </li>
            </ol>
          </div>

          <div className="rounded-2xl bg-[#0040a4]/5 ring-1 ring-[#0040a4]/10 p-4">
            <p className="text-xs text-[#767676] leading-relaxed">
              Ödeme işlemleri NomuPay güvenli ödeme altyapısı üzerinden gerçekleştirilmektedir.
              Sorularınız için <a href="tel:+905529895959" className="font-semibold text-[#0040a4]">0 552 989 5959</a> numarasından bize ulaşabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
