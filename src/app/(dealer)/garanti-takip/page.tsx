"use client"

import { useState, useCallback, type FormEvent } from "react"
import {
  collection,
  query,
  where,
  getDocs,
  type DocumentData,
} from "firebase/firestore"
import { db, ensureFirebaseAuth } from "@/lib/firebase"
import {
  Shield,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Hash,
  Package,
  Clock,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GarantiRecord {
  barcodeNumber: string
  productName?: string
  customerName?: string
  customerPhone?: string
  startDate?: string
  endDate?: string
  description?: string
  status?: string
  createdAt?: string
  [key: string]: unknown
}

type QueryState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; data: GarantiRecord }
  | { kind: "not-found" }
  | { kind: "error"; message: string }

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseDate(value: unknown): Date | null {
  if (!value) return null

  // Firestore Timestamp
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate()
  }

  // seconds-based timestamp
  if (typeof value === "object" && value !== null && "seconds" in value) {
    return new Date((value as { seconds: number }).seconds * 1000)
  }

  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }

  return null
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

function computeWarrantyStatus(endDate: Date): {
  isActive: boolean
  remainingDays: number
} {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const diff = end.getTime() - now.getTime()
  const remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return { isActive: remainingDays >= 0, remainingDays }
}

function extractGarantiRecord(doc: DocumentData): GarantiRecord {
  const data = doc as Record<string, unknown>
  return {
    barcodeNumber: (data.barcodeNumber as string) ?? "",
    productName:
      (data.productName as string) ??
      (data.urunAdi as string) ??
      (data.product as string) ??
      undefined,
    customerName:
      (data.customerName as string) ??
      (data.musteriAdi as string) ??
      undefined,
    customerPhone:
      (data.customerPhone as string) ??
      (data.musteriTelefon as string) ??
      undefined,
    startDate: undefined,
    endDate: undefined,
    description:
      (data.description as string) ??
      (data.aciklama as string) ??
      undefined,
    status: (data.status as string) ?? undefined,
    createdAt: undefined,
    _startDateRaw: data.startDate ?? data.garantiBaslangic ?? data.createdAt,
    _endDateRaw: data.endDate ?? data.garantiBitis ?? data.warrantyEnd,
  }
}

/* ------------------------------------------------------------------ */
/*  StatusBadge                                                        */
/* ------------------------------------------------------------------ */

function StatusBadge({ isActive, remainingDays }: { isActive: boolean; remainingDays: number }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        Garanti Aktif
        <span className="text-[11px] font-normal text-emerald-600">
          ({remainingDays} gün kaldı)
        </span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[13px] font-semibold text-red-700 ring-1 ring-red-200">
      <XCircle className="h-4 w-4" aria-hidden />
      Süresi Dolmuş
      <span className="text-[11px] font-normal text-red-600">
        ({Math.abs(remainingDays)} gün önce)
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  InfoRow                                                            */
/* ------------------------------------------------------------------ */

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f0f0f0] last:border-b-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f4ff] shrink-0">
        <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </span>
        <span className="text-[14px] font-semibold text-[var(--color-foreground)] break-words">
          {value}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  GarantiTakipPage                                                   */
/* ------------------------------------------------------------------ */

export default function GarantiTakipPage() {
  const [seriNo, setSeriNo] = useState("")
  const [state, setState] = useState<QueryState>({ kind: "idle" })

  const handleSearch = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const trimmed = seriNo.trim()
      if (!trimmed) return

      setState({ kind: "loading" })

      try {
        // Firestore auth gerektiriyorsa anonymous login
        await ensureFirebaseAuth()

        // 1. garanti collection'inda ara
        const garantiRef = collection(db, "garanti")
        const garantiQuery = query(
          garantiRef,
          where("barcodeNumber", "==", trimmed)
        )
        const garantiSnap = await getDocs(garantiQuery)

        if (!garantiSnap.empty) {
          const doc = garantiSnap.docs[0]
          const record = extractGarantiRecord(doc.data())
          setState({ kind: "found", data: record })
          return
        }

        // 2. products collection'inda da dene
        const productsRef = collection(db, "products")
        const productsQuery = query(
          productsRef,
          where("barcodeNumber", "==", trimmed)
        )
        const productsSnap = await getDocs(productsQuery)

        if (!productsSnap.empty) {
          const doc = productsSnap.docs[0]
          const record = extractGarantiRecord(doc.data())
          setState({ kind: "found", data: record })
          return
        }

        setState({ kind: "not-found" })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Bilinmeyen bir hata olustu"

        if (message.includes("permission") || message.includes("PERMISSION")) {
          setState({
            kind: "error",
            message:
              "Firebase erişim izni reddedildi. Lütfen sistem yöneticisiyle iletişime geçin.",
          })
        } else {
          setState({ kind: "error", message })
        }
      }
    },
    [seriNo]
  )

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)] text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Shield className="h-7 w-7 text-white" aria-hidden />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Garanti Sorgulama
          </h1>
          <p className="text-[14px] sm:text-[15px] text-white/70 max-w-md mx-auto">
            Ürün seri numarasını veya barkod numarasını girerek garanti
            durumunu sorgulayabilirsiniz.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="max-w-2xl mx-auto px-4 -mt-7">
        <form
          onSubmit={handleSearch}
          className="flex items-stretch bg-white rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden"
        >
          <label htmlFor="seri-no-input" className="sr-only">
            Seri veya barkod numarası
          </label>
          <input
            id="seri-no-input"
            type="text"
            value={seriNo}
            onChange={(e) => setSeriNo(e.target.value)}
            placeholder="Seri veya barkod numarası girin..."
            className="flex-1 px-5 py-4 text-[15px] text-[var(--color-foreground)] placeholder:text-[#b0b0b0] outline-none bg-transparent"
            autoComplete="off"
            autoFocus
          />
          <button
            type="submit"
            disabled={state.kind === "loading" || !seriNo.trim()}
            className={cn(
              "flex items-center gap-2 px-6 text-[13px] font-bold uppercase tracking-wider text-white transition-colors shrink-0",
              state.kind === "loading" || !seriNo.trim()
                ? "bg-[var(--color-text-muted)] cursor-not-allowed"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary)]"
            )}
            aria-label="Garanti sorgula"
          >
            {state.kind === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden sm:inline">Sorgula</span>
          </button>
        </form>
      </section>

      {/* Results */}
      <section className="max-w-2xl mx-auto px-4 py-8" aria-live="polite">
        {/* Idle - Bilgilendirme */}
        {state.kind === "idle" && (
          <div className="space-y-8">
            {/* Nasıl Çalışır */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-[var(--color-primary)]" aria-hidden />
                Nasıl Çalışır?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#f8f9fc]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[14px] font-bold mb-3">1</div>
                  <p className="text-[13px] font-semibold text-[var(--color-foreground)] mb-1">Seri Numarasını Girin</p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">Ürün üzerindeki seri numarasını veya barkod numarasını yukarıdaki alana yazın.</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#f8f9fc]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[14px] font-bold mb-3">2</div>
                  <p className="text-[13px] font-semibold text-[var(--color-foreground)] mb-1">Sorgulama Yapın</p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">Sorgula butonuna basarak garanti kayıtlarında arama yapın.</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#f8f9fc]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[14px] font-bold mb-3">3</div>
                  <p className="text-[13px] font-semibold text-[var(--color-foreground)] mb-1">Sonuçları Görün</p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">Garanti durumu, başlangıç/bitiş tarihi ve kalan süre bilgilerine ulaşın.</p>
                </div>
              </div>
            </div>

            {/* Önemli Bilgiler */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 sm:p-8">
              <h2 className="text-[16px] font-bold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-[var(--color-primary)]" aria-hidden />
                Garanti Koşulları
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" aria-hidden />
                  <p className="text-[13px] text-[#555555]">Tüm ürünlerimiz satın alma tarihinden itibaren <span className="font-semibold text-[var(--color-foreground)]">2 yıl</span> garanti kapsamındadır.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" aria-hidden />
                  <p className="text-[13px] text-[#555555]">Garanti süresi içindeki arızalar <span className="font-semibold text-[var(--color-foreground)]">ücretsiz</span> onarılır veya ürün değiştirilir.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" aria-hidden />
                  <p className="text-[13px] text-[#555555]">Fiziksel hasar, su hasarı ve yetkisiz müdahale garanti kapsamı dışındadır.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" aria-hidden />
                  <p className="text-[13px] text-[#555555]">Garanti sorgulaması için ürün seri numarası veya barkod numarası gereklidir.</p>
                </li>
              </ul>
            </div>

            {/* İletişim */}
            <div className="bg-gradient-to-r from-[#f8f9fc] to-[#f0f4ff] rounded-2xl p-6 sm:p-8 ring-1 ring-[#e0e7ff]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)] shrink-0">
                  <Package className="h-6 w-6 text-white" aria-hidden />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-[var(--color-foreground)] mb-1">Yardıma mı İhtiyacınız Var?</h3>
                  <p className="text-[13px] text-[var(--color-text-muted)]">Garanti süreciyle ilgili sorularınız için teknik destek ekibimize <a href="tel:+905529895959" className="text-[var(--color-primary)] font-semibold hover:underline">0 552 989 5959</a> numarasından ulaşabilirsiniz. Hafta içi 09:00 - 18:00 saatleri arasında hizmetinizdeyiz.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {state.kind === "loading" && (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
            <Loader2 className="h-8 w-8 animate-spin mb-3" aria-hidden />
            <p className="text-[14px] font-medium">Garanti kaydı aranıyor...</p>
          </div>
        )}

        {/* Found */}
        {state.kind === "found" && (
          <ResultCard data={state.data} />
        )}

        {/* Not Found */}
        {state.kind === "not-found" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 mb-4">
              <AlertTriangle className="h-7 w-7 text-amber-500" aria-hidden />
            </div>
            <h2 className="text-[16px] font-bold text-[var(--color-foreground)] mb-1">
              Kayıt Bulunamadı
            </h2>
            <p className="text-[13px] text-[var(--color-text-muted)] max-w-sm">
              Bu seri numarasına ait garanti kaydı bulunamadı. Lütfen numarayı
              kontrol edip tekrar deneyin veya teknik destek ile iletişime geçin.
            </p>
          </div>
        )}

        {/* Error */}
        {state.kind === "error" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-4">
              <XCircle className="h-7 w-7 text-red-500" aria-hidden />
            </div>
            <h2 className="text-[16px] font-bold text-[var(--color-foreground)] mb-1">
              Hata Oluştu
            </h2>
            <p className="text-[13px] text-[var(--color-text-muted)] max-w-sm">
              {state.message}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ResultCard                                                         */
/* ------------------------------------------------------------------ */

function ResultCard({ data }: { data: GarantiRecord }) {
  const raw = data as unknown as Record<string, unknown>
  const startDate = parseDate(raw._startDateRaw)
  const endDate = parseDate(raw._endDateRaw)
  const warranty = endDate ? computeWarrantyStatus(endDate) : null

  return (
    <div className="bg-white rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#f0f0f0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-[var(--color-foreground)]">
            {data.productName ?? "Ürün Bilgisi"}
          </h2>
          {data.customerName && (
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
              Müşteri: {data.customerName}
            </p>
          )}
        </div>
        {warranty && (
          <StatusBadge
            isActive={warranty.isActive}
            remainingDays={warranty.remainingDays}
          />
        )}
      </div>

      {/* Details */}
      <div className="px-6 py-4">
        <InfoRow
          icon={Hash}
          label="Seri / Barkod Numarası"
          value={data.barcodeNumber}
        />

        {startDate && (
          <InfoRow
            icon={Calendar}
            label="Garanti Başlangıç Tarihi"
            value={formatDate(startDate)}
          />
        )}

        {endDate && (
          <InfoRow
            icon={Calendar}
            label="Garanti Bitiş Tarihi"
            value={formatDate(endDate)}
          />
        )}

        {warranty && (
          <InfoRow
            icon={Clock}
            label="Kalan Süre"
            value={
              warranty.isActive
                ? `${warranty.remainingDays} gün`
                : `Süresi ${Math.abs(warranty.remainingDays)} gün önce doldu`
            }
          />
        )}

        {data.description && (
          <InfoRow icon={Info} label="Açıklama" value={data.description} />
        )}

        {data.customerPhone && (
          <InfoRow
            icon={Package}
            label="Müşteri Telefon"
            value={data.customerPhone}
          />
        )}
      </div>

      {/* Footer info */}
      {!endDate && !startDate && (
        <div className="px-6 py-4 bg-[#fafafa] border-t border-[#f0f0f0]">
          <p className="text-[12px] text-[#999999] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" aria-hidden />
            Garanti tarih bilgisi bu kayıtta mevcut değil.
          </p>
        </div>
      )}
    </div>
  )
}
