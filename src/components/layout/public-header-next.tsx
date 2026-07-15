"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Public Header — Yeni Figma tasarımı (Next.js'e uyarlandı)
 *
 * Sticky, dark variant ana sayfada, light variant diğer sayfalarda.
 * Mobilde hamburger menü.
 */

const NAV: ReadonlyArray<readonly [label: string, to: string]> = [
  ["Ürünler", "/katalog"],
  ["Çözümler", "/cozumler"],
  ["Markalar", "/markalar"],
  ["Projenizi Tasarlayalım", "/proje-tasarim"],
  ["Bayi Programı", "/bayi-programi"],
]

export function PublicHeaderNext() {
  const pathname = usePathname()
  const home = pathname === "/"
  const [mobileOpen, setMobileOpen] = useState(false)

  const headerClass = cn(
    "sticky top-0 z-40 border-b px-5 py-4 backdrop-blur-xl md:px-10 font-nx-sans",
    home
      ? "border-white/10 bg-[#1e3a5f]/90 text-white"
      : "border-slate-200 bg-white/95 text-[#1e3a5f]"
  )

  return (
    <header className={headerClass}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
        {/* Logo */}
        <Link href="/" className="shrink-0 text-xl font-extrabold tracking-[-.09em]">
          NEXT<span className="text-[#5086a8]">AI</span>
          <small className="ml-2 hidden align-middle font-nx-mono text-[9px] font-normal tracking-[.14em] text-slate-400 sm:inline">
            / NEXTADEPO
          </small>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 lg:flex">
          {NAV.map(([label, to]) => {
            const isActive = pathname === to || (to !== "/" && pathname.startsWith(to))
            const isCta = to === "/proje-tasarim"
            return (
              <Link
                key={to}
                href={to}
                className={cn(
                  "text-[13px] font-semibold transition",
                  isCta
                    ? "rounded-lg border border-[#5086a8]/40 bg-[#5086a8]/10 px-3 py-1.5 text-[#5086a8] hover:bg-[#5086a8]/20 opacity-100"
                    : isActive
                      ? "text-[#6b96b3]"
                      : "text-current opacity-75 hover:text-[#5086a8] hover:opacity-100"
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/bayimiz-olun"
            className="hidden text-xs font-bold opacity-70 transition hover:text-[#5086a8] hover:opacity-100 xl:block"
          >
            Bayimiz Olun
          </Link>
          <Link
            href="/bayi-giris"
            className="hidden rounded-lg bg-[#5086a8] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#456680] sm:block"
          >
            Bayi Girişi
          </Link>
          <Link
            href="/teklif-iste"
            className="rounded-lg bg-[#ff9b43] px-3 py-2 text-xs font-bold leading-5 text-[#1e3a5f] transition hover:bg-[#ffad64] md:px-4"
          >
            Teklif İste
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden p-2"
            aria-label="Menü"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer (inline) */}
      {mobileOpen && (
        <div className="lg:hidden mt-4 pb-2 space-y-1">
          {NAV.map(([label, to]) => {
            const isActive = pathname === to || (to !== "/" && pathname.startsWith(to))
            return (
              <Link
                key={to}
                href={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-semibold",
                  isActive
                    ? "bg-[#5086a8]/10 text-[#5086a8]"
                    : home
                      ? "text-white/80 hover:bg-white/5"
                      : "text-[#1e3a5f]/80 hover:bg-slate-100"
                )}
              >
                {label}
              </Link>
            )
          })}
          <div className="pt-2 mt-2 border-t border-current/10 flex gap-2">
            <Link
              href="/bayi-giris"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center rounded-lg bg-[#5086a8] px-3 py-2 text-xs font-bold text-white"
            >
              Bayi Girişi
            </Link>
            <Link
              href="/bayimiz-olun"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center rounded-lg border border-current/20 px-3 py-2 text-xs font-bold"
            >
              Bayimiz Olun
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
