"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Phone, ChevronRight } from "lucide-react"

interface PromoBarProps {
  message?: string
  bgColor?: string
  textColor?: string
  dismissible?: boolean
}

const rotatingMessages = [
  "Yıl sonu indirimi — %30'a kadar fırsatlar!",
  "Ücretsiz kargo — Tüm siparişlerde geçerli",
  "Yeni bayilere özel hoş geldin indirimi",
  "Toplu alımlarda ekstra fiyat avantajı",
]

export function PromoBar({
  message,
  bgColor,
  textColor = "text-white",
  dismissible = true,
}: PromoBarProps) {
  const [show, setShow] = useState(true)
  const [msgIndex, setMsgIndex] = useState(0)
  const [fade, setFade] = useState(true)

  const messages = message ? [message] : rotatingMessages

  const rotateMessage = useCallback(() => {
    setFade(false)
    setTimeout(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length)
      setFade(true)
    }, 300)
  }, [messages.length])

  useEffect(() => {
    if (messages.length <= 1) return
    const interval = setInterval(rotateMessage, 4000)
    return () => clearInterval(interval)
  }, [messages.length, rotateMessage])

  if (!show) return null

  return (
    <div
      className={`${bgColor ?? "bg-[#0040a4]"} ${textColor} relative z-50 transition-all duration-300`}
      role="banner"
      aria-label="Promosyon"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[36px]">
        {/* Left spacer for centering on larger screens */}
        <div className="hidden sm:flex items-center gap-2 flex-1">
          <Phone className="h-3.5 w-3.5 opacity-70" aria-hidden />
          <a
            href="tel:+905529895959"
            className="text-xs font-medium opacity-90 hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            0 552 989 5959
          </a>
        </div>

        {/* Center: rotating promo message */}
        <div className="flex-1 text-center flex items-center justify-center gap-2 overflow-hidden">
          <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          <span
            className={`text-xs sm:text-sm font-medium transition-opacity duration-300 whitespace-nowrap ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            {messages[msgIndex]}
          </span>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-60 rotate-180" aria-hidden />
        </div>

        {/* Right: dismiss */}
        <div className="flex items-center justify-end flex-1">
          {dismissible && (
            <button
              onClick={() => setShow(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Kapat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
