"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, EffectFade } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/effect-fade"
import Link from "next/link"
import { ArrowRight, Phone, ShieldCheck } from "lucide-react"

const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1600&q=75&auto=format&fit=crop",
    tag: "Video Güvenlik",
    title: "Güvenlik sistemleri modern iş alanları için yeniden tanımlandı",
    sub: "AI kamera, NVR ve analitik ile uçtan uca görüntü güvenliği. Proje bazlı teklif ve 7/24 teknik destek.",
  },
  {
    img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&q=75&auto=format&fit=crop",
    tag: "Ağ & Network",
    title: "Kurumsal bağlantı altyapısı, güvenle ölçeklenir",
    sub: "PoE switch, wireless AP ve fiber omurga — güç ve veri tek omurgada, VLAN ile segmentasyon.",
  },
  {
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=75&auto=format&fit=crop",
    tag: "Akıllı Bina",
    title: "Alarm, geçiş kontrol ve otomasyon tek platformda",
    sub: "Yangın/hırsız algılama, interkom ve erişim yönetimini merkezi panelden yönetin.",
  },
]

export function HeroCarousel() {
  return (
    <section className="font-nx-sans">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="h-[560px] w-full md:h-[640px]"
      >
        {SLIDES.map((s) => (
          <SwiperSlide key={s.tag}>
            <div className="relative h-full w-full">
              <img
                src={s.img}
                alt={s.tag}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* dark overlay — text kontrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />

              {/* content */}
              <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 text-white">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#0040a4] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" /> {s.tag}
                  </span>
                  <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
                    {s.title}
                  </h1>
                  <p className="mt-5 max-w-md text-base leading-7 text-slate-200">{s.sub}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link
                      href="/teklif-iste"
                      className="inline-flex items-center gap-2 rounded-full bg-[#0040a4] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#0055cc]"
                    >
                      TEKLİF AL <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="tel:+905529895959"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      <Phone className="h-4 w-4" /> +90 552 989 59 59
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
