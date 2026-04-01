"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CityDistrictSelector } from "@/components/ui/city-district-selector"
import { cn } from "@/lib/utils"

const BUSINESS_TYPES = [
  "Bilgisayar ve Elektronik Perakende",
  "Bilgisayar ve Elektronik Toptan",
  "Güvenlik Sistemleri",
  "Network ve Telekomünikasyon",
  "Yazılım ve BT Hizmetleri",
  "Kurumsal BT Çözümleri",
  "Teknik Servis ve Bakım",
  "E-ticaret",
  "Diğer",
]


interface FormState {
  companyName: string
  contactName: string
  phone: string
  email: string
  taxOffice: string
  taxNumber: string
  address: string
  city: string
  district: string
  cityId: number | null
  districtId: number | null
  businessType: string
  taxCertificateUrl: string
  referenceInfo: string
  kvkkConsent: boolean
}

interface FieldErrors {
  [key: string]: string | undefined
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.companyName.trim() || form.companyName.length < 2)
    errors.companyName = "Firma adı en az 2 karakter olmalı"
  if (!form.contactName.trim() || form.contactName.length < 2)
    errors.contactName = "Yetkili adı en az 2 karakter olmalı"
  if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10)
    errors.phone = "Geçerli bir telefon numarası girin"
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Geçerli bir e-posta adresi girin"
  if (!form.businessType)
    errors.businessType = "Faaliyet alanı seçin"
  if (form.taxNumber && !/^\d{10,11}$/.test(form.taxNumber))
    errors.taxNumber = "Vergi numarası 10-11 haneli rakam olmalı"
  if (form.taxCertificateUrl && !/^https?:\/\/.+/.test(form.taxCertificateUrl))
    errors.taxCertificateUrl = "Geçerli bir URL girin"
  if (!form.kvkkConsent)
    errors.kvkkConsent = "KVKK aydınlatma metnini onaylamanız zorunludur"
  return errors
}

type SubmitStep = "form" | "success"

export default function BasvuruPage() {
  const [step, setStep] = useState<SubmitStep>("form")
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState<FormState>({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    taxOffice: "",
    taxNumber: "",
    address: "",
    city: "",
    district: "",
    cityId: null,
    districtId: null,
    businessType: "",
    taxCertificateUrl: "",
    referenceInfo: "",
    kvkkConsent: false,
  })

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  function handleBlur(name: string) {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const errors = validateForm(form)
    setFieldErrors(errors)

    // Tüm alanları touched yap
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]))
    setTouched(allTouched)

    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const json = await res.json()

      if (!res.ok) {
        setServerError(json.error ?? "Bir hata oluştu. Lütfen tekrar deneyin.")
        return
      }

      setApplicationId(json.applicationId)
      setStep("success")
    } catch {
      setServerError("Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.")
    } finally {
      setSubmitting(false)
    }
  }

  function err(field: string) {
    return touched[field] ? fieldErrors[field] : undefined
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-12 pb-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Başvurunuz Alındı
            </h1>
            <p className="text-slate-600 mb-2">
              Bayi başvurunuz başarıyla kayıt altına alındı. Ekibimiz en kısa
              sürede değerlendirip size dönüş yapacaktır.
            </p>
            {applicationId && (
              <p className="text-sm text-slate-400 mb-8">
                Referans no:{" "}
                <span className="font-mono font-medium">
                  {applicationId.slice(0, 8).toUpperCase()}
                </span>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ana Sayfaya Dön
                </Button>
              </Link>
              <Link href="/login">
                <Button>Giriş Yap</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Ana Sayfaya Dön
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Bayi Başvurusu</h1>
          <p className="text-slate-500 mt-2">
            Bayi ağımıza katılmak için formu eksiksiz doldurun.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Firma Bilgileri */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-5 h-5 text-blue-600" />
                Firma Bilgileri
              </CardTitle>
              <CardDescription>
                Şirketinize ait ticari bilgileri girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="companyName">
                  Firma Adı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Örn: ABC Bilişim Ltd. Şti."
                  value={form.companyName}
                  onChange={handleChange}
                  onBlur={() => handleBlur("companyName")}
                  className={cn(err("companyName") && "border-red-500")}
                />
                {err("companyName") && (
                  <p className="text-xs text-red-500 mt-1">{err("companyName")}</p>
                )}
              </div>

              <div>
                <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                <Input
                  id="taxOffice"
                  name="taxOffice"
                  placeholder="Örn: Bağcılar"
                  value={form.taxOffice}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="taxNumber">Vergi Numarası</Label>
                <Input
                  id="taxNumber"
                  name="taxNumber"
                  placeholder="10 veya 11 haneli"
                  maxLength={11}
                  value={form.taxNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur("taxNumber")}
                  className={cn(err("taxNumber") && "border-red-500")}
                />
                {err("taxNumber") && (
                  <p className="text-xs text-red-500 mt-1">{err("taxNumber")}</p>
                )}
              </div>

              <div>
                <Label htmlFor="businessType">
                  Faaliyet Alanı <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.businessType}
                  onValueChange={(v) => {
                    setForm((prev) => ({ ...prev, businessType: v ?? "" }))
                    setTouched((prev) => ({ ...prev, businessType: true }))
                  }}
                >
                  <SelectTrigger
                    className={cn(err("businessType") && "border-red-500")}
                  >
                    <SelectValue placeholder="Seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err("businessType") && (
                  <p className="text-xs text-red-500 mt-1">{err("businessType")}</p>
                )}
              </div>

              <div>
                <Label htmlFor="taxCertificateUrl">Vergi Levhası URL</Label>
                <Input
                  id="taxCertificateUrl"
                  name="taxCertificateUrl"
                  type="url"
                  placeholder="https://..."
                  value={form.taxCertificateUrl}
                  onChange={handleChange}
                  onBlur={() => handleBlur("taxCertificateUrl")}
                  className={cn(err("taxCertificateUrl") && "border-red-500")}
                />
                {err("taxCertificateUrl") && (
                  <p className="text-xs text-red-500 mt-1">{err("taxCertificateUrl")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Yetkili Bilgileri */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-5 h-5 text-blue-600" />
                Yetkili Bilgileri
              </CardTitle>
              <CardDescription>
                Başvurudan sorumlu kişinin bilgileri.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="contactName">
                  Yetkili Ad Soyad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactName"
                  name="contactName"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={form.contactName}
                  onChange={handleChange}
                  onBlur={() => handleBlur("contactName")}
                  className={cn(err("contactName") && "border-red-500")}
                />
                {err("contactName") && (
                  <p className="text-xs text-red-500 mt-1">{err("contactName")}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  Telefon <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="05XX XXX XXXX"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur("phone")}
                  className={cn(err("phone") && "border-red-500")}
                />
                {err("phone") && (
                  <p className="text-xs text-red-500 mt-1">{err("phone")}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />
                  E-posta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ornek@firma.com"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  className={cn(err("email") && "border-red-500")}
                />
                {err("email") && (
                  <p className="text-xs text-red-500 mt-1">{err("email")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adres */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-5 h-5 text-blue-600" />
                Adres Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
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
                className="sm:col-span-2 grid gap-4 sm:grid-cols-2"
              />

              <div className="sm:col-span-2">
                <Label htmlFor="address">Açık Adres</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Mahalle, sokak, bina no..."
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ek Bilgiler */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-blue-600" />
                Ek Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="referenceInfo">Referans Bilgisi</Label>
              <Textarea
                id="referenceInfo"
                name="referenceInfo"
                placeholder="Sizi bize kim yönlendirdi?"
                rows={3}
                value={form.referenceInfo}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-400 mt-1">İsteğe bağlı</p>
            </CardContent>
          </Card>

          {/* KVKK & Gönder */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <Checkbox
                  id="kvkkConsent"
                  checked={form.kvkkConsent}
                  onCheckedChange={(checked) => {
                    setForm((prev) => ({ ...prev, kvkkConsent: checked === true }))
                    setTouched((prev) => ({ ...prev, kvkkConsent: true }))
                  }}
                  className={cn(err("kvkkConsent") && "border-red-500")}
                />
                <label
                  htmlFor="kvkkConsent"
                  className="text-sm text-slate-600 leading-relaxed cursor-pointer"
                >
                  Kişisel verilerimin{" "}
                  <Link href="/kvkk" className="text-blue-600 underline">
                    KVKK Aydınlatma Metni
                  </Link>{" "}
                  kapsamında işlenmesini kabul ediyorum.{" "}
                  <span className="text-red-500">*</span>
                </label>
              </div>
              {err("kvkkConsent") && (
                <p className="text-xs text-red-500 mb-4">{err("kvkkConsent")}</p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
              </Button>

              <p className="text-xs text-center text-slate-400 mt-4">
                Zaten hesabınız var mı?{" "}
                <Link href="/login" className="text-blue-600 underline">
                  Giriş yapın
                </Link>
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
