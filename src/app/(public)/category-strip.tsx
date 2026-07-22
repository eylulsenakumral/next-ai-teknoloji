"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

export type HeroCard = { title: string; href: string; img: string }

const PAGE_SIZE = 7

/**
 * Hero kategori şeridi — Ceron 7'li kart düzeni, sayfalı.
 * Tüm aktif ana kategoriler sağ/sol oklarla gezilir.
 */
export function CategoryStrip({ categories }: { categories: HeroCard[] }) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(categories.length / PAGE_SIZE))
  const visible = categories.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const go = (dir: 1 | -1) => setPage((p) => (p + dir + pageCount) % pageCount)

  return (
    <div className="relative">
      {/* Sol ok */}
      {pageCount > 1 && (
        <button
          type="button"
          aria-label="Önceki kategoriler"
          onClick={() => go(-1)}
          className="absolute -left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-nx-dark shadow-lg transition hover:bg-nx-accent hover:text-white md:-left-6"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Ceron: 7 kolon grid, 15px gap, orta kart (4.) büyütülmüş */}
      <div className="nx-cat-grid" key={page}>
        {visible.map((cat, i) => {
          const isCenter = i === 3 // lg'de orta kart (7'linin 4.'sü)
          return (
            <Link
              key={cat.href}
              href={cat.href}
              style={isCenter ? undefined : { zIndex: i === 0 || i === 6 ? 5 : 8 }}
              className={`nx-cat-card group relative block overflow-hidden${
                isCenter ? " nx-cat-card--center" : ""
              }`}
            >
              <Image
                src={cat.img}
                alt={cat.title}
                loading="eager"
                fill
                className="object-cover"
              />
              {/* Ceron: açık kenar gradientleri — kenar kartlarda sabit, iç kartlarda hover'da */}
              {i === 0 && (
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#E9F1FC_0%,transparent_25%)]" />
              )}
              {i === 6 && (
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_75%,#E9F1FC_100%)]" />
              )}
              {(i === 1 || i === 2 || i === 4 || i === 5) && (
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_60%,#E9F1FC_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              )}
              {isCenter && (
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#E9F1FC_0%,transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              )}
              {/* Ceron: cam hap etiket — white/50 + blur 5px, koyu başlık + cyan yuvarlak ikon */}
              <div className="nx-cat-pill absolute bottom-[15px] left-[15px] flex items-center gap-[5px] rounded-full bg-white/50 py-[3px] pl-[10px] pr-[3px] backdrop-blur-[5px] transition-colors duration-300 group-hover:bg-white">
                <span className="text-[13px] font-semibold leading-none text-nx-dark">
                  {cat.title}
                </span>
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-nx-accent text-white">
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
          className="absolute -right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-nx-dark shadow-lg transition hover:bg-nx-accent hover:text-white md:-right-6"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Sayfa göstergesi */}
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
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
