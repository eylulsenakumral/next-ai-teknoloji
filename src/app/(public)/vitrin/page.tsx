"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import {
  IcnCamera,
  IcnNetwork,
  IcnAccessControl,
  IcnSmartHome,
} from "@/components/public/icons-next"

// nexadepo Çözümleri — TOONHUB figurin carousel template'ine uyarlandı
const SOLUTIONS = [
  {
    Icon: IcnCamera,
    title: "VİDEO GÜVENLİK",
    desc: "IP kamera, NVR ve AI analitik ile uçtan uca görüntü güvenliği. Davranış analitiği ve plaka tanıma entegrasyonu.",
    tags: ["AI Analitik", "4K / 8MP", "PoE"],
    bg: "#0040a4",
  },
  {
    Icon: IcnNetwork,
    title: "AĞ ALTYAPISI",
    desc: "Yönetilen switch, wireless AP ve fiber omurga ile yüksek performanslı, güvenli bağlantı altyapısı.",
    tags: ["Layer 3", "Wi-Fi 6", "VLAN"],
    bg: "#0e7490",
  },
  {
    Icon: IcnAccessControl,
    title: "GEÇİŞ KONTROL",
    desc: "Kart okuyucu, bariyer, turnike ve biometrik sistemlerle kritik erişim noktalarının yönetimi.",
    tags: ["Biometrik", "IP Entegre", "OSDP"],
    bg: "#b45309",
  },
  {
    Icon: IcnSmartHome,
    title: "AKILLI BİNA",
    desc: "Alarm, interkom, otomasyon ve izleme sistemlerini tek platformdan yönetin.",
    tags: ["IoT", "KNX", "Entegre Panel"],
    bg: "#6d28d9",
  },
] as const

type Role = "center" | "left" | "right" | "back"

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
      setActiveIndex((prev) => (dir === "next" ? (prev + 1) % 4 : (prev + 3) % 4))
      setTimeout(() => setIsAnimating(false), 650)
    },
    [isAnimating]
  )

  const roleOf = (i: number): Role => {
    const c = activeIndex
    if (i === c) return "center"
    if (i === (c + 3) % 4) return "left"
    if (i === (c + 1) % 4) return "right"
    return "back"
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
          transform: `${t} scale(${isMobile ? 1.25 : 1.68})`,
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

        {/* 2. Giant ghost text */}
        <div
          className="pointer-events-none absolute inset-x-0 flex select-none items-center justify-center"
          style={{ zIndex: 2, top: "16%" }}
        >
          <span
            className="font-nx-sans"
            style={{
              fontWeight: 800,
              fontSize: "clamp(70px, 22vw, 300px)",
              color: "white",
              opacity: 0.92,
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
            }}
          >
            NEXADEPO
          </span>
        </div>

        {/* 3. Carousel — çözüm ikonları figurin pozisyonunda */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {SOLUTIONS.map((s, i) => (
            <div key={s.title} style={itemStyle(roleOf(i))}>
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ color: "white", opacity: 0.95 }}
                aria-hidden
              >
                <s.Icon className="h-3/4 w-3/4" />
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
            className="font-nx-sans mb-2 text-base font-extrabold uppercase tracking-widest sm:mb-3 sm:text-2xl"
            style={{ color: "white", opacity: 0.95, letterSpacing: "0.02em" }}
          >
            {active.title}
          </p>
          <p
            className="font-nx-sans mb-4 hidden text-sm sm:mb-5 sm:block"
            style={{ color: "white", opacity: 0.85, lineHeight: 1.6 }}
          >
            {active.desc}
          </p>
          <div className="mb-5 hidden flex-wrap gap-2 sm:flex">
            {active.tags.map((t) => (
              <span
                key={t}
                className="font-nx-mono rounded-full border border-white/25 px-2.5 py-1 text-[10px] uppercase tracking-widest"
                style={{ color: "white", opacity: 0.9 }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Önceki çözüm"
              onClick={() => navigate("prev")}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white transition duration-150 hover:scale-[1.08] hover:bg-white/10 sm:h-16 sm:w-16"
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Sonraki çözüm"
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
