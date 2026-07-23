"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight, Package } from "lucide-react"

export type HeroCard = { title: string; href: string; img: string; slug: string; productCount: number }

const PAGE_SIZE = 7

/**
 * Hero kategori şeridi — Ceron 7'li kart düzeni, sayfalı.
 * Her kategori kendi görseliyle, orta kart büyütülmüş, zengin hover efektleri.
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
          className="absolute -left-3 top-[58%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-nx-dark shadow-lg transition hover:bg-nx-accent hover:text-white md:-left-6"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Ceron: 7 kolon grid, orta kart (4.) büyütülmüş */}
      <div className="nx-cat-grid" key={page}>
        {visible.map((cat, i) => {
          const isCenter = i === 3
          return (
            <Link
              key={cat.href}
              href={cat.href}
              style={isCenter ? undefined : { zIndex: i === 0 || i === 6 ? 5 : 8 }}
              className={`nx-cat-card group relative block overflow-hidden${
                isCenter ? " nx-cat-card--center" : ""
              }`}
            >
              {/* Kategori görseli — hover'da hafif büyür */}
              <Image
                src={cat.img}
                alt={cat.title}
                loading="eager"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover karartması — yazı okunurluğu için */}
              <div className="absolute inset-0 bg-nx-dark/0 transition-colors duration-300 group-hover:bg-nx-dark/25" />

              {/* Kenar gradientleri — kenar kartlarda sabit */}
              {i === 0 && (
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#E9F1FC_0%,transparent_25%)]" />
              )}
              {i === 6 && (
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_75%,#E9F1FC_100%)]" />
              )}

              {/* Cam hap etiket — isim + ürün sayısı + ok */}
              <div className="nx-cat-pill absolute bottom-[15px] left-[15px] right-[15px] flex items-center gap-[6px] rounded-full bg-white/60 py-[3px] pl-[12px] pr-[3px] backdrop-blur-[6px] transition-colors duration-300 group-hover:bg-white">
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-none text-nx-dark">
                  {cat.title}
                </span>
                {cat.productCount > 0 && (
                  <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#E9F1FC] px-2 py-1 text-[10px] font-bold text-[#1852ac] transition-colors duration-300 group-hover:bg-nx-accent group-hover:text-white sm:flex">
                    <Package className="h-3 w-3" aria-hidden />
                    {cat.productCount}
                  </span>
                )}
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-nx-accent text-white transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="h-[13px] w-[13px]" />
                </span>
              </div>
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
          className="absolute -right-3 top-[58%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-nx-dark shadow-lg transition hover:bg-nx-accent hover:text-white md:-right-6"
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
