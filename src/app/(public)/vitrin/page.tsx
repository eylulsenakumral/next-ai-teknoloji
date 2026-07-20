"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Cctv, Flame, Siren, Database, CarFront, Code, Network } from "lucide-react"

// nexadepo kategorileri — Güvenlik Kamerası başta (vitrin yüzü)
const SOLUTIONS = [
  {
    Icon: Cctv,
    title: "GÜVENLİK KAMERASI",
    ghost: "KAMERA",
    desc: "IP kamera, NVR ve AI analitik ile uçtan uca görüntü güvenliği.",
    tags: ["4K / 8MP", "AI Analitik", "NVR"],
    bg: "#0040a4",
  },
  {
    Icon: Network,
    title: "AĞ VE NETWORK",
    ghost: "NETWORK",
    desc: "Yönetilen switch, wireless AP ve fiber omurga ile güvenli bağlantı altyapısı.",
    tags: ["Switch", "Wi-Fi 6", "Fiber"],
    bg: "#15803d",
  },
  {
    Icon: Database,
    title: "VERİ DEPOLAMA",
    ghost: "DEPOLAMA",
    desc: "NAS, RAID dizili sistemler ve SSD ile güvenli, ölçeklenebilir veri saklama.",
    tags: ["NAS", "RAID", "SSD"],
    bg: "#0e7490",
  },
  {
    Icon: CarFront,
    title: "ARAÇ KAMERA SİSTEMLERİ",
    ghost: "ARAÇ",
    desc: "Dashcam ve 360° araç kameraları, GPS takip ve kayıt yönetimi.",
    tags: ["Dashcam", "360°", "GPS"],
    bg: "#1e293b",
  },
  {
    Icon: Code,
    title: "YAZILIMLAR",
    ghost: "YAZILIM",
    desc: "VMS, erişim kontrol yazılımı ve üçüncü parti sistem entegrasyonları.",
    tags: ["VMS", "Entegrasyon", "API"],
    bg: "#6d28d9",
  },
  {
    Icon: Siren,
    title: "HIRSIZ ALARM",
    ghost: "ALARM",
    desc: "Manyetik kontak, PIR sensör ve siren ile 7/24 hırsızlık tespiti ve anlık bildirim.",
    tags: ["Sensör", "Siren", "İzleme"],
    bg: "#be123c",
  },
  {
    Icon: Flame,
    title: "YANGIN ALARM",
    ghost: "YANGIN",
    desc: "Duman ve ısı dedektörleri, adresli yangın paneli ve sprinkler entegrasyonu.",
    tags: ["Duman", "Isı", "Sprinkler"],
    bg: "#ea580c",
  },
] as const

const N = SOLUTIONS.length

type Role = "center" | "left" | "right" | "back" | "hidden"

const EASE = "cubic-bezier(0.4,0,0.2,1)"

// fractalNoise grain — opacity 0.08 inside SVG, container opacity 0.4
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`

export default function VitrinPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const navigate = useCallback(
    (dir: "next" | "prev") => {
      if (isAnimating) return
      setIsAnimating(true)
      setActiveIndex((prev) => (dir === "next" ? (prev + 1) % N : (prev + N - 1) % N))
      setTimeout(() => setIsAnimating(false), 650)
    },
    [isAnimating]
  )

  // Auto-play — 4 sn'de bir sonraki kategori
  useEffect(() => {
    const id = setInterval(() => navigate("next"), 4000)
    return () => clearInterval(id)
  }, [navigate])

  const roleOf = (i: number): Role => {
    const c = activeIndex
    if (i === c) return "center"
    if (i === (c + N - 1) % N) return "left"
    if (i === (c + 1) % N) return "right"
    if (i === (c + 2) % N) return "back"
    return "hidden"
  }

  const itemStyle = (role: Role): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      aspectRatio: "0.6 / 1",
      transition: `transform 650ms ${EASE}, filter 650ms ${EASE}, opacity 650ms ${EASE}, left 650ms ${EASE}`,
      willChange: "transform, filter, opacity",
    }
    const t = "translateX(-50%)"
    switch (role) {
      case "center":
        return {
          ...base,
          transform: `${t} scale(${isMobile ? 0.95 : 1.1})`,
          filter: "none",
          opacity: 1,
          zIndex: 20,
          left: "50%",
          height: isMobile ? "60%" : "92%",
          bottom: isMobile ? "22%" : 0,
        }
      case "left":
        return {
          ...base,
          transform: `${t} scale(1)`,
          filter: "blur(2px)",
          opacity: 0.85,
          zIndex: 10,
          left: isMobile ? "20%" : "30%",
          height: isMobile ? "16%" : "28%",
          bottom: isMobile ? "32%" : "12%",
        }
      case "right":
        return {
          ...base,
          transform: `${t} scale(1)`,
          filter: "blur(2px)",
          opacity: 0.85,
          zIndex: 10,
          left: isMobile ? "80%" : "70%",
          height: isMobile ? "16%" : "28%",
          bottom: isMobile ? "32%" : "12%",
        }
      case "back":
        return {
          ...base,
          transform: `${t} scale(1)`,
          filter: "blur(4px)",
          opacity: 1,
          zIndex: 5,
          left: "50%",
          height: isMobile ? "13%" : "22%",
          bottom: isMobile ? "32%" : "12%",
        }
      case "hidden":
        return {
          ...base,
          transform: `${t} scale(1)`,
          opacity: 0,
          zIndex: 0,
          left: "50%",
          height: "20%",
          bottom: "30%",
          pointerEvents: "none",
        }
    }
  }

  const active = SOLUTIONS[activeIndex]

  return (
    <div
      style={{
        backgroundColor: active.bg,
        transition: `background-color 650ms ${EASE}`,
      }}
      className="font-nx-sans relative w-full overflow-hidden"
    >
      <div className="relative w-full" style={{ height: "100vh", overflow: "hidden" }}>
        {/* 1. Grain overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 50,
            backgroundImage: GRAIN,
            backgroundSize: "200px 200px",
            backgroundRepeat: "repeat",
            opacity: 0.4,
          }}
        />

        {/* 2. Giant ghost text — aktif kategori (dinamik) */}
        <div
          className="pointer-events-none absolute inset-x-0 flex select-none items-center justify-center"
          style={{ zIndex: 2, top: "20%" }}
        >
          <span
            className="font-nx-sans"
            style={{
              fontWeight: 800,
              fontSize: "clamp(48px, 15vw, 210px)",
              color: "white",
              opacity: 0.92,
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
            }}
          >
            {active.ghost}
          </span>
        </div>

        {/* 3. Carousel — kategori ikonları */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {SOLUTIONS.map((s, i) => (
            <div key={s.title} style={itemStyle(roleOf(i))}>
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ color: "white", opacity: 0.95 }}
                aria-hidden
              >
                <s.Icon className="h-2/5 w-2/5" strokeWidth={1.5} />
              </div>
            </div>
          ))}
        </div>

        {/* 4. Bottom-left text + nav buttons */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24"
          style={{ zIndex: 60, maxWidth: 360 }}
        >
          <p
            className="font-nx-sans mb-2 text-xs font-extrabold uppercase tracking-widest sm:mb-3 sm:text-sm"
            style={{ color: "white", opacity: 0.95, letterSpacing: "0.02em" }}
          >
            {active.title}
          </p>
          <p
            className="font-nx-sans mb-4 hidden text-xs sm:mb-5 sm:block sm:text-sm"
            style={{ color: "white", opacity: 0.85, lineHeight: 1.6 }}
          >
            {active.desc}
          </p>
          <div className="mb-5 hidden flex-wrap gap-2 sm:flex">
            {active.tags.map((tg) => (
              <span
                key={tg}
                className="font-nx-mono rounded-full border border-white/25 px-2.5 py-1 text-[10px] uppercase tracking-widest"
                style={{ color: "white", opacity: 0.9 }}
              >
                {tg}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Önceki kategori"
              onClick={() => navigate("prev")}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white transition duration-150 hover:scale-[1.08] hover:bg-white/10 sm:h-16 sm:w-16"
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Sonraki kategori"
              onClick={() => navigate("next")}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white transition duration-150 hover:scale-[1.08] hover:bg-white/10 sm:h-16 sm:w-16"
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* 5. Bottom-right CTA */}
        <Link
          href="/cozumler"
          className="absolute bottom-6 right-4 flex items-center gap-3 transition-opacity duration-200 hover:opacity-100 sm:bottom-20 sm:right-10"
          style={{ zIndex: 60, opacity: 0.95, color: "white", textDecoration: "none" }}
        >
          <span
            className="font-nx-sans font-extrabold uppercase"
            style={{ fontSize: "clamp(20px, 4vw, 44px)", letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            ÇÖZÜMÜ İNCELE
          </span>
          <ArrowRight className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.25} />
        </Link>
      </div>
    </div>
  )
}
