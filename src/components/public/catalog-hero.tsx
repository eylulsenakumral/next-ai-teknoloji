"use client"

import { useState, useEffect, useCallback } from "react"
import { Zap, Shield, Truck, Headphones, Search } from "lucide-react"
import { SearchAutocomplete } from "@/components/public/search-autocomplete"

/**
 * CatalogHero — katalog sayfasından çıkan, arama odaklı hero.
 * Anasayfa ve katalog ortak kullanır; arama davranışı `onSearch` ile enjekte edilir.
 */
export function CatalogHero({ total, onSearch }: { total: number; onSearch: (q: string) => void }) {
  // DB'den gelen gerçek ürün sayısı — yüzler basamağına yuvarlanıp "+" ile gösterilir (1.845 → "1.800+ Ürün")
  // total henüz yüklenmediyse (katalog client fetch) nötr bir ifade gösterilir
  const productBadge =
    total > 0
      ? `${(Math.floor(total / 100) * 100).toLocaleString("tr-TR")}+ Ürün`
      : "Ürün Yelpazesi"

  const slides = [
    { label: "Güvenlik", title: "Güvenlik Sistemleri Ürünlerinde Çözüm Ortağınız", accent: "Güvenlik" },
    { label: "Yangın Alarm", title: "Yangın Algılama Sistemlerinde Güvenilir İş Ortağınız", accent: "Yangın" },
    { label: "Hırsız Alarm", title: "Hırsız Alarm Sistemlerinde Profesyonel Çözümler", accent: "Alarm" },
    { label: "Araç Kameraları", title: "Araç Kameralarında Güvenliğiniz İçin Buradayız", accent: "Araç" },
  ]

  const [index, setIndex] = useState(0)

  const nextSlide = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length)
  }, [slides.length])

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <section className="relative bg-white border-b border-[#E9F1FC] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#E9F1FC] via-[#F4F9FE] to-white" />
      <div aria-hidden className="pointer-events-none absolute -top-32 right-[10%] h-[380px] w-[380px] rounded-full bg-[#1852ac]/[0.08] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -left-24 h-[280px] w-[280px] rounded-full bg-nx-accent/[0.07] blur-3xl" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1852ac] uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5 text-nx-accent" aria-hidden />
              {productBadge}
            </span>
            <span className="w-px h-4 bg-[#1852ac]/25" />
            <span className="text-xs font-semibold text-[#1852ac]/70 uppercase tracking-widest">
              {slides[index].label}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#1852ac] mb-4 min-h-[1.2em]">
            {slides[index].title.split(slides[index].accent).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <span className="text-nx-accent">{slides[index].accent}</span>}
              </span>
            ))}
          </h1>

          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            IP kamera, güvenlik kayıt cihazı, yangın algılama, hırsız alarm sistemleri, araç kameraları ve network altyapısından güç elektroniğine; projelerinizin tüm ürünleri tek adres{" "}
            <span className="font-nx-serif italic text-nx-accent">Next AI Teknoloji</span>.
          </p>

          <SearchAutocomplete
            placeholder="Ürün, marka veya model ara..."
            ariaLabel="Ürün ara"
            formClassName="max-w-xl"
            boxClassName="flex h-14 bg-white border border-[#1852ac]/15 shadow-sm overflow-hidden focus-within:border-nx-accent focus-within:ring-4 focus-within:ring-nx-accent/15 transition-all rounded-l-[20px] rounded-r-lg"
            inputClassName="flex-1 px-6 text-[15px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none bg-transparent"
            onSubmit={onSearch}
            action={
              <button
                type="submit"
                className="h-full px-8 bg-gradient-to-r from-[#1852ac] to-[#06B6D4] hover:from-[#12408a] hover:to-[#0891B2] text-white font-semibold text-[13px] uppercase tracking-wider transition-all rounded-r-[20px] flex items-center gap-2"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="hidden sm:block">Ara</span>
              </button>
            }
          />

          {total > 0 && (
            <p className="mt-4 text-sm text-slate-400">
              <span className="font-semibold text-slate-600">{total.toLocaleString("tr-TR")}</span> ürün bulunuyor
            </p>
          )}
        </div>

        <div className="hidden lg:grid grid-cols-3 gap-5 mt-12 pt-8 border-t border-[var(--color-border)]">
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-nx-accent/30">
            <div className="absolute inset-0 bg-gradient-to-br from-nx-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1852ac] to-[#06B6D4] text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                <Shield className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-base font-bold text-[#1852ac]">2 Yıl Garanti</p>
                <p className="text-sm text-[var(--color-text-muted)]">Tüm ürünlerde</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-nx-accent/30">
            <div className="absolute inset-0 bg-gradient-to-br from-nx-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1852ac] to-[#06B6D4] text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                <Truck className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-base font-bold text-[#1852ac]">Hızlı Teslimat</p>
                <p className="text-sm text-[var(--color-text-muted)]">24-48 saat içinde</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-nx-accent/30">
            <div className="absolute inset-0 bg-gradient-to-br from-nx-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1852ac] to-[#06B6D4] text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                <Headphones className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-base font-bold text-[#1852ac]">7/24 Destek</p>
                <p className="text-sm text-[var(--color-text-muted)]">WhatsApp ile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
