"use client"

import { useState } from "react"
import { Zap, Shield, Truck, Headphones, Search } from "lucide-react"

/**
 * CatalogHero — katalog sayfasından çıkan, arama odaklı hero.
 * Anasayfa ve katalog ortak kullanır; arama davranışı `onSearch` ile enjekte edilir.
 */
export function CatalogHero({ total, onSearch }: { total: number; onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) onSearch(trimmed)
  }

  // DB'den gelen gerçek ürün sayısı — yüzler basamağına yuvarlanıp "+" ile gösterilir (1.845 → "1.800+ Ürün")
  // total henüz yüklenmediyse (katalog client fetch) nötr bir ifade gösterilir
  const productBadge =
    total > 0
      ? `${(Math.floor(total / 100) * 100).toLocaleString("tr-TR")}+ Ürün`
      : "Ürün Yelpazesi"

  return (
    <section className="relative bg-white border-b border-[var(--color-border)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-background)] via-white to-white" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {productBadge}
            </span>
            <span className="w-px h-4 bg-[var(--color-border)]" />
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-widest">
              Teknoloji Çözüm Merkezi
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--color-primary)] mb-4">
            Güvenlik, Yangın Alarm, Hırsız Alarm ve <span className="text-nx-accent">Araç Kameraları</span>
          </h1>

          <p className="text-lg text-[var(--color-text-muted)] mb-8 leading-relaxed">
            IP kamera, güvenlik kayıt cihazı, yangın algılama, hırsız alarm sistemleri, araç kameraları ve network altyapısından güç elektroniğine; projelerinizin tüm ürünleri tek adres{" "}
            <span className="font-nx-serif italic text-nx-accent">Next AI Teknoloji</span>.
          </p>

          <form onSubmit={handleSubmit} className="flex max-w-xl" role="search" aria-label="Ürün ara">
            <div className="flex flex-1 h-14 bg-[var(--color-background)] border border-[var(--color-border)] overflow-hidden focus-within:border-nx-accent focus-within:ring-4 focus-within:ring-[var(--color-background)]/50 transition-all rounded-l-[20px] rounded-r-lg">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün, marka veya model ara..."
                className="flex-1 px-6 text-[15px] text-[var(--color-primary)] placeholder:text-slate-400 focus:outline-none bg-transparent"
                aria-label="Arama terimi"
              />
              <button
                type="submit"
                className="h-full px-8 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-[13px] uppercase tracking-wider transition-colors rounded-r-[20px] flex items-center gap-2"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="hidden sm:block">Ara</span>
              </button>
            </div>
          </form>

          {total > 0 && (
            <p className="mt-4 text-sm text-slate-400">
              <span className="font-semibold text-slate-600">{total.toLocaleString("tr-TR")}</span> ürün bulunuyor
            </p>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-8 mt-12 pt-8 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-background)] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">2 Yıl Garanti</p>
              <p className="text-xs text-[var(--color-text-muted)]">Tüm ürünlerde</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-background)] flex items-center justify-center">
              <Truck className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">Hızlı Teslimat</p>
              <p className="text-xs text-[var(--color-text-muted)]">24-48 saat içinde</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-background)] flex items-center justify-center">
              <Headphones className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">7/24 Destek</p>
              <p className="text-xs text-[var(--color-text-muted)]">WhatsApp ile</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
