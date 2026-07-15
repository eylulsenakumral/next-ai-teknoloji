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
  AlertCircle,
  ChevronRight,
  Upload,
  FileCheck2,
  ClipboardCheck,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CityDistrictSelector } from "@/components/ui/city-district-selector"

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

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
  taxCertificateFile: string
  referenceInfo: string
  kvkkConsent: boolean
}

interface FieldErrors { [key: string]: string | undefined }

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
  if (!form.kvkkConsent)
    errors.kvkkConsent = "KVKK aydınlatma metnini onaylamanız zorunludur"
  return errors
}

function FormInput({
  id, name, label, required, placeholder, type = "text",
  value, onChange, onBlur, error, maxLength,
}: {
  id: string; name: string; label: string; required?: boolean
  placeholder?: string; type?: string; value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur?: () => void; error?: string; maxLength?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-[#0040a4]">
        {label}
        {required && <span className="text-[#a60811] ml-0.5">*</span>}
      </label>
      <input
        id={id} name={name} type={type} placeholder={placeholder}
        value={value} onChange={onChange} onBlur={onBlur} maxLength={maxLength}
        className={cn(
          "h-[46px] w-full px-4 bg-[#f4f7fa] rounded-[20px] border border-transparent text-[14px] text-[#0040a4]",
          "placeholder:text-[#64748b] outline-none",
          "transition-all duration-300 focus:border-[#5086a8] focus:bg-white",
          error ? "!border-red-400" : ""
        )}
      />
      {error && (
        <p className="flex items-center gap-1 text-[12px] text-red-600 ml-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
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
    companyName: "", contactName: "", phone: "", email: "",
    taxOffice: "", taxNumber: "", address: "", city: "", district: "",
    cityId: null, districtId: null, businessType: "",
    taxCertificateUrl: "", taxCertificateFile: "",
    referenceInfo: "", kvkkConsent: false,
  })

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  function handleBlur(name: string) {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  function err(field: string) {
    return touched[field] ? fieldErrors[field] : undefined
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errors = validateForm(form)
    setFieldErrors(errors)
    setTouched(Object.fromEntries(Object.keys(form).map((k) => [k, true])))
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setServerError(null)

    try {
      const payload = {
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
        email: form.email,
        taxOffice: form.taxOffice || undefined,
        taxNumber: form.taxNumber || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        businessType: form.businessType || undefined,
        referenceInfo: form.referenceInfo || undefined,
        taxCertificateUrl: form.taxCertificateFile || "",
        kvkkConsent: form.kvkkConsent,
      }
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.details) {
          const msgs = Object.values(json.details).flat().join(" / ")
          setServerError(msgs || json.error || "Geçersiz form verisi.")
        } else {
          setServerError(json.error ?? "Bir hata oluştu. Lütfen tekrar deneyin.")
        }
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

  // -----------------------------------------------------------------------
  // BAŞARI EKRANI
  // -----------------------------------------------------------------------
  if (step === "success") {
    return (
      <div className="bg-[#f4f7fa] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-xl mx-auto text-center">
            <div className="relative mb-8 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-100 ring-8 ring-emerald-50">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-[36px] font-bold text-[#0040a4] mb-3">Başvurunuz Alındı</h1>
            <p className="text-[15px] text-[#64748b] leading-relaxed mb-4">
              Bayi başvurunuz başarıyla kayıt altına alındı. Ekibimiz en kısa sürede değerlendirip size dönüş yapacaktır.
            </p>
            {applicationId && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5086a8]/10 border border-[#5086a8]/20 mb-8">
                <span className="text-[13px] text-[#64748b]">Bayi Takip No:</span>
                <span className="text-sm font-bold text-[#5086a8] font-mono">
                  {applicationId.slice(0, 8).toUpperCase()}
                </span>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0] text-left space-y-4 mb-8">
              <h3 className="font-bold text-[#0040a4]">Sonraki Adımlar</h3>
              <ul className="space-y-3">
                {[
                  "Online başvurunuz sonrasında, sizin için oluşturulacak 'Bayi Takip Numarası' ile süreci sistem üzerinden takip edebilirsiniz.",
                  "Online başvurunuzun onaylanmasının ardından, başvuru formunda belirttiğiniz e-posta adresinize üyelik sözleşmesi gönderilecektir.",
                  "Sözleşmeyi onaylamanızın ardından e-posta adresinize sözleşmenin bir örneği ve giriş bilgileriniz (kullanıcı adı ve şifre) iletilecektir.",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-[#64748b] leading-relaxed">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5086a8]/10 text-[11px] font-bold text-[#5086a8] mt-0.5">
                      {i + 1}
                    </div>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-[#5086a8] font-semibold pt-2">
                * E-bayilik sözleşmenizi, tarafımıza kargo ile göndermenize gerek yoktur. Tüm süreçlerimiz online olarak yürütülmektedir.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[#5086a8] text-white font-semibold hover:bg-[#003080] transition-all duration-300 hover:scale-105 hover:shadow-lg gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Ana Sayfaya Dön
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-12 px-8 rounded-full border-2 border-[#5086a8] text-[#5086a8] font-semibold hover:bg-[#5086a8]/5 transition-all duration-300 gap-2"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // FORM EKRANI
  // -----------------------------------------------------------------------
  return (
    <div className="bg-[#f4f7fa] min-h-screen">
      {/* Page Header */}
      <div className="bg-[#f4f7fa] border-b border-[#e2e8f0]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-2 text-[12px] text-[#64748b] mb-6">
            <Link href="/" className="hover:text-[#5086a8] transition-colors">Ana Sayfa</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#0040a4] font-semibold">Bayi Başvurusu</span>
          </nav>

          <div className="max-w-2xl">
            <h1 className="text-[28px] md:text-[36px] font-bold text-[#0040a4] leading-tight mb-2">
              Yeni Bayi Başvuru Süreci
            </h1>
            <p className="text-[15px] text-[#64748b] leading-relaxed">
              Next AI Teknoloji bayilik başvurunuzu aşağıdaki adımları takip ederek online olarak yapabilirsiniz.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Bilgi Notu — Index Grup tarzı ama bizim tasarımımızla */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0] mb-8">
          <ul className="space-y-3 text-[13px] text-[#64748b] leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="text-[#5086a8] font-bold shrink-0">•</span>
              <span>Bayilik başvuru sürecinin başlaması için <strong className="text-[#0040a4]">Online Başvuru Formu</strong>&apos;nu eksiksiz doldurup, talep edilen belgelerin birer okunaklı taranmış suretini de eklemeniz gerekmektedir. <em>(Talep edilen belgeler eksik yüklendiği takdirde başvurunuz değerlendirmeye alınmayacaktır.)</em></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#5086a8] font-bold shrink-0">•</span>
              <span>Online başvurunuz sonrasında, sizin için oluşturulacak <strong className="text-[#0040a4]">&apos;Bayi Takip Numarası&apos;</strong> ile süreci sistem üzerinden takip edebilirsiniz.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#5086a8] font-bold shrink-0">•</span>
              <span>Online başvurunuzun onaylanmasının ardından, <strong className="text-[#0040a4]">&apos;Online Başvuru Formu&apos;</strong>nda belirttiğiniz e-posta adresinize <strong className="text-[#0040a4]">&apos;Next AI Teknoloji B2B Platformu E-Bayi Üyelik Sözleşmesi&apos;</strong> gönderilecektir.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#5086a8] font-bold shrink-0">•</span>
              <span>Sözleşmeyi onaylamanızın ardından e-posta adresinize sözleşmenin bir örneği gönderilecektir. <strong className="text-[#0040a4]">&apos;Kullanıcı adı&apos;</strong> ve <strong className="text-[#0040a4]">&apos;şifre&apos;</strong>niz de belirttiğiniz aynı e-posta adresinize iletilecektir.</span>
            </li>
          </ul>
          <p className="mt-4 text-[12px] text-[#5086a8] font-semibold">
            * E-bayilik sözleşmenizi, tarafımıza kargo ile göndermenize gerek yoktur. Tüm süreçlerimiz online olarak yürütülmektedir.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SOL — Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Firma Bilgileri */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5086a8]/10">
                      <Building2 className="h-4 w-4 text-[#5086a8]" />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#0040a4]">Firma Bilgileri</h2>
                  </div>
                  <p className="text-[12px] text-[#64748b] mt-1 ml-10">Şirketinize ait ticari bilgileri girin.</p>
                </div>
                <div className="p-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FormInput id="companyName" name="companyName" label="Firma Adı / Ünvan" required
                      placeholder="Örn: ABC Bilişim Ltd. Şti." value={form.companyName}
                      onChange={handleChange} onBlur={() => handleBlur("companyName")} error={err("companyName")}
                    />
                  </div>
                  <FormInput id="taxOffice" name="taxOffice" label="Vergi Dairesi" required
                    placeholder="Örn: Bağcılar" value={form.taxOffice} onChange={handleChange}
                  />
                  <FormInput id="taxNumber" name="taxNumber" label="Vergi Numarası / T.C. Kimlik No" required
                    placeholder="10 veya 11 haneli" maxLength={11} value={form.taxNumber}
                    onChange={handleChange} onBlur={() => handleBlur("taxNumber")} error={err("taxNumber")}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#0040a4]">
                      Faaliyet Alanı <span className="text-[#a60811] ml-0.5">*</span>
                    </label>
                    <Select
                      value={form.businessType}
                      onValueChange={(v) => {
                        setForm((prev) => ({ ...prev, businessType: v ?? "" }))
                        setTouched((prev) => ({ ...prev, businessType: true }))
                      }}
                    >
                      <SelectTrigger className={cn(
                        "h-[46px] w-full px-4 bg-[#f4f7fa] rounded-[20px] border border-transparent text-[14px] text-[#0040a4]",
                        "transition-all duration-300 focus:border-[#5086a8] focus:bg-white",
                        err("businessType") ? "!border-red-400" : ""
                      )}>
                        <SelectValue placeholder="Seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {err("businessType") && (
                      <p className="flex items-center gap-1 text-[12px] text-red-600 ml-1">
                        <AlertCircle className="h-3 w-3" /> {err("businessType")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#0040a4]">Vergi Levhası</label>
                    <label className={cn(
                      "h-[46px] w-full flex items-center gap-3 px-4 bg-[#f4f7fa] rounded-[20px] border border-transparent",
                      "text-[14px] text-[#64748b] cursor-pointer",
                      "transition-all duration-300 hover:border-[#5086a8]/50 hover:bg-white"
                    )}>
                      <Upload className="h-4 w-4 text-[#5086a8]" />
                      <span className="truncate">{form.taxCertificateUrl || "Dosya seçin (.pdf, .jpg, .png)"}</span>
                      <input
                        type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = () => {
                              setForm((prev) => ({
                                ...prev,
                                taxCertificateUrl: file.name,
                                taxCertificateFile: reader.result as string,
                              }))
                            }
                            reader.readAsDataURL(file)
                          } else {
                            setForm((prev) => ({ ...prev, taxCertificateUrl: "", taxCertificateFile: "" }))
                          }
                          setTouched((prev) => ({ ...prev, taxCertificateUrl: true }))
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-[#64748b] ml-1">Geçerli vergi levhası (güncel takvim yılı)</p>
                  </div>
                </div>
              </div>

              {/* Yetkili Bilgileri */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5086a8]/10">
                      <User className="h-4 w-4 text-[#5086a8]" />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#0040a4]">Yetkili Bilgileri</h2>
                  </div>
                  <p className="text-[12px] text-[#64748b] mt-1 ml-10">Başvurudan sorumlu kişinin iletişim bilgileri.</p>
                </div>
                <div className="p-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FormInput id="contactName" name="contactName" label="Yetkili Ad Soyad" required
                      placeholder="Örn: Ahmet Yılmaz" value={form.contactName}
                      onChange={handleChange} onBlur={() => handleBlur("contactName")} error={err("contactName")}
                    />
                  </div>
                  <FormInput id="phone" name="phone" label="Cep Telefonu" required type="tel"
                    placeholder="0(5XX) XXX XX XX" value={form.phone}
                    onChange={handleChange} onBlur={() => handleBlur("phone")} error={err("phone")}
                  />
                  <FormInput id="email" name="email" label="E-posta" required type="email"
                    placeholder="ornek@firma.com" value={form.email}
                    onChange={handleChange} onBlur={() => handleBlur("email")} error={err("email")}
                  />
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5086a8]/10">
                      <MapPin className="h-4 w-4 text-[#5086a8]" />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#0040a4]">Adres Bilgileri</h2>
                  </div>
                </div>
                <div className="p-6 grid gap-4">
                  <CityDistrictSelector
                    cityId={form.cityId} districtId={form.districtId}
                    onCityChange={(cityId, cityName) => {
                      setForm((prev) => ({ ...prev, cityId, city: cityName, districtId: null, district: "" }))
                    }}
                    onDistrictChange={(districtId, districtName) => {
                      setForm((prev) => ({ ...prev, districtId, district: districtName }))
                    }}
                    className="grid gap-4 sm:grid-cols-2"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="address" className="text-[13px] font-semibold text-[#0040a4]">Açık Adres</label>
                    <textarea
                      id="address" name="address" placeholder="Mahalle, sokak, bina no..."
                      rows={3} value={form.address} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#f4f7fa] rounded-[20px] border border-transparent text-[14px] text-[#0040a4] resize-none placeholder:text-[#64748b] outline-none transition-all duration-300 focus:border-[#5086a8] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Ek Bilgiler */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5086a8]/10">
                      <FileText className="h-4 w-4 text-[#5086a8]" />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#0040a4]">Ek Bilgiler</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="referenceInfo" className="text-[13px] font-semibold text-[#0040a4]">Referans Bilgisi</label>
                    <textarea
                      id="referenceInfo" name="referenceInfo" placeholder="Sizi bize kim yönlendirdi? (isteğe bağlı)"
                      rows={3} value={form.referenceInfo} onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#f4f7fa] rounded-[20px] border border-transparent text-[14px] text-[#0040a4] resize-none placeholder:text-[#64748b] outline-none transition-all duration-300 focus:border-[#5086a8] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* KVKK & Gönder */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6 space-y-5">
                {serverError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-red-700">{serverError}</p>
                  </div>
                )}

                <div className={cn(
                  "rounded-2xl border p-4 transition-colors",
                  form.kvkkConsent ? "border-[#5086a8]/20 bg-[#5086a8]/5" :
                  err("kvkkConsent") ? "border-red-300 bg-red-50" :
                  "border-[#e2e8f0] bg-[#f4f7fa]"
                )}>
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <Checkbox
                        id="kvkkConsent"
                        checked={form.kvkkConsent}
                        onCheckedChange={(checked) => {
                          setForm((prev) => ({ ...prev, kvkkConsent: checked === true }))
                          setTouched((prev) => ({ ...prev, kvkkConsent: true }))
                        }}
                        className={cn(
                          "h-5 w-5 rounded border-2",
                          form.kvkkConsent ? "border-[#5086a8] bg-[#5086a8]" :
                          err("kvkkConsent") ? "border-red-400" :
                          "border-[#64748b]"
                        )}
                      />
                    </div>
                    <label htmlFor="kvkkConsent" className="text-[14px] text-[#0040a4] leading-relaxed cursor-pointer select-none">
                      <Link href="/kvkk" className="text-[#5086a8] font-bold hover:underline">KVKK Aydınlatma Metni</Link>'ni
                      okudum ve kişisel verilerimin işlenmesini onaylıyorum.
                      <span className="text-[#a60811] font-bold ml-0.5">*</span>
                    </label>
                  </div>
                </div>
                {err("kvkkConsent") && (
                  <p className="flex items-center gap-1 text-[12px] text-red-600">
                    <AlertCircle className="h-3 w-3" /> {err("kvkkConsent")}
                  </p>
                )}

                <button
                  type="submit" disabled={submitting}
                  className={cn(
                    "flex h-[52px] w-full items-center justify-center gap-2",
                    "bg-[#5086a8] text-white text-[14px] font-semibold rounded-full",
                    "transition-all duration-300 hover:bg-[#003080] hover:scale-[1.02] hover:shadow-lg",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none"
                  )}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> <span>Gönderiliyor...</span></>
                  ) : (
                    "Başvuruyu Gönder"
                  )}
                </button>

                <p className="text-[12px] text-center text-[#64748b]">
                  Zaten hesabınız var mı?{" "}
                  <Link href="/login" className="text-[#5086a8] font-semibold hover:underline transition-colors">Giriş yapın</Link>
                </p>
              </div>
            </form>
          </div>

          {/* SAĞ — Sidebar */}
          <aside className="space-y-6">
            {/* Gerekli Belgeler */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden sticky top-24">
              <div className="px-6 py-4 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5086a8]/10">
                    <FileCheck2 className="h-4 w-4 text-[#5086a8]" />
                  </div>
                  <h2 className="text-[15px] font-bold text-[#0040a4]">Gerekli Belgeler</h2>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {/* Şahıs Firmaları */}
                <div>
                  <h3 className="text-[13px] font-bold text-[#0040a4] mb-2">Şahıs Firmaları</h3>
                  <ul className="space-y-1.5">
                    {[
                      "İmza Sirküsü (Yetkili Kişiye ait)",
                      "Vergi Levhası (Güncel Takvim Yılı)",
                      "Nüfus Cüzdanı Fotokopisi (Yetkili Kişiye ait)",
                      "Faaliyet Belgesi / Yoklama Fişi",
                    ].map((doc) => (
                      <li key={doc} className="flex items-start gap-2 text-[12px] text-[#64748b] leading-relaxed">
                        <ClipboardCheck className="h-3.5 w-3.5 text-[#5086a8] shrink-0 mt-0.5" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-[#64748b] leading-relaxed">
                    * Şirket adı kısmına, oda kayıt belgesinde belirtilen iş yeri adını veya yoklama fişinde yer alan ünvanınızı giriniz.
                  </p>
                </div>

                <div className="border-t border-[#e2e8f0]" />

                {/* Şirketler */}
                <div>
                  <h3 className="text-[13px] font-bold text-[#0040a4] mb-2">Şirketler</h3>
                  <ul className="space-y-1.5">
                    {[
                      "İmza Sirküsü (Yetkili Kişiye ait)",
                      "Vergi Levhası (Güncel Takvim Yılı)",
                      "Nüfus Cüzdanı Fotokopisi (Yetkili Kişiye ait)",
                      "Ticari Sicil Gazetesi (Ortaklık ve İş Alanını Gösteren)",
                    ].map((doc) => (
                      <li key={doc} className="flex items-start gap-2 text-[12px] text-[#64748b] leading-relaxed">
                        <ClipboardCheck className="h-3.5 w-3.5 text-[#5086a8] shrink-0 mt-0.5" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-[#e2e8f0]" />

                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  * Yetkili kişi ile evrakların uyuşması gerekmektedir. Belgeler eksik yüklenirse başvurunuz değerlendirmeye alınmayacaktır.
                </p>
              </div>
            </div>

            {/* İletişim */}
            <div className="bg-[#5086a8] rounded-2xl p-6 text-white">
              <h3 className="font-bold text-[15px] mb-3">Yardıma mı İhtiyacınız Var?</h3>
              <p className="text-[13px] text-white/75 leading-relaxed mb-4">
                Başvuru süreciyle ilgili herhangi bir sorun yaşıyorsanız bizimle iletişime geçin.
              </p>
              <div className="space-y-2">
                <a href="tel:+905529895959" className="flex items-center gap-2 text-[13px] text-white/90 hover:text-white transition-colors">
                  <Phone className="h-4 w-4" />
                  0(552) 989 59 59
                </a>
                <a href="mailto:info@nextai.com.tr" className="flex items-center gap-2 text-[13px] text-white/90 hover:text-white transition-colors">
                  <Mail className="h-4 w-4" />
                  info@nextai.com.tr
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
