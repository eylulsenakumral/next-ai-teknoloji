"use client"

import { useState, type FormEvent } from "react"
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
  AlertCircle,
  Send,
} from "lucide-react"

type ProjectType = "konut" | "isyeri" | "depo" | "acik" | "okul" | "diger"
type BudgetRange = "0-50k" | "50-150k" | "150-500k" | "500k+"

const projectTypes: { id: ProjectType; label: string }[] = [
  { id: "konut", label: "Konut / Apartman / Site" },
  { id: "isyeri", label: "İşyeri / Ofis / Mağaza" },
  { id: "depo", label: "Depo / Fabrika" },
  { id: "acik", label: "Açık Alan / Park / Otopark" },
  { id: "okul", label: "Okul / Hastane / Kamu" },
  { id: "diger", label: "Diğer" },
]

const budgetRanges: { id: BudgetRange; label: string }[] = [
  { id: "0-50k", label: "₺0 – ₺50.000" },
  { id: "50-150k", label: "₺50.000 – ₺150.000" },
  { id: "150-500k", label: "₺150.000 – ₺500.000" },
  { id: "500k+", label: "₺500.000+" },
]

interface FormState {
  companyName: string
  contactName: string
  phone: string
  email: string
  city: string
  projectType: ProjectType | ""
  budget: BudgetRange | ""
  cameraCount: string
  description: string
}

const initialForm: FormState = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  city: "",
  projectType: "",
  budget: "",
  cameraCount: "",
  description: "",
}

export default function TeklifIstePage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage("")

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PROJECT_QUOTE",
          companyName: form.companyName,
          contactName: form.contactName,
          phone: form.phone,
          email: form.email,
          city: form.city,
          address: "",
          businessType: "Sistem Entegratör / Bayi",
          annualRevenueRange: form.budget,
          referenceInfo: `Proje türü: ${form.projectType} | Kamera adedi: ${form.cameraCount} | Bütçe: ${form.budget}`,
          notes: form.description,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? "Teklif gönderilemedi")
      }

      setStatus("success")
      setForm(initialForm)
    } catch (err) {
      setStatus("error")
      setErrorMessage(err instanceof Error ? err.message : "Bilinmeyen hata")
    }
  }

  if (status === "success") {
    return (
      <div className="font-nx-sans min-h-[60vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--color-primary)]">Teklif talebiniz alındı</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Teknik ekibimiz projenizi inceleyip <strong>2–4 saat içinde</strong> size geri dönecek. Telefon ve
            e-posta yoluyla ulaşacağız.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              Ana sayfaya dön
            </Link>
            <Link
              href="/cozumler"
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-[var(--color-primary)] transition hover:bg-slate-50"
            >
              Çözümleri incele →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="font-nx-sans">
      {/* Header */}
      <section className="bg-[var(--color-primary)] px-6 py-20 text-white md:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
            Proje teklifi
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.055em] md:text-5xl">
            Projeniz için ücretsiz teklif alın.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
            Aşağıdaki formu doldurun, teknik ekibimiz 2–4 saat içinde size özel marka, ürün ve fiyat önerisi
            hazırlasın. Tamamen ücretsiz, hiçbir bağlılık doğurmaz.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="bg-[var(--color-background)] px-6 py-16 md:px-10">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="companyName"
              label="Şirket adı"
              icon={<Building2 className="h-4 w-4" />}
              value={form.companyName}
              onChange={(v) => update("companyName", v)}
              placeholder="ABC Güvenlik Sistemleri Ltd."
              required
            />
            <Field
              id="contactName"
              label="Yetkili adı soyadı"
              icon={<User className="h-4 w-4" />}
              value={form.contactName}
              onChange={(v) => update("contactName", v)}
              placeholder="Ahmet Yılmaz"
              required
            />
            <Field
              id="phone"
              label="Telefon"
              icon={<Phone className="h-4 w-4" />}
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="05XX XXX XX XX"
              required
              type="tel"
            />
            <Field
              id="email"
              label="E-posta"
              icon={<Mail className="h-4 w-4" />}
              value={form.email}
              onChange={(v) => update("email", v)}
              placeholder="info@sirket.com"
              required
              type="email"
            />
            <Field
              id="city"
              label="Şehir"
              icon={<MapPin className="h-4 w-4" />}
              value={form.city}
              onChange={(v) => update("city", v)}
              placeholder="İstanbul"
              required
            />
            <Field
              id="cameraCount"
              label="Tahmini kamera adedi"
              icon={<FileText className="h-4 w-4" />}
              value={form.cameraCount}
              onChange={(v) => update("cameraCount", v)}
              placeholder="örn. 16"
            />
          </div>

          {/* Project type */}
          <div className="mt-6" role="group" aria-labelledby="projectType-label">
            <span id="projectType-label" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Proje türü
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {projectTypes.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => update("projectType", pt.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    form.projectType === pt.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="mt-6" role="group" aria-labelledby="budget-label">
            <span id="budget-label" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Bütçe aralığı
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {budgetRanges.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => update("budget", b.id)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    form.budget === b.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Proje detayları
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={5}
              placeholder="Kapsama alanları, özel ihtiyaçlar (gece görüş, plaka tanıma vs.), mevcut sistem, beklenen teslim tarihi…"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[var(--color-primary)] placeholder-slate-400 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
            />
          </div>

          {/* Error */}
          {status === "error" && (
            <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <strong className="font-bold">Teklif gönderilemedi.</strong>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-4 text-sm font-bold text-white transition hover:bg-[#456680] disabled:opacity-60"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Teklif Talebini Gönder
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Bilgileriniz KVKK kapsamında korunur. Yalnızca teklif hazırlamak için kullanılır.
          </p>
        </form>
      </section>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  icon?: React.ReactNode
}

function Field({ id, label, value, onChange, placeholder, required, type = "text", icon }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-[var(--color-primary)]">*</span>}
      </label>
      <div className="relative mt-2">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-xl border border-slate-200 bg-white py-3 text-sm text-[var(--color-primary)] placeholder-slate-400 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 ${
            icon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  )
}
