"use client"

import { useEffect, useRef, useState } from "react"

type RevealProps = {
  children: React.ReactNode
  /** ms cinsinden gecikme — kademeli girişler için */
  delay?: number
  className?: string
}

/**
 * Ceron'daki Elementor fadeInUp karşılığı: görünür alana girince
 * bir kez yumuşak şekilde belirir. prefers-reduced-motion'da pasif.
 */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`nx-reveal${shown ? " nx-reveal--in" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  )
}
