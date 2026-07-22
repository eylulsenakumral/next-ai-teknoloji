"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, Search, Shield, Truck, Headphones, Wrench } from "lucide-react"
import { SearchAutocomplete } from "@/components/public/search-autocomplete"
import { cn } from "@/lib/utils"

export interface MarqueeBrand {
  id: string
  name: string
  slug: string
  productCount: number
}

interface HomeHeroProps {
  total: number
  brandCount: number
  brands: MarqueeBrand[]
}

const SLIDES = [
  { label: "Güvenlik", title: "Güvenlik Sistemleri Ürünlerinde Çözüm Ortağınız", accent: "Güvenlik" },
  { label: "Yangın Alarm", title: "Yangın Algılama Sistemlerinde Güvenilir İş Ortağınız", accent: "Yangın" },
  { label: "Hırsız Alarm", title: "Hırsız Alarm Sistemlerinde Profesyonel Çözümler", accent: "Alarm" },
  { label: "Araç Kameraları", title: "Araç Kameralarında Güvenliğiniz İçin Buradayız", accent: "Araç" },
]

const TRUST = [
  { Icon: Shield, title: "2 Yıl Garanti", desc: "Tüm ürünlerde" },
  { Icon: Truck, title: "Hızlı Teslimat", desc: "24-48 saat içinde" },
  { Icon: Headphones, title: "7/24 Destek", desc: "WhatsApp ile" },
  { Icon: Wrench, title: "Satış Sonrası Destek", desc: "Teknik Destek" },
]

/**
 * HomeHero — markalar sayfasının beğenilen düzeninden uyarlandı:
 * solda dönüşen mesaj, sağda arama kartı + güven rozetleri, altta marka marquee'si.
 */
export function HomeHero({ total, brandCount, brands }: HomeHeroProps) {
  const router = useRouter()
  const [index, setIndex] = useState(0)

  const productBadge =
    total > 0
      ? `${(Math.floor(total / 100) * 100).toLocaleString("tr-TR")}+ Ürün`
      : "Ürün Yelpazesi"

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), [])
  useEffect(() => {
    const t = setInterval(next, 4500)
    return () => clearInterval(t)
  }, [next])

  const slide = SLIDES[index]

  return (
    <section className="relative overflow-hidden border-b border-[#E9F1FC] bg-white">
      {/* Katmanlı arka plan */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E9F1FC] via-[#F4F9FE] to-white" />
      <div aria-hidden className="absolute inset-0 nx-hero-dots" />
      <div aria-hidden className="pointer-events-none absolute -top-32 right-[6%] h-[420px] w-[420px] rounded-full bg-[#1852ac]/[0.09] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-28 bottom-10 h-[300px] w-[300px] rounded-full bg-nx-accent/[0.07] blur-3xl" />

      <div className="relative mx-auto max-w-[1400px] px-4 pb-12 pt-14 sm:px-6 md:pt-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.12fr_0.88fr]">
          {/* Sol — dönüşen mesaj */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1852ac]/15 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#1852ac]">
                <Zap className="h-3.5 w-3.5 text-nx-accent" aria-hidden />
                {productBadge}
              </span>
              <span
                key={`label-${index}`}
                className="nx-fade-up text-[11px] font-bold uppercase tracking-widest text-[#1852ac]/60"
              >
                {slide.label}
              </span>
            </div>

            <h1
              key={`title-${index}`}
              className="nx-fade-up mt-5 min-h-[2.3em] font-nx-heading text-4xl font-bold leading-[1.1] tracking-tight text-[#1852ac] sm:text-5xl xl:text-[3.5rem]"
            >
              {slide.title.split(slide.accent).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="text-nx-accent">{slide.accent}</span>}
                </span>
              ))}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              IP kamera, güvenlik kayıt cihazı, yangın algılama, hırsız alarm sistemleri, araç kameraları ve
              network altyapısından güç elektroniğine; projelerinizin tüm ürünleri tek adres{" "}
              <span className="font-nx-serif italic text-nx-accent">Next AI Teknoloji</span>.
            </p>

            {/* Slayt göstergeleri */}
            <div className="mt-7 flex items-center gap-2">
              {SLIDES.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  aria-label={s.label}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-9 bg-[#1852ac]" : "w-4 bg-[#1852ac]/15 hover:bg-[#1852ac]/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Sağ — arama */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-nx-accent" aria-hidden />
              <p className="font-nx-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1852ac]">
                Hızlı Arama
              </p>
            </div>

            <SearchAutocomplete
              placeholder="Ürün, marka veya model ara..."
              ariaLabel="Ürün ara"
              boxClassName="flex h-[52px] overflow-hidden rounded-xl border border-slate-200 bg-[#F7FAFE] transition-all focus-within:border-nx-accent focus-within:ring-4 focus-within:ring-nx-accent/15"
              inputClassName="flex-1 bg-transparent px-5 text-[14px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
              onSubmit={(q) => router.push(`/katalog?search=${encodeURIComponent(q)}`)}
              action={
                <button
                  type="submit"
                  className="flex h-full items-center gap-2 bg-gradient-to-r from-[#1852ac] to-[#06B6D4] px-6 text-[13px] font-semibold uppercase tracking-wider text-white transition-all hover:from-[#12408a] hover:to-[#0891B2]"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:block">Ara</span>
                </button>
              }
            />

            <p className="mt-3.5 text-xs text-slate-500">
              <span className="font-bold text-[#1852ac]">{total.toLocaleString("tr-TR")}</span> ürün,{" "}
              <span className="font-bold text-[#1852ac]">{brandCount}</span> marka arasında arama yapın
            </p>
          </div>
        </div>

        {/* Güven şeridi — hero ile marquee arasında ince bant */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t border-[#E9F1FC] pt-8">
          {TRUST.map(({ Icon, title, desc }) => (
            <div key={title} className="group flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1852ac]/15 bg-white/80 text-[#1852ac] transition-all duration-300 group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-[#1852ac] group-hover:to-[#06B6D4] group-hover:text-white group-hover:shadow-md">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-[#1852ac]">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marka marquee — en çok ürünü olan markalar */}
      {brands.length > 0 && (
        <div className="nx-marquee relative border-t border-[#E9F1FC] bg-white/70 py-5 backdrop-blur-sm">
          <div className="nx-marquee-track flex w-max items-center gap-14 px-7">
            {[...brands, ...brands].map((b, i) => (
              <Link
                key={`${b.id}-${i}`}
                href={`/markalar/${b.slug}`}
                className="flex shrink-0 items-center gap-3 opacity-70 transition hover:opacity-100"
                aria-label={`${b.name} markası`}
              >
                <span className="font-nx-heading text-xl font-bold tracking-tight text-[#1852ac]">{b.name}</span>
                <span className="rounded-full bg-[#E9F1FC] px-2 py-0.5 text-[10px] font-bold text-[#1852ac]">
                  {b.productCount}
                </span>
              </Link>
            ))}
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
        </div>
      )}
    </section>
  )
}
