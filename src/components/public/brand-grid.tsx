"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Package, ArrowRight, Search, X, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BrandItem {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  productCount: number
  categorySlugs: string[]
}

export interface BrandCategory {
  slug: string
  name: string
  count: number
}

/* ------------------------------------------------------------------ */
/*  BrandCard                                                          */
/* ------------------------------------------------------------------ */

function BrandCard({ brand }: { brand: BrandItem }) {
  return (
    <Link
      href={`/markalar/${brand.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-nx-accent/40 hover:shadow-lg"
    >
      <div className="flex h-12 items-center">
        {brand.logoUrl ? (
          <span className="relative block h-12 w-full">
            <Image
              src={brand.logoUrl}
              alt={brand.name}
              fill
              className="object-contain object-left opacity-85 transition group-hover:opacity-100"
              sizes="(max-width: 640px) 40vw, 200px"
            />
          </span>
        ) : (
          <span className="font-nx-heading text-lg font-bold tracking-tight text-[#1852ac]">
            {brand.name}
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 min-h-[40px] text-xs leading-5 text-slate-500">
        {brand.description ?? `${brand.name} ürünleri — toptan bayi fiyatları ve stok`}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F1FC] px-2 py-1 text-[11px] font-bold text-[#1852ac]">
          <Package className="h-3 w-3 text-nx-accent" aria-hidden />
          {brand.productCount} ürün
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-nx-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          İncele <ArrowRight className="h-3 w-3" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/*  BrandGrid — arama + kategori sekmeleri                             */
/* ------------------------------------------------------------------ */

export function BrandGrid({ brands, categories }: { brands: BrandItem[]; categories: BrandCategory[] }) {
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return brands.filter((b) => {
      const matchesCat = activeCat === "all" || b.categorySlugs.includes(activeCat)
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.description?.toLowerCase().includes(q) ?? false)
      return matchesCat && matchesSearch
    })
  }, [brands, search, activeCat])

  function clearFilters() {
    setSearch("")
    setActiveCat("all")
  }

  return (
    <section className="bg-[#F7FAFE] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Başlık + arama */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-nx-mono text-xs font-bold uppercase tracking-[0.25em] text-[#1852ac]">
              Katalog
            </p>
            <h2 className="mt-3 font-nx-heading text-3xl font-bold tracking-tight text-[#1852ac] md:text-4xl">
              Stoktaki tüm markalar
            </h2>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Marka veya açıklama ara..."
              aria-label="Marka ara"
              className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-nx-accent focus:ring-4 focus:ring-nx-accent/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Aramayı temizle"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {/* Kategori sekmeleri */}
        <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Kategoriye göre filtrele">
          <button
            type="button"
            onClick={() => setActiveCat("all")}
            aria-pressed={activeCat === "all"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all",
              activeCat === "all"
                ? "border-[#1852ac] bg-[#1852ac] text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#1852ac]/40 hover:text-[#1852ac]"
            )}
          >
            Tümü
            <span className={cn("text-[11px] font-bold", activeCat === "all" ? "text-blue-200" : "text-slate-400")}>
              {brands.length}
            </span>
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setActiveCat(activeCat === c.slug ? "all" : c.slug)}
              aria-pressed={activeCat === c.slug}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all",
                activeCat === c.slug
                  ? "border-[#1852ac] bg-[#1852ac] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#1852ac]/40 hover:text-[#1852ac]"
              )}
            >
              {c.name}
              <span className={cn("text-[11px] font-bold", activeCat === c.slug ? "text-blue-200" : "text-slate-400")}>
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sonuç sayısı */}
        <p className="mt-6 text-sm text-slate-500" aria-live="polite">
          <span className="font-semibold text-[#1852ac]">{filtered.length}</span> marka gösteriliyor
        </p>

        {/* Grid / boş durum */}
        {filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <SearchX className="h-10 w-10 text-slate-300" aria-hidden />
            <p className="mt-4 text-sm font-semibold text-slate-600">Eşleşen marka bulunamadı</p>
            <p className="mt-1 text-xs text-slate-400">Farklı bir arama terimi veya kategori deneyin.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1852ac] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#12408a]"
            >
              Filtreleri temizle
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((b) => (
              <BrandCard key={b.id} brand={b} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
