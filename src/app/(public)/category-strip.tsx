"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Package,
  Monitor,
  BatteryCharging,
  Building2,
  Cpu,
  Printer,
  Wifi,
  Cable,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Speaker,
  Server,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type HeroCard = { title: string; href: string; img: string; slug: string; productCount: number }

const PAGE_SIZE = 7

/** slug → ikon + gradyan eşlemesi (her kategoriye özgü görsel kimlik) */
const CATEGORY_META: Record<string, { icon: LucideIcon; gradient: string }> = {
  guvenlik: { icon: ShieldCheck, gradient: "from-[#1852ac] to-[#3B82F6]" },
  "cevre-birimleri": { icon: Monitor, gradient: "from-[#1852ac] to-[#3B82F6]" },
  "kesintisiz-guc-kaynaklari": { icon: BatteryCharging, gradient: "from-[#06B6D4] to-[#22D3EE]" },
  "kurumsal-urunler": { icon: Building2, gradient: "from-[#0F172A] to-[#1852ac]" },
  "bilgisayar-bilesenleri": { icon: Cpu, gradient: "from-[#1852ac] to-[#06B6D4]" },
  "baski-cozumleri": { icon: Printer, gradient: "from-[#0891B2] to-[#22D3EE]" },
  "network-urunleri": { icon: Wifi, gradient: "from-[#1852ac] to-[#60A5FA]" },
  network: { icon: Wifi, gradient: "from-[#1852ac] to-[#60A5FA]" },
  "kablo-cevirici": { icon: Cable, gradient: "from-[#06B6D4] to-[#0F172A]" },
  "yangin-algilama-urunleri": { icon: Flame, gradient: "from-[#0891B2] to-[#06B6D4]" },
  "hirsiz-algilama-urunleri": { icon: ShieldAlert, gradient: "from-[#0F172A] to-[#0891B2]" },
  "guc-elektronigi": { icon: Zap, gradient: "from-[#06B6D4] to-[#22D3EE]" },
  "seslendirme-sistemleri": { icon: Speaker, gradient: "from-[#1852ac] to-[#06B6D4]" },
  kabinetler: { icon: Server, gradient: "from-[#0F172A] to-[#1852ac]" },
}
const DEFAULT_META = { icon: Package, gradient: "from-[#1852ac] to-[#06B6D4]" }

function getMeta(slug: string) {
  return CATEGORY_META[slug] ?? DEFAULT_META
}

/**
 * Hero kategori şeridi — ikon tabanlı zengin kartlar, sayfalı.
 * Her kategoriye özgü ikon + gradyan, ürün sayısı, hover mikro-etkileşimleri.
 */
export function CategoryStrip({ categories }: { categories: HeroCard[] }) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(categories.length / PAGE_SIZE))
  const visible = categories.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const go = (dir: 1 | -1) => setPage((p) => (p + dir + pageCount) % pageCount)

  return (
    <div className="relative">
      {/* Bölüm başlığı */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-nx-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#1852ac]">
            Kategoriler
          </p>
          <h2 className="mt-2 font-nx-heading text-3xl font-bold tracking-tight text-nx-dark md:text-4xl">
            Ürün <span className="text-nx-accent">Kategorileri</span>
          </h2>
        </div>
        <Link
          href="/kategoriler"
          className="group hidden items-center gap-1.5 text-sm font-bold text-[#1852ac] transition hover:text-nx-accent sm:flex"
        >
          Tümünü Gör
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Sol ok */}
      {pageCount > 1 && (
        <button
          type="button"
          aria-label="Önceki kategoriler"
          onClick={() => go(-1)}
          className="absolute -left-3 top-[55%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-nx-dark shadow-lg transition hover:bg-nx-accent hover:text-white md:-left-6"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Kategori kartları */}
      <div className="nx-cat-grid" key={page}>
        {visible.map((cat) => {
          const { icon: Icon, gradient } = getMeta(cat.slug)
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className="nx-cat-card group relative flex flex-col items-center overflow-hidden rounded-[20px] border border-[#E9F1FC] bg-white px-4 pb-5 pt-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-nx-accent/50 hover:shadow-[0_12px_32px_-8px_rgba(24,82,172,0.18)]"
            >
              {/* Üst vurgu çizgisi — hover'da belirir */}
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100",
                  gradient
                )}
              />

              {/* İkon rozeti */}
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                  gradient
                )}
              >
                <Icon className="h-7 w-7" aria-hidden />
              </span>

              {/* Kategori adı */}
              <span className="mt-4 text-[14px] font-bold leading-snug text-nx-dark transition-colors duration-300 group-hover:text-[#1852ac]">
                {cat.title}
              </span>

              {/* Ürün sayısı */}
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#E9F1FC] px-2.5 py-1 text-[11px] font-bold text-[#1852ac] transition-colors duration-300 group-hover:bg-nx-accent group-hover:text-white">
                <Package className="h-3 w-3" aria-hidden />
                {cat.productCount > 0 ? `${cat.productCount} ürün` : "Ürünler"}
              </span>

              {/* Hover oku */}
              <span className="pointer-events-none absolute right-3 top-3 flex h-7 w-7 -translate-x-1 items-center justify-center rounded-full bg-nx-accent text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          )
        })}
      </div>

      {/* Sağ ok */}
      {pageCount > 1 && (
        <button
          type="button"
          aria-label="Sonraki kategoriler"
          onClick={() => go(1)}
          className="absolute -right-3 top-[55%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-nx-dark shadow-lg transition hover:bg-nx-accent hover:text-white md:-right-6"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Sayfa göstergesi */}
      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Sayfa ${i + 1}`}
              aria-current={i === page}
              onClick={() => setPage(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === page ? "w-8 bg-nx-accent" : "w-4 bg-nx-dark/15 hover:bg-nx-dark/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
