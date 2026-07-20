"use client"

import { useState } from "react"
import { Cctv, Flame, Siren, Network, Code, CarFront, X } from "lucide-react"

// Mekana yerleşen cihazlar — gerçek oda fotoğrafı üzerinde gerçek konumlarda
const DEVICES = [
  {
    id: "kamera",
    Icon: Cctv,
    title: "GÜVENLİK KAMERASI",
    desc: "IP kamera + AI analitik. 4K kayıt, gece görüş, plaka ve yüz tanıma. Köşe görüş açısı ile alan tam kapsama.",
    color: "#0040a4",
    x: 88,
    y: 10,
  },
  {
    id: "yangin",
    Icon: Flame,
    title: "YANGIN ALGILAMA",
    desc: "Duman ve ısı dedektörü + adresli yangın paneli. Erken tespit, sprinkler ve gaz söndürme entegrasyonu.",
    color: "#ea580c",
    x: 50,
    y: 7,
  },
  {
    id: "hirsiz",
    Icon: Siren,
    title: "HIRSIZ ALGILAMA",
    desc: "PIR hareket + manyetik kontak sensörler. İzinsiz giriş tespiti, siren ve anlık push bildirim.",
    color: "#be123c",
    x: 12,
    y: 22,
  },
  {
    id: "switch",
    Icon: Network,
    title: "SWITCH / NETWORK",
    desc: "PoE switch + fiber omurga. Tüm cihazlara güç ve veri tek kablodan, VLAN ile güvenli segmentasyon.",
    color: "#15803d",
    x: 93,
    y: 48,
  },
  {
    id: "yazilim",
    Icon: Code,
    title: "YAZILIM / VMS",
    desc: "Video yönetim + erişim kontrol platformu. Tek panelden tüm sistem canlı izleme, kayıt ve raporlama.",
    color: "#6d28d9",
    x: 45,
    y: 62,
  },
  {
    id: "arac",
    Icon: CarFront,
    title: "ARAÇ KAMERASI",
    desc: "Dashcam + 360° araç kameraları. Sürekli kayıt, GPS takip ve uzaktan canlı izleme.",
    color: "#0f766e",
    x: 74,
    y: 30,
  },
] as const

export default function VitrinPage() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_#0a1e3a_0%,_#050912_70%)] font-nx-sans text-white">
      <header className="relative z-10 px-4 pt-16 pb-6 text-center sm:pt-20">
        <p className="font-nx-mono text-[10px] uppercase tracking-[0.3em] text-sky-400/80">
          Sistem Mimarisi
        </p>
        <h1 className="mt-3 text-2xl font-extrabold uppercase tracking-tight sm:text-4xl">
          Akıllı Güvenlik Mekanı
        </h1>
        <p className="mx-auto mt-3 max-w-md text-xs text-slate-400 sm:text-sm">
          Cihazların üzerine gelin — her nokta gerçek bir kurulum konumunu temsil eder.
        </p>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-20">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          {/* gerçek oda fotoğrafı */}
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop"
            alt="Ofis iç mekan — güvenlik sistemi kurulum şeması"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          {/* kontrast overlay — hotspot'lar okunaklı */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/50" />

          {/* Cihaz hotspot'ları */}
          {DEVICES.map((d) => {
            const isActive = active === d.id
            return (
              <button
                key={d.id}
                type="button"
                onMouseEnter={() => setActive(d.id)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(isActive ? null : d.id)}
                onFocus={() => setActive(d.id)}
                onBlur={() => setActive(null)}
                className="group absolute z-20 outline-none"
                style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%, -50%)" }}
                aria-label={d.title}
              >
                <span className="relative flex h-9 w-9 items-center justify-center sm:h-12 sm:w-12">
                  {/* pulse ring */}
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ backgroundColor: d.color }}
                  />
                  {/* pin */}
                  <span
                    className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform duration-200 sm:h-12 sm:w-12 ${
                      isActive ? "scale-110" : "group-hover:scale-105"
                    }`}
                    style={{ backgroundColor: d.color }}
                  >
                    <d.Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" strokeWidth={2} />
                  </span>
                </span>

                {/* tooltip */}
                {isActive && (
                  <div
                    className="absolute bottom-full left-1/2 z-30 mb-3 w-60 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/95 p-3.5 text-left shadow-2xl backdrop-blur-md"
                    style={{ minWidth: "15rem" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="font-nx-mono text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: d.color }}
                      >
                        {d.title}
                      </p>
                      <X className="h-3.5 w-3.5 shrink-0 text-slate-500 sm:hidden" />
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{d.desc}</p>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* kategori lejantı */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {DEVICES.map((d) => (
            <button
              key={`leg-${d.id}`}
              type="button"
              onMouseEnter={() => setActive(d.id)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(active === d.id ? null : d.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                active === d.id
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              {d.title}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
