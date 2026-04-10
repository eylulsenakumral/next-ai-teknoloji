"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Cpu,
  Menu,
  X,
  Phone,
  LogIn,
  UserPlus,
  Search,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Mobile Drawer                                                       */
/* ------------------------------------------------------------------ */

function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eeeeee] bg-[#00179e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" aria-hidden />
            </div>
            <div>
              <p className="font-extrabold text-[13px] text-white">Next AI Teknoloji</p>
              <p className="text-[10px] text-white/60">Teknoloji Market</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Menuyu kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menü */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <nav aria-label="Mobil navigasyon">
              <Link
                href="/katalog"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-[#333333] hover:bg-[#f5f5f5] hover:text-[#00179e] transition-colors rounded"
              >
                <Package className="h-4 w-4 text-[#00179e]" aria-hidden />
                Tum Urunler
              </Link>
            </nav>
          </div>

          <div className="border-t border-[#eeeeee] px-4 py-3">
            <p className="text-[10px] font-bold text-[#767676] uppercase tracking-widest mb-2 px-2">
              Hesap
            </p>
            <nav aria-label="Mobil hesap navigasyonu">
              <Link
                href="/basvuru"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-[#333333] hover:bg-[#f5f5f5] hover:text-[#00179e] transition-colors rounded"
              >
                <UserPlus className="h-4 w-4 text-[#00179e]" aria-hidden />
                Hesap Olustur
              </Link>
            </nav>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 py-4 border-t border-[#eeeeee] flex flex-col gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center gap-2 h-10 px-4 bg-[#00179e] text-white text-[13px] font-semibold hover:bg-[#00179e]/90 transition-colors"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Giris Yap
          </Link>
          <Link
            href="/basvuru"
            onClick={onClose}
            className="flex items-center justify-center gap-2 h-10 px-4 border border-[#eeeeee] text-[#333333] text-[13px] font-semibold hover:border-[#00179e] hover:text-[#00179e] transition-colors"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Hesap Olustur
          </Link>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Search Bar                                                          */
/* ------------------------------------------------------------------ */

function HeaderSearchBar() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      router.push(`/katalog?search=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 max-w-xl"
      role="search"
      aria-label="Site genelinde urun ara"
    >
      <div className="flex h-10 border border-[#eeeeee] bg-white overflow-hidden focus-within:border-[#00179e] transition-colors">
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Urun, marka veya kategori ara..."
          className="flex-1 px-4 text-[13px] text-[#333333] placeholder:text-[#aaaaaa] bg-transparent focus:outline-none"
          aria-label="Arama"
        />
        <button
          type="submit"
          className="h-10 w-12 shrink-0 bg-[#00179e] flex items-center justify-center text-white hover:bg-[#00179e]/90 transition-colors"
          aria-label="Ara"
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  PublicHeader                                                        */
/* ------------------------------------------------------------------ */

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY
      setIsSticky(scrollY > 40)
      setIsCompact(scrollY > 80)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      {/* Ust Bar */}
      <div className="bg-[#00179e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8 text-[11px]">
            <a
              href="tel:+905529895959"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <Phone className="h-3 w-3" aria-hidden />
              <span>0 552 989 5959</span>
            </a>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                <LogIn className="h-3 w-3" aria-hidden />
                Giris Yap
              </Link>
              <span className="text-white/30">|</span>
              <Link
                href="/basvuru"
                className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                <UserPlus className="h-3 w-3" aria-hidden />
                Hesap Olustur
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Ana Header */}
      <header
        className={cn(
          "bg-white border-b border-[#eeeeee] z-40 transition-all duration-200",
          isSticky ? "sticky top-0 shadow-md" : "relative"
        )}
        role="banner"
      >
        {/* Logo + Arama + CTA Satiri */}
        <div
          className={cn(
            "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 transition-all duration-200",
            isCompact ? "h-12" : "h-[68px]"
          )}
        >
          {/* Mobil menu butonu */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex h-9 w-9 items-center justify-center text-[#333333] hover:text-[#00179e] hover:bg-[#f5f5f5] transition-colors"
            aria-label="Menuyu ac"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link
            href="/katalog"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="Next AI Teknoloji ana sayfa"
          >
            <div
              className={cn(
                "rounded bg-[#00179e] flex items-center justify-center transition-all duration-200",
                isCompact ? "w-7 h-7" : "w-9 h-9 md:w-10 md:h-10"
              )}
            >
              <Cpu
                className={cn(
                  "text-white transition-all duration-200",
                  isCompact ? "w-4 h-4" : "w-5 h-5"
                )}
                aria-hidden
              />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className={cn(
                  "font-extrabold text-[#333333] tracking-tight transition-all duration-200",
                  isCompact ? "text-[14px]" : "text-[16px] md:text-[17px]"
                )}
              >
                Next AI Teknoloji
              </span>
              {!isCompact && (
                <span className="hidden md:block text-[10px] text-[#767676] font-medium uppercase tracking-widest">
                  Teknoloji Market
                </span>
              )}
            </div>
          </Link>

          {/* Arama Cubugu -- sadece desktop */}
          <div className="hidden md:flex flex-1 justify-center">
            <HeaderSearchBar />
          </div>

          {/* CTA -- desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link
              href="/basvuru"
              className="inline-flex items-center gap-1.5 h-9 px-4 border border-[#eeeeee] text-[12px] font-semibold text-[#333333] hover:border-[#00179e] hover:text-[#00179e] transition-colors whitespace-nowrap"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Hesap Olustur
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#00179e] text-[12px] font-bold text-white uppercase tracking-wider hover:bg-[#001489] transition-colors whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden />
              Giris Yap
            </Link>
          </div>

          {/* Mobil arama ikonu */}
          <Link
            href="/katalog"
            className="md:hidden flex h-9 w-9 items-center justify-center text-[#333333] hover:text-[#00179e] hover:bg-[#f5f5f5] transition-colors ml-auto"
            aria-label="Urun ara"
          >
            <Search className="h-5 w-5" />
          </Link>
        </div>

      </header>

      {/* Mobil Drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  )
}
