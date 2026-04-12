"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import {
  Save,
  Loader2,
  KeyRound,
  User,
  Building2,
  Phone,
  MapPin,
  Mail,
  Wallet,
  CreditCard,
  Percent,
  CalendarDays,
  ShieldCheck,
  MessageCircle,
  Briefcase,
  FileText,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { CityDistrictSelector } from "@/components/ui/city-district-selector"
import { formatCurrency, formatDate } from "@/lib/utils/format"

interface Profile {
  id: string
  dealerCode: string
  companyName: string
  tradeName: string | null
  contactName: string | null
  contactTitle: string | null
  phone: string | null
  phone2: string | null
  email: string | null
  taxOffice: string | null
  taxNumber: string | null
  address: string | null
  city: string | null
  district: string | null
  postalCode: string | null
  whatsappPhone: string | null
  status: string
  balance: number
  creditLimit: number
  discountRate: number
  createdAt: string
  approvedAt: string | null
}

type MessageState = { type: "success" | "error"; text: string } | null

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  APPROVED: {
    label: "Onaylanmış",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  PENDING: {
    label: "Onay Bekliyor",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  REJECTED: {
    label: "Reddedildi",
    className: "bg-red-50 text-red-700 border-red-200",
  },
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: "Zayıf", color: "bg-red-500" }
  if (score <= 2) return { score, label: "Orta", color: "bg-amber-500" }
  if (score <= 3) return { score, label: "İyi", color: "bg-blue-500" }
  return { score, label: "Güçlü", color: "bg-emerald-500" }
}

/* ---------- Info Row (read-only field) ---------- */
function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2189ff]/5">
        <Icon className="h-4 w-4 text-[#2189ff]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#767676]">{label}</p>
        <p className={`text-sm font-medium text-[#333333] ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

/* ---------- Stat Card ---------- */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}/10`}>
          <Icon className={`h-5 w-5 ${accent.replace("bg-", "text-")}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-[#767676]">{label}</p>
          <p className="text-lg font-bold text-[#333333]">{value}</p>
        </div>
      </div>
    </div>
  )
}

/* ---------- Message Banner ---------- */
function MessageBanner({ message }: { message: MessageState }) {
  if (!message) return null

  const isSuccess = message.type === "success"
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-all ${
        isSuccess
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-1 ring-red-200"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {message.text}
    </div>
  )
}

/* ---------- Loading Skeleton ---------- */
function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {/* Content skeleton */}
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function HesabimPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)

  // Profile form state
  const [form, setForm] = useState({
    contactName: "",
    contactTitle: "",
    phone: "",
    phone2: "",
    whatsappPhone: "",
    address: "",
    city: "",
    district: "",
    postalCode: "",
    cityId: null as number | null,
    districtId: null as number | null,
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<MessageState>(null)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordForm.newPassword),
    [passwordForm.newPassword]
  )

  // Profil ve sehir verilerini yukle, city name'den cityId resolve et
  useEffect(() => {
    Promise.all([
      fetch("/api/account/profile").then((r) => r.json()),
      fetch("/api/locations/cities").then((r) => r.json()),
    ])
      .then(([profileJson, citiesJson]) => {
        if (profileJson.data) {
          setProfile(profileJson.data)

          // City name'den cityId bul
          let resolvedCityId: number | null = null
          let resolvedDistrictId: number | null = null
          const cityName = profileJson.data.city ?? ""
          const districtName = profileJson.data.district ?? ""

          if (cityName && citiesJson.data) {
            const matchedCity = (citiesJson.data as Array<{ id: number; name: string }>).find(
              (c) => c.name.toLowerCase() === cityName.toLowerCase()
            )
            if (matchedCity) {
              resolvedCityId = matchedCity.id
            }
          }

          // districtId'yi resolve etmek icin district API'sini cagir
          if (resolvedCityId && districtName) {
            fetch(`/api/locations/districts?cityId=${resolvedCityId}`)
              .then((r) => r.json())
              .then((distJson) => {
                if (distJson.data) {
                  const matchedDistrict = (distJson.data as Array<{ id: number; name: string }>).find(
                    (d) => d.name.toLowerCase() === districtName.toLowerCase()
                  )
                  if (matchedDistrict) {
                    resolvedDistrictId = matchedDistrict.id
                  }
                }
                setForm({
                  contactName: profileJson.data.contactName ?? "",
                  contactTitle: profileJson.data.contactTitle ?? "",
                  phone: profileJson.data.phone ?? "",
                  phone2: profileJson.data.phone2 ?? "",
                  whatsappPhone: profileJson.data.whatsappPhone ?? "",
                  address: profileJson.data.address ?? "",
                  city: cityName,
                  district: districtName,
                  postalCode: profileJson.data.postalCode ?? "",
                  cityId: resolvedCityId,
                  districtId: resolvedDistrictId,
                })
              })
              .catch(() => {
                setForm({
                  contactName: profileJson.data.contactName ?? "",
                  contactTitle: profileJson.data.contactTitle ?? "",
                  phone: profileJson.data.phone ?? "",
                  phone2: profileJson.data.phone2 ?? "",
                  whatsappPhone: profileJson.data.whatsappPhone ?? "",
                  address: profileJson.data.address ?? "",
                  city: cityName,
                  district: districtName,
                  postalCode: profileJson.data.postalCode ?? "",
                  cityId: resolvedCityId,
                  districtId: null,
                })
              })
          } else {
            setForm({
              contactName: profileJson.data.contactName ?? "",
              contactTitle: profileJson.data.contactTitle ?? "",
              phone: profileJson.data.phone ?? "",
              phone2: profileJson.data.phone2 ?? "",
              whatsappPhone: profileJson.data.whatsappPhone ?? "",
              address: profileJson.data.address ?? "",
              city: cityName,
              district: districtName,
              postalCode: profileJson.data.postalCode ?? "",
              cityId: resolvedCityId,
              districtId: null,
            })
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile() {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: json.message ?? "Profiliniz güncellendi." })
      } else {
        setMessage({ type: "error", text: json.error ?? "Güncelleme başarısız." })
      }
    } catch {
      setMessage({ type: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Yeni şifreler eşleşmiyor." })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Yeni şifre en az 6 karakter olmalı." })
      return
    }

    setPasswordSaving(true)
    setPasswordMessage(null)

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      })

      const json = await res.json()
      if (res.ok) {
        setPasswordMessage({
          type: "success",
          text: json.message ?? "Şifreniz güncellendi.",
        })
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setPasswordMessage({ type: "error", text: json.error ?? "Güncelleme başarısız." })
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Bir hata oluştu. Lütfen tekrar deneyin." })
    } finally {
      setPasswordSaving(false)
    }
  }

  function handleFormChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePasswordChange(field: keyof typeof passwordForm, value: string) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return <PageSkeleton />
  }

  const statusInfo = STATUS_MAP[profile?.status ?? ""] ?? {
    label: profile?.status ?? "Bilinmiyor",
    className: "bg-gray-50 text-gray-700 border-gray-200",
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ==================== HERO BANNER ==================== */}
      {profile && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2189ff] to-[#1a6fd4] p-6 sm:p-8 text-white shadow-lg">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold ring-2 ring-white/25">
                {getInitials(profile.companyName)}
              </div>
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">{profile.companyName}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-white/30 bg-white/10 font-mono text-white"
                  >
                    {profile.dealerCode}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`border ${statusInfo.className}`}
                  >
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Member since */}
            <div className="flex items-center gap-2 text-sm text-white/70">
              <CalendarDays className="h-4 w-4" />
              <span>Üye: {formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </section>
      )}

      {/* ==================== STAT CARDS ==================== */}
      {profile && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Wallet}
            label="Cari Bakiye"
            value={formatCurrency(profile.balance, "TRY")}
            accent="bg-emerald-500"
          />
          <StatCard
            icon={CreditCard}
            label="Kredi Limiti"
            value={formatCurrency(profile.creditLimit, "TRY")}
            accent="bg-blue-500"
          />
          <StatCard
            icon={Percent}
            label="İskonto Oranı"
            value={`%${Number(profile.discountRate).toFixed(1)}`}
            accent="bg-violet-500"
          />
        </section>
      )}

      {/* ==================== TABS ==================== */}
      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList className="!h-12 !rounded-xl !bg-[#2189ff] !p-1">
          <TabsTrigger
            value="profil"
            className="!gap-2 !rounded-lg !px-5 !text-[13px] !font-semibold !bg-transparent !text-white data-active:!bg-white data-active:!text-[#2189ff] data-active:!shadow-md"
          >
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger
            value="sifre"
            className="!gap-2 !rounded-lg !px-5 !text-[13px] !font-semibold !bg-transparent !text-white data-active:!bg-white data-active:!text-[#2189ff] data-active:!shadow-md"
          >
            <KeyRound className="h-4 w-4" />
            Şifre Değiştir
          </TabsTrigger>
        </TabsList>

        {/* ========== TAB: PROFIL ========== */}
        <TabsContent value="profil" className="space-y-6">
          {/* Firma Bilgileri (Read-only) */}
          {profile && (
            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="border-b border-black/5 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#2189ff]" />
                  <h2 className="text-base font-semibold text-[#333333]">Firma Bilgileri</h2>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#767676]">
                  <Info className="h-3 w-3" />
                  Bu bilgiler admin tarafından güncellenir.
                </div>
              </div>
              <div className="grid gap-x-8 gap-y-1 px-6 py-4 sm:grid-cols-2">
                <InfoRow
                  icon={Building2}
                  label="Firma Adı"
                  value={profile.companyName}
                />
                {profile.tradeName && (
                  <InfoRow
                    icon={Briefcase}
                    label="Ticari Ünvan"
                    value={profile.tradeName}
                  />
                )}
                {profile.taxOffice && (
                  <InfoRow
                    icon={FileText}
                    label="Vergi Dairesi"
                    value={profile.taxOffice}
                  />
                )}
                {profile.taxNumber && (
                  <InfoRow
                    icon={FileText}
                    label="Vergi No"
                    value={profile.taxNumber}
                    mono
                  />
                )}
                {profile.email && (
                  <InfoRow
                    icon={Mail}
                    label="E-posta"
                    value={profile.email}
                  />
                )}
              </div>
            </section>
          )}

          {/* Iletisim Bilgileri (Editable) */}
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="border-b border-black/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-[#2189ff]" />
                <h2 className="text-base font-semibold text-[#333333]">İletişim Bilgileri</h2>
              </div>
              <p className="mt-1 text-xs text-[#767676]">
                Yetkili iletişim bilgilerinizi güncelleyebilirsiniz.
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Ad Soyad */}
                <div className="space-y-1.5">
                  <Label htmlFor="contactName" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <User className="h-3.5 w-3.5 text-[#767676]" />
                    Ad Soyad
                  </Label>
                  <Input
                    id="contactName"
                    value={form.contactName}
                    onChange={(e) => handleFormChange("contactName", e.target.value)}
                    placeholder="Yetkili ad soyad"
                  />
                </div>

                {/* Unvan */}
                <div className="space-y-1.5">
                  <Label htmlFor="contactTitle" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <Briefcase className="h-3.5 w-3.5 text-[#767676]" />
                    Ünvan
                  </Label>
                  <Input
                    id="contactTitle"
                    value={form.contactTitle}
                    onChange={(e) => handleFormChange("contactTitle", e.target.value)}
                    placeholder="Yetkili ünvanı"
                  />
                </div>

                {/* Telefon */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <Phone className="h-3.5 w-3.5 text-[#767676]" />
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    placeholder="0(5XX) XXX XX XX"
                  />
                </div>

                {/* Telefon 2 */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone2" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <Phone className="h-3.5 w-3.5 text-[#767676]" />
                    Telefon 2
                  </Label>
                  <Input
                    id="phone2"
                    type="tel"
                    value={form.phone2}
                    onChange={(e) => handleFormChange("phone2", e.target.value)}
                    placeholder="Alternatif telefon"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Label htmlFor="whatsappPhone" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <MessageCircle className="h-3.5 w-3.5 text-[#767676]" />
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsappPhone"
                    type="tel"
                    value={form.whatsappPhone}
                    onChange={(e) => handleFormChange("whatsappPhone", e.target.value)}
                    placeholder="WhatsApp numarası"
                  />
                </div>

                {/* Posta Kodu */}
                <div className="space-y-1.5">
                  <Label htmlFor="postalCode" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <MapPin className="h-3.5 w-3.5 text-[#767676]" />
                    Posta Kodu
                  </Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) => handleFormChange("postalCode", e.target.value)}
                    placeholder="34000"
                  />
                </div>

                {/* Il / Ilce - CityDistrictSelector icinde iki dropdown var */}
                <CityDistrictSelector
                  cityId={form.cityId}
                  districtId={form.districtId}
                  onCityChange={(cityId, cityName) => {
                    setForm((prev) => ({
                      ...prev,
                      cityId,
                      city: cityName,
                      districtId: null,
                      district: "",
                    }))
                  }}
                  onDistrictChange={(districtId, districtName) => {
                    setForm((prev) => ({
                      ...prev,
                      districtId,
                      district: districtName,
                    }))
                  }}
                  className="sm:col-span-2 grid gap-5 sm:grid-cols-2"
                />

                {/* Adres (full width) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <MapPin className="h-3.5 w-3.5 text-[#767676]" />
                    Adres
                  </Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) => handleFormChange("address", e.target.value)}
                    placeholder="Açık adres"
                    rows={2}
                  />
                </div>
              </div>

              <Separator className="my-5" />

              <MessageBanner message={message} />

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="gap-2 rounded-xl bg-[#2189ff] text-white px-6 hover:bg-[#1a6fd4]"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Kaydet
                </Button>
              </div>
            </div>
          </section>
        </TabsContent>

        {/* ========== TAB: SIFRE DEGISTIR ========== */}
        <TabsContent value="sifre">
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="border-b border-black/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#2189ff]" />
                <h2 className="text-base font-semibold text-[#333333]">Şifre Değiştir</h2>
              </div>
              <p className="mt-1 text-xs text-[#767676]">
                Güvenliğiniz için güçlü bir şifre seçin.
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="max-w-md space-y-5">
                {/* Mevcut Sifre */}
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <KeyRound className="h-3.5 w-3.5 text-[#767676]" />
                    Mevcut Şifre
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPw ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767676] hover:text-[#333333] transition-colors"
                      aria-label={showCurrentPw ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showCurrentPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Yeni Sifre */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <Lock className="h-3.5 w-3.5 text-[#767676]" />
                    Yeni Şifre
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPw ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767676] hover:text-[#333333] transition-colors"
                      aria-label={showNewPw ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showNewPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {passwordForm.newPassword.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength.score
                                ? passwordStrength.color
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-[#767676]">
                        Şifre gücü: <span className="font-medium">{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-[#767676]">En az 6 karakter</p>
                </div>

                {/* Yeni Sifre (Tekrar) */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-1.5 text-sm text-[#333333]">
                    <Lock className="h-3.5 w-3.5 text-[#767676]" />
                    Yeni Şifre (Tekrar)
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    autoComplete="new-password"
                  />
                  {passwordForm.confirmPassword.length > 0 &&
                    passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        Şifreler eşleşmiyor
                      </p>
                    )}
                </div>

                <Separator />

                <MessageBanner message={passwordMessage} />

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={passwordSaving}
                    className="gap-2 rounded-xl bg-[#2189ff] text-white px-6 hover:bg-[#1a6fd4]"
                  >
                    {passwordSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Şifreyi Güncelle
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
