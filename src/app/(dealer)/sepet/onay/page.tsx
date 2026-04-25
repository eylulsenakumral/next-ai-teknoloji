"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  CreditCard,
  FileText,
  Package,
  Loader2,
  Building2,
  User,
  Phone,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CityDistrictSelector } from "@/components/ui/city-district-selector"
import { OrderSummary } from "@/components/orders/order-summary"
import { useCart } from "@/hooks/use-cart"
import { formatCurrency } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import type { Session } from "next-auth"

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

interface ShippingFormData {
  companyName: string
  contactName: string
  phone: string
  address: string
  city: string
  district: string
  postalCode: string
  cityId: number | null
  districtId: number | null
}

type PaymentMethod = "BANK_TRANSFER" | "ON_ACCOUNT" | "CREDIT_CARD"

// ---------------------------------------------------------------------------
// Ödeme yöntemi kartı
// ---------------------------------------------------------------------------

function PaymentOption({
  value,
  selected,
  title,
  description,
  icon: Icon,
  onSelect,
}: {
  value: PaymentMethod
  selected: boolean
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onSelect: (v: PaymentMethod) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
        selected
          ? "border-[#0040a4] bg-[#0040a4]/5 ring-1 ring-[#0040a4]/20"
          : "border-[#e5e5e5] bg-white hover:border-[#0040a4]/50 hover:bg-[#f9fafb]"
      )}
      aria-pressed={selected}
    >
      <div
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected
            ? "border-[#0040a4] bg-[#0040a4]"
            : "border-[#cccccc] bg-white"
        )}
        aria-hidden
      >
        {selected && (
          <div className="h-2 w-2 rounded-full bg-white" />
        )}
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0040a4]/10">
        <Icon className={cn(
          "h-5 w-5",
          selected ? "text-[#0040a4]" : "text-[#767676]"
        )} />
      </div>
      <div className="flex-1">
        <p className={cn(
          "text-sm font-semibold",
          selected ? "text-[#0040a4]" : "text-[#333333]"
        )}>{title}</p>
        <p className="mt-1 text-xs text-[#767676] leading-relaxed">{description}</p>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Başarı ekranı
// ---------------------------------------------------------------------------

function SuccessView({
  orderNumber,
  paymentMethod,
  grandTotal,
  usdTry,
}: {
  orderNumber: string
  paymentMethod: PaymentMethod
  grandTotal: number
  usdTry: number
}) {
  const totalTL = grandTotal * usdTry

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center justify-center gap-8 py-16 text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-100 ring-8 ring-emerald-50">
            <CheckCircle2
              className="h-12 w-12 text-emerald-600"
              aria-hidden
            />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-[#333333]">Siparişiniz Alındı!</h1>
          <p className="text-[#767676] max-w-md mx-auto">
            Siparişiniz başarıyla oluşturuldu. En kısa sürede işleme alınacaktır.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0040a4]/10 border border-[#0040a4]/20">
            <span className="text-sm text-[#767676]">Sipariş Numarası:</span>
            <span className="text-lg font-bold text-[#0040a4] font-mono">{orderNumber}</span>
          </div>
        </div>

        {/* Havale/EFT IBAN Bilgileri */}
        {paymentMethod === "BANK_TRANSFER" && (
          <div className="w-full max-w-md rounded-2xl bg-[#f0f6ff] border border-[#0040a4]/20 p-6 text-left space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#0040a4]" />
              <span className="text-base font-semibold text-[#0040a4]">Havale / EFT Bilgileri</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#767676]">Hesap Sahibi</span>
                <span className="font-semibold text-[#333333]">Next AI Teknoloji Yazılım San ve Tic Ltd Şti</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#767676]">IBAN</span>
                <span className="font-mono font-semibold text-[#333333] tracking-wide">TR72 0006 2000 0450 0006 2885 83</span>
              </div>
              <div className="flex flex-col gap-0.5 pt-3 border-t border-[#0040a4]/10">
                <span className="text-xs text-[#767676]">Ödenecek Tutar (TL Karşılığı)</span>
                <span className="font-bold text-[#0040a4] text-lg">{formatCurrency(totalTL, "TRY")}</span>
                <span className="text-[10px] text-[#767676]">({formatCurrency(grandTotal)} · 1 USD = {usdTry} TL)</span>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Havale açıklamasına mutlaka <strong>sipariş numaranızı ({orderNumber})</strong> yazınız. Aksi halde ödemeniz eşleştirilemeyebilir.
              </p>
            </div>
          </div>
        )}

        <p className="max-w-lg text-sm text-[#767676] leading-relaxed">
          Siparişiniz onaylandığında ve kargo durumu güncellendiğinde sizi bilgilendireceğiz.
          Sipariş detaylarınızı {" "}
          <Link href="/siparisler" className="text-[#0040a4] font-semibold hover:underline">
            Siparişlerim
          </Link>
          {" "} sayfasından takip edebilirsiniz.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/siparisler"
            className="rounded-xl bg-[#0040a4] text-white hover:bg-[#003080] transition-colors h-12 px-6 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            Siparişlerime Git
          </Link>
          <Link
            href="/urunler"
            className="rounded-xl border border-[#e5e5e5] text-[#333333] hover:bg-[#f9fafb] hover:border-[#0040a4] hover:text-[#0040a4] h-12 px-6 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ana sayfa
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession() as { data: Session | null }
  const { items, getSubtotal, getVatTotal, getGrandTotal, clearCart } = useCart()

  const [shippingForm, setShippingForm] = useState<ShippingFormData>({
    companyName: (session?.user as { companyName?: string })?.companyName ?? "",
    contactName: (session?.user as { contactName?: string })?.contactName ?? "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
    cityId: null,
    districtId: null,
  })

  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER")
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [usdTry, setUsdTry] = useState<number>(Number(process.env.NEXT_PUBLIC_USD_TRY) || 38.5)

  // TCMB'den güncel kur çek
  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((data) => {
        if (data.usd) setUsdTry(data.usd)
      })
      .catch(() => {})
  }, [])

  const subtotal = getSubtotal()
  const vatTotal = getVatTotal()
  const grandTotal = getGrandTotal()

  useEffect(() => {
    setIsClient(true)
    // Bayi cari kartından adres bilgilerini çek
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const d = json.data
          setShippingForm((prev) => ({
            ...prev,
            companyName: d.companyName || prev.companyName,
            contactName: d.contactName || prev.contactName,
            phone: d.phone || d.whatsappPhone || "",
            address: d.address || "",
            city: d.city || "",
            district: d.district || "",
            postalCode: d.postalCode || "",
          }))
        }
      })
      .catch(() => {})
  }, [])

  // Sepet boşsa yönlendir (client-side only)
  useEffect(() => {
    if (isClient && items.length === 0 && !orderNumber) {
      router.replace("/sepet")
    }
  }, [isClient, items.length, orderNumber, router])

  if (!isClient || (items.length === 0 && !orderNumber)) {
    return null
  }

  if (orderNumber) {
    return <SuccessView orderNumber={orderNumber} paymentMethod={paymentMethod} grandTotal={grandTotal} usdTry={usdTry} />
  }

  function updateField(field: keyof ShippingFormData, value: string) {
    setShippingForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ShippingFormData, string>> = {}

    if (shippingForm.companyName.trim().length < 2) {
      newErrors.companyName = "Firma adı en az 2 karakter olmalı"
    }
    if (shippingForm.contactName.trim().length < 2) {
      newErrors.contactName = "Yetkili adı en az 2 karakter olmalı"
    }
    if (shippingForm.phone.trim().length < 10) {
      newErrors.phone = "Geçerli bir telefon numarası girin"
    }
    if (shippingForm.address.trim().length < 10) {
      newErrors.address = "Adres en az 10 karakter olmalı"
    }
    if (!shippingForm.cityId) {
      newErrors.city = "Lütfen il seçin"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Kredi kartı → ödeme sayfasına yönlendir
    if (paymentMethod === "CREDIT_CARD") {
      router.push("/sepet/odeme")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          companyName: shippingForm.companyName.trim(),
          contactName: shippingForm.contactName.trim(),
          phone: shippingForm.phone.trim(),
          address: shippingForm.address.trim(),
          city: shippingForm.city.trim(),
          district: shippingForm.district.trim() || undefined,
          postalCode: shippingForm.postalCode.trim() || undefined,
          country: "TR",
        },
        notes: notes.trim() || undefined,
        paymentMethod,
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? "Sipariş oluşturulamadı.")
      }

      clearCart()
      setOrderNumber(json.data.orderNumber)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Sipariş oluşturulamadı.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/sepet"
          className="rounded-xl hover:bg-[#f9fafb] h-10 w-10 text-[#767676] inline-flex items-center justify-center transition-colors"
          aria-label="Sepete dön"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">Sipariş Onayı</h1>
          <p className="text-sm text-[#767676]">Lütfen teslimat adresi ve ödeme bilgilerinizi kontrol edin</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon: Adres + Not + Ödeme */}
          <div className="lg:col-span-2 space-y-5">
            {/* Teslimat Adresi */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="border-b border-[#f3f3f3] px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0040a4]/10">
                    <MapPin className="h-4 w-4 text-[#0040a4]" />
                  </div>
                  <h2 className="text-base font-semibold text-[#333333]">Teslimat Adresi</h2>
                </div>
                <p className="mt-1 text-xs text-[#767676]">Siparişinizin teslim edileceği adres bilgileri</p>
              </div>
              <div className="p-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="companyName" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <Building2 className="h-3.5 w-3.5 text-[#767676]" />
                    Firma / Ad Soyad
                  </Label>
                  <Input
                    id="companyName"
                    value={shippingForm.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Firma adı veya ad soyad"
                    className="rounded-lg border-[#e5e5e5] focus:border-[#0040a4] focus:ring-[#0040a4]/20"
                    aria-invalid={!!errors.companyName}
                    aria-describedby={errors.companyName ? "companyName-error" : undefined}
                  />
                  {errors.companyName && (
                    <p id="companyName-error" className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <User className="h-3.5 w-3.5 text-[#767676]" />
                    Yetkili Ad Soyad
                  </Label>
                  <Input
                    id="contactName"
                    value={shippingForm.contactName}
                    onChange={(e) => updateField("contactName", e.target.value)}
                    placeholder="Yetkili ad soyad"
                    className="rounded-lg border-[#e5e5e5] focus:border-[#0040a4] focus:ring-[#0040a4]/20"
                    aria-invalid={!!errors.contactName}
                    aria-describedby={errors.contactName ? "contactName-error" : undefined}
                  />
                  {errors.contactName && (
                    <p id="contactName-error" className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contactName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <Phone className="h-3.5 w-3.5 text-[#767676]" />
                    Telefon Numarası
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={shippingForm.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="0(5XX) XXX XX XX"
                    className="rounded-lg border-[#e5e5e5] focus:border-[#0040a4] focus:ring-[#0040a4]/20"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <MapPin className="h-3.5 w-3.5 text-[#767676]" />
                    Açık Adres
                  </Label>
                  <Textarea
                    id="address"
                    value={shippingForm.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Mahalle, sokak, bina, daire..."
                    rows={3}
                    className="rounded-lg border-[#e5e5e5] focus:border-[#0040a4] focus:ring-[#0040a4]/20 resize-none"
                    aria-invalid={!!errors.address}
                    aria-describedby={errors.address ? "address-error" : undefined}
                  />
                  {errors.address && (
                    <p id="address-error" className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.address}
                    </p>
                  )}
                </div>

                <CityDistrictSelector
                  cityId={shippingForm.cityId}
                  districtId={shippingForm.districtId}
                  onCityChange={(cityId, cityName) => {
                    setShippingForm((prev) => ({
                      ...prev,
                      cityId,
                      city: cityName,
                      districtId: null,
                      district: "",
                    }))
                    if (errors.city) {
                      setErrors((prev) => ({ ...prev, city: undefined }))
                    }
                  }}
                  onDistrictChange={(districtId, districtName) => {
                    setShippingForm((prev) => ({
                      ...prev,
                      districtId,
                      district: districtName,
                    }))
                  }}
                  className="sm:col-span-2 grid gap-5 sm:grid-cols-2"
                />
                {errors.city && (
                  <p className="flex items-center gap-1 text-xs text-red-600 sm:col-span-2">
                    <AlertCircle className="h-3 w-3" />
                    {errors.city}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-sm text-[#333333]">Posta Kodu</Label>
                  <Input
                    id="postalCode"
                    value={shippingForm.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    placeholder="34710"
                    maxLength={10}
                    className="rounded-lg border-[#e5e5e5] focus:border-[#0040a4] focus:ring-[#0040a4]/20"
                  />
                  <p className="text-xs text-[#767676]">İsteğe bağlı</p>
                </div>
              </div>
            </div>

            {/* Ödeme Yöntemi */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="border-b border-[#f3f3f3] px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0040a4]/10">
                    <CreditCard className="h-4 w-4 text-[#0040a4]" />
                  </div>
                  <h2 className="text-base font-semibold text-[#333333]">Ödeme Yöntemi</h2>
                </div>
                <p className="mt-1 text-xs text-[#767676]">Size en uygun ödeme seçeneğini seçin</p>
              </div>
              <div className="p-6 space-y-3">
                <PaymentOption
                  value="BANK_TRANSFER"
                  selected={paymentMethod === "BANK_TRANSFER"}
                  title="Havale / EFT"
                  description="Sipariş onayından sonra banka hesabımıza ödeme yapabilirsiniz."
                  icon={CreditCard}
                  onSelect={setPaymentMethod}
                />
                <PaymentOption
                  value="CREDIT_CARD"
                  selected={paymentMethod === "CREDIT_CARD"}
                  title="Kredi / Banka Kartı"
                  description="Güvenli ödeme sayfasına yönlendirileceksiniz."
                  icon={CreditCard}
                  onSelect={setPaymentMethod}
                />
                <PaymentOption
                  value="ON_ACCOUNT"
                  selected={paymentMethod === "ON_ACCOUNT"}
                  title="Açık Hesap (Cari)"
                  description="Tutar cari hesabınıza borç olarak kaydedilir."
                  icon={Package}
                  onSelect={setPaymentMethod}
                />

                {/* IBAN Bilgileri */}
                {paymentMethod === "BANK_TRANSFER" && (
                  <div className="mt-4 rounded-xl bg-[#f0f6ff] border border-[#0040a4]/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#0040a4]" />
                      <span className="text-sm font-semibold text-[#0040a4]">Banka Hesap Bilgileri</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-[#767676]">Hesap Sahibi</span>
                        <span className="font-semibold text-[#333333]">Next AI Teknoloji Yazılım San ve Tic Ltd Şti</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-[#767676]">IBAN</span>
                        <span className="font-mono font-semibold text-[#333333] tracking-wide">TR72 0006 2000 0450 0006 2885 83</span>
                      </div>
                      <div className="flex flex-col gap-0.5 pt-2 border-t border-[#0040a4]/10">
                        <span className="text-xs text-[#767676]">Ödenecek Tutar (TL Karşılığı)</span>
                        <span className="font-bold text-[#0040a4] text-base">{formatCurrency(grandTotal * usdTry, "TRY")}</span>
                        <span className="text-[10px] text-[#767676]">({formatCurrency(grandTotal)} · 1 USD = {usdTry} TL)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Havale açıklamasına mutlaka <strong>sipariş numaranızı</strong> yazınız. Aksi halde ödemeniz eşleştirilemeyebilir.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sipariş Notu */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="border-b border-[#f3f3f3] px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0040a4]/10">
                    <FileText className="h-4 w-4 text-[#0040a4]" />
                  </div>
                  <h2 className="text-base font-semibold text-[#333333]">Sipariş Notu</h2>
                </div>
                <p className="mt-1 text-xs text-[#767676]">Siparişinizle ilgili özel notlarınız (isteğe bağlı)</p>
              </div>
              <div className="p-6">
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Siparişinizle ilgili özel notunuz varsa buraya yazabilirsiniz..."
                  rows={3}
                  maxLength={2000}
                  className="rounded-lg border-[#e5e5e5] focus:border-[#0040a4] focus:ring-[#0040a4]/20 resize-none"
                  aria-label="Sipariş notu"
                />
                <p className="mt-2 text-xs text-[#767676] text-right">
                  {notes.length} / 2000 karakter
                </p>
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Sipariş Özeti */}
          <aside>
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden sticky top-24">
              <div className="border-b border-[#f3f3f3] px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0040a4]/10">
                    <Package className="h-4 w-4 text-[#0040a4]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#333333]">Sipariş Özeti</h2>
                    <p className="text-xs text-[#767676]">{items.length} kalem ürün</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {/* Ürün listesi */}
                <ul className="space-y-3" aria-label="Siparişteki ürünler">
                  {items.map((item) => (
                    <li key={item.productId} className="flex justify-between gap-3 text-sm pb-3 border-b border-[#f3f3f3] last:border-0 last:pb-0">
                      <span className="text-[#767676] line-clamp-2 flex-1 min-w-0">
                        <span className="font-semibold text-[#333333]">
                          {item.quantity}x{" "}
                        </span>
                        {item.productName}
                      </span>
                      <span className="shrink-0 font-semibold text-[#333333] tabular-nums">
                        {formatCurrency(item.unitPriceExVat * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Separator className="bg-[#e5e5e5]" />

                <OrderSummary
                  subtotal={subtotal}
                  vatTotal={vatTotal}
                  grandTotal={grandTotal}
                  showTryEquivalent
                  usdTry={usdTry}
                />

                {submitError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-xl bg-[#0040a4] text-white hover:bg-[#0040a4] transition-colors h-12 text-sm font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="h-4 w-4 mr-2 animate-spin"
                        aria-hidden
                      />
                      Sipariş oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden />
                      Siparişi Onayla
                    </>
                  )}
                </Button>

                <div className="rounded-lg bg-[#f9fafb] px-4 py-3 border border-[#e5e5e5]">
                  <p className="text-center text-xs text-[#767676] leading-relaxed">
                    Siparişi onayladığınızda{" "}
                    <strong className="text-[#333333]">
                      {formatCurrency(grandTotal)}
                    </strong>{" "}
                    <span className="text-[#0040a4] font-semibold">
                      ({formatCurrency(grandTotal * usdTry, "TRY")} TL karşılığı)
                    </span>{" "}
                    tutarında {paymentMethod === "ON_ACCOUNT"
                      ? "cari borç oluşacaktır"
                      : paymentMethod === "CREDIT_CARD"
                        ? "kart ile ödeme yapılacaktır"
                        : "ödeme yapmanız gerekecektir"}
                    .
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
