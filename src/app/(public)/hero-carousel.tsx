"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Phone } from "lucide-react"

// Hero slider — 5 çözüm alanı; üstteki küçük etiket slaytla senkron döner
const SLIDES = [
  {
    tag: "Güvenlik Kamerası",
    title: "Güvenlik Sistemleri Modern Mekanlar İçin Yeniden Tanımlandı",
    desc: "AI kamera, NVR ve analitikten fiber omurgaya kadar uçtan uca sistem tedariki. Proje bazlı teklif, bayi avantajları ve 7/24 teknik destek.",
  },
  {
    tag: "Yangın İhbar",
    title: "Yangını Daha Başlamadan Tespit Eden Akıllı Sistemler",
    desc: "Adresli yangın panelleri, duman ve ısı sensörleri ile erken uyarı. Proje tasarımı, devreye alma ve periyodik bakım desteği.",
  },
  {
    tag: "Hırsız Alarm",
    title: "İzinsiz Girişe Karşı 7/24 Tetikte Alarm Sistemleri",
    desc: "PIR sensörler, manyetik kontaklar ve kablosuz panel teknolojisi. Uzaktan izleme ve anında bildirim ile tam koruma.",
  },
  {
    tag: "Araç Kamerası",
    title: "Filonuz Yolda da Güvende: Araç Kamera Sistemleri",
    desc: "Araç içi NVR, GPS takip ve mobil izleme. Filo güvenliği ve sürüş analizi için uçtan uca çözümler.",
  },
  {
    tag: "Yazılım",
    title: "Tüm Sistemleri Tek Ekrandan Yöneten Yazılımlar",
    desc: "VMS, CMS ve entegrasyon platformları ile merkezî yönetim. AI analitik, raporlama ve uzaktan erişim.",
  },
]

const DURATION = 4500

export function HeroCarousel() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), DURATION)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#F2F7FE_0%,#E9F1FC_100%)] font-nx-sans">
      {/* Arka plan dekoru — mavimsi parıltılar + nokta dokusu */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[8%] h-[460px] w-[460px] rounded-full bg-nx-accent/[0.16] blur-3xl" />
        <div className="absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-[#1852ac]/[0.16] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-[#4d8df0]/[0.10] blur-3xl" />
        <div className="absolute inset-0 nx-hero-dots" />
      </div>
      {/* Ceron: tek kolon ortalı, açık bg */}
      <div className="relative mx-auto flex max-w-[1300px] flex-col items-center px-6 py-12 text-center md:py-12">
        {/* Yatay slide track — tüm slaytlar yan yana, translateX ile kayar */}
        <div className="w-full overflow-hidden">
          <div
            className="nx-slide-track flex transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {SLIDES.map((s, i) => (
              <div
                key={s.tag}
                aria-hidden={i !== idx}
                className="flex w-full shrink-0 flex-col items-center px-2"
              >
                {/* Slayt etiketi — senkron kategori etiketi */}
                <p className="font-nx-mono text-xs font-bold uppercase tracking-[0.25em] text-nx-accent">
                  {s.tag}
                </p>
                {/* H1 — Ceron: Sora 600, 45px, letter -1.35px, tek renk #0F172A */}
                {/* min-h: slayt değişiminde layout shift önleme */}
                <h1 className="mt-4 flex min-h-[108px] items-center justify-center font-nx-heading text-[45px] font-semibold leading-[1.2] tracking-[-1.35px] text-nx-dark md:text-[45px]">
                  {s.title}
                </h1>
                {/* Description — Ceron: 18px/27px, #666666 */}
                <p className="mt-5 flex min-h-[81px] max-w-[560px] items-start justify-center text-[18px] leading-[1.5] text-[#666666]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Butonlar — Ceron: 14px/600, UPPERCASE */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/teklif-iste"
            className="inline-flex items-center gap-2 rounded-full bg-nx-accent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-nx-accent-hover"
          >
            Teklif Al <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="tel:+905529895959"
            className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold uppercase tracking-wide text-nx-dark transition hover:text-nx-accent"
          >
            <Phone className="h-4 w-4" /> +90 552 989 59 59
          </a>
        </div>

        {/* Avatar stack + 340+ */}
        <div className="mt-7 flex items-center gap-3">
          <div className="flex -space-x-3">
            {[
              "/images/ceron/r-1.jpg",
              "/images/ceron/124545.jpg",
              "/images/ceron/r-3.jpg",
            ].map((src) => (
              <img
                key={src}
                src={src}
                alt="Bayi"
                className="h-10 w-10 rounded-full border-2 border-[#F5F5F5] object-cover"
              />
            ))}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-nx-dark">340+</span>
            <span className="text-sm text-[#666666]">Aktif Bayi</span>
          </div>
        </div>

        {/* Slayt göstergeleri — tıklanabilir tire göstergeler */}
        <div className="mt-6 flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.tag}
              type="button"
              aria-label={s.tag}
              aria-current={i === idx}
              onClick={() => setIdx(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === idx ? "w-8 bg-nx-accent" : "w-4 bg-nx-dark/15 hover:bg-nx-dark/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
