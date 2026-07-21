"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Public Header — Ceron tasarım dili
 *
 * Açık zemin (#F5F5F5), lacivert metin (#0F172A), cyan aksan (#06B6D4).
 * Butonlar pill (radius 50px): cyan → hover'da lacivert (Ceron button spec).
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
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setMobileOpen(false)
    router.push(`/katalog?search=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1852ac]/95 px-5 py-4 backdrop-blur-xl md:px-10 font-nx-sans text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
        {/* Logo — koyu zeminde beyaz versiyon */}
        <Link href="/" className="shrink-0" aria-label="nexadepo anasayfa">
          <Image
            src="/images/logo-dark.png"
            alt="nexadepo"
            width={2172}
            height={724}
            priority
            className="h-10 w-auto md:h-12"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
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
                    ? "rounded-full border border-white/30 px-4 py-1.5 text-white hover:border-nx-accent hover:text-nx-accent"
                    : isActive
                      ? "text-nx-accent"
                      : "text-white/75 hover:text-nx-accent"
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Arama — B2B: SKU/model/marka */}
        <form
          onSubmit={onSearch}
          role="search"
          className="hidden min-w-0 flex-1 max-w-[220px] items-center xl:flex"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün, model, marka ara…"
              aria-label="Ürün ara"
              className="h-9 w-full rounded-full border border-white/20 bg-white/10 pl-9 pr-3 text-xs text-white placeholder:text-white/50 outline-none transition focus:border-nx-accent focus:bg-white/15"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/bayimiz-olun"
            className="hidden text-[13px] font-semibold text-nx-dark transition hover:text-nx-accent lg:block"
          >
            Bayimiz Olun
          </Link>
          {/* Ceron: lacivert pill — ikincil CTA */}
          <Link
            href="/bayi-giris"
            className="hidden rounded-full bg-nx-dark px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-nx-accent sm:block"
          >
            Bayi Girişi
          </Link>
          {/* Ceron: accent pill — birincil CTA */}
          <Link
            href="/teklif-iste"
            className="rounded-full bg-nx-accent px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-nx-dark md:px-5"
          >
            Teklif İste
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 text-nx-dark"
            aria-label="Menü"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer (inline) */}
      {mobileOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden mt-4 pb-2 space-y-1">
          {/* Mobil arama */}
          <form onSubmit={onSearch} role="search" className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün, model, marka ara…"
              aria-label="Ürün ara"
              className="h-10 w-full rounded-full border border-white/20 bg-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-nx-accent"
            />
          </form>
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
                    ? "bg-nx-accent/10 text-nx-accent"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {label}
              </Link>
            )
          })}
          <div className="pt-2 mt-2 border-t border-slate-200 flex gap-2">
            <Link
              href="/bayi-giris"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center rounded-full bg-nx-dark px-3 py-2 text-xs font-bold uppercase tracking-wide text-white"
            >
              Bayi Girişi
            </Link>
            <Link
              href="/bayimiz-olun"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center rounded-full border border-nx-dark/20 px-3 py-2 text-xs font-bold text-nx-dark"
            >
              Bayimiz Olun
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
