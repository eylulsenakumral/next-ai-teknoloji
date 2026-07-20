"use client"

import { useState } from "react"
import { Cctv, Flame, Siren, Network, Code, CarFront, X } from "lucide-react"

// Mekana yerleşen cihazlar — izometrik oda üzerinde gerçek konumlarda
const DEVICES = [
  {
    id: "kamera",
    Icon: Cctv,
    title: "GÜVENLİK KAMERASI",
    desc: "IP kamera + AI analitik. 4K kayıt, gece görüş, plaka ve yüz tanıma. Köşe görüş açısı ile alan tam kapsama.",
    color: "#0040a4",
    x: 64,
    y: 17,
  },
  {
    id: "yangin",
    Icon: Flame,
    title: "YANGIN ALGILAMA",
    desc: "Duman ve ısı dedektörü + adresli yangın paneli. Erken tespit, sprinkler ve gaz söndürme entegrasyonu.",
    color: "#ea580c",
    x: 50,
    y: 14,
  },
  {
    id: "hirsiz",
    Icon: Siren,
    title: "HIRSIZ ALGILAMA",
    desc: "PIR hareket + manyetik kontak sensörler. İzinsiz giriş tespiti, siren ve anlık push bildirim.",
    color: "#be123c",
    x: 32,
    y: 28,
  },
  {
    id: "switch",
    Icon: Network,
    title: "SWITCH / NETWORK",
    desc: "PoE switch + fiber omurga. Tüm cihazlara güç ve veri tek kablodan, VLAN ile güvenli segmentasyon.",
    color: "#15803d",
    x: 24,
    y: 37,
  },
  {
    id: "yazilim",
    Icon: Code,
    title: "YAZILIM / VMS",
    desc: "Video yönetim + erişim kontrol platformu. Tek panelden tüm sistem canlı izleme, kayıt ve raporlama.",
    color: "#6d28d9",
    x: 50,
    y: 55,
  },
  {
    id: "arac",
    Icon: CarFront,
    title: "ARAÇ KAMERASI",
    desc: "Dashcam + 360° araç kameraları. Sürekli kayıt, GPS takip ve uzaktan canlı izleme.",
    color: "#0f766e",
    x: 50,
    y: 28,
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

      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-20">
        <div className="relative w-full">
          {/* İzometrik oda */}
          <svg viewBox="0 0 1000 700" className="w-full h-auto" role="img" aria-label="İzometrik güvenlik odası şeması">
            {/* zemin */}
            <polygon points="180,500 820,500 700,320 300,320" fill="#1e293b" />
            {/* sol duvar */}
            <polygon points="180,500 300,320 300,90 180,270" fill="#243447" />
            {/* arka duvar */}
            <polygon points="300,320 700,320 700,90 300,90" fill="#2d4055" />
            {/* tavan çizgileri (izometrik grid hissi) */}
            <line x1="300" y1="90" x2="180" y2="270" stroke="#3b82f6" strokeOpacity="0.15" strokeWidth="1" />
            <line x1="700" y1="90" x2="820" y2="270" stroke="#3b82f6" strokeOpacity="0.15" strokeWidth="1" />
            {/* pencere (arka duvarda) */}
            <polygon points="430,150 570,150 570,250 430,250" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
            <line x1="500" y1="150" x2="500" y2="250" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="430" y1="200" x2="570" y2="200" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />
            {/* pencereden ışık */}
            <polygon points="430,250 570,250 540,290 460,290" fill="#3b82f6" opacity="0.08" />
            {/* kapı (sol duvarda) */}
            <polygon points="220,290 255,272 255,425 220,443" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="248" cy="355" r="3" fill="#475569" />
            {/* network rack (sol duvarda) */}
            <polygon points="250,250 275,237 275,330 250,343" fill="#0f172a" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="252" y1="260" x2="273" y2="248" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="252" y1="280" x2="273" y2="268" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="252" y1="300" x2="273" y2="288" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="252" y1="320" x2="273" y2="308" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
            {/* masa (zeminde izometrik) */}
            <polygon points="440,440 560,440 540,415 460,415" fill="#334155" />
            <polygon points="440,440 460,415 460,470 440,495" fill="#1e293b" />
            <polygon points="560,440 540,415 540,470 560,495" fill="#1e293b" />
            {/* monitor (masada) */}
            <rect x="475" y="378" width="50" height="30" rx="2" fill="#0a0f1a" stroke="#6d28d9" strokeWidth="1.5" />
            <rect x="495" y="408" width="10" height="8" fill="#334155" />
            <rect x="485" y="415" width="30" height="3" rx="1" fill="#334155" />
          </svg>

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
                <span className="relative flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
                  {/* pulse ring */}
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ backgroundColor: d.color }}
                  />
                  {/* pin */}
                  <span
                    className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform duration-200 sm:h-12 sm:w-12 ${
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
