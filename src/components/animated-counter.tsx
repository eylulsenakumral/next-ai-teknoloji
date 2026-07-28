"use client"

import { useEffect, useRef, useState } from "react"

export type AnimatedCounterProps = {
  /** Hedef değer, örn. "340+", "1.800+", "12" */
  value: string
  /** Etiket, örn. "Aktif Bayi" */
  label: string
  /** Animasyon süresi (ms) */
  duration?: number
}

/** "340+" → { num: 340, suffix: "+" } */
function parseValue(value: string) {
  const match = value.match(/^([\d.,]+)(.*)$/)
  if (!match) return { num: 0, suffix: "", hasDot: false }
  const numStr = match[1]
  const suffix = match[2] ?? ""
  const hasDot = numStr.includes(".") || numStr.includes(",")
  const num = Number(numStr.replace(/[.,]/g, ""))
  return { num, suffix, hasDot }
}

export function AnimatedCounter({ value, label, duration = 1400 }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [display, setDisplay] = useState("0")
  const [, setDone] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const { num, hasDot } = parseValue(value)

    const animate = () => {
      const start = performance.now()
      const from = 0
      const to = num

      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // cubic-bezier(0.22, 0.61, 0.36, 1) benzeri easing
        const ease = 1 - Math.pow(1 - progress, 3)
        const current = Math.floor(from + (to - from) * ease)
        setDisplay(hasDot ? current.toLocaleString("tr-TR") : String(current))
        if (progress < 1) {
          requestAnimationFrame(tick)
        } else {
          setDone(true)
        }
      }
      requestAnimationFrame(tick)
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setDisplay(hasDot ? num.toLocaleString("tr-TR") : String(num))
      setDone(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.4 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  return (
    <div ref={ref}>
      <p className="text-3xl font-nx-heading font-extrabold text-nx-dark">
        {display}
        <span className="text-nx-accent">{parseValue(value).suffix}</span>
      </p>
      <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}