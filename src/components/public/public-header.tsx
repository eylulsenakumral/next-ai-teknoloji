"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Cpu,
  Menu,
  X,
  Phone,
  LogIn,
  LogOut,
  Search,
  User,
  Heart,
  ShoppingCart,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NavigationBar } from "./navigation-bar"
import { ExchangeRateDisplay } from "./exchange-rate-bar"
import { signOut } from "next-auth/react"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"

/* ------------------------------------------------------------------ */
/*  Mobile Drawer                                                       */
/* ------------------------------------------------------------------ */

function MobileDrawer({
  open,
  onClose,
  isAuthenticated,
  userName,
}: {
  open: boolean
  onClose: () => void
  isAuthenticated: boolean
  userName?: string | null
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
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer panel */}
      <div className="fixed inset-y-0 left-0 z-50 w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col animate-[slideInLeft_0.3s_ease-out]">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9e9e9] bg-[#0040a4]">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Next AI Teknoloji" width={32} height={32} className="rounded-lg" />
            <div>
              <p className="font-bold text-[14px] text-white">Next AI Teknoloji</p>
              <p className="text-[10px] text-white/60">Teknoloji Market</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-3 py-4" aria-label="Mobil navigasyon">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#0040a4] transition-colors rounded-lg"
            >
              Ana Sayfa
            </Link>
            <Link
              href="/katalog"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#0040a4] transition-colors rounded-lg"
            >
              <Package className="h-4 w-4 text-[#0040a4]" aria-hidden />
              Tüm Ürünler
            </Link>
            <Link
              href="/katalog"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#0040a4] transition-colors rounded-lg"
            >
              Markalar
            </Link>
            <Link
              href="/blog"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#0040a4] transition-colors rounded-lg"
            >
              Blog
            </Link>
            <Link
              href="/basvuru"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#0040a4] transition-colors rounded-lg"
            >
              İletişim
            </Link>
          </nav>

          <div className="border-t border-[#e9e9e9] mx-4" />

          <div className="px-3 py-3">
            <p className="px-4 text-[11px] font-semibold text-[#767676] uppercase tracking-widest mb-1">
              Hesap
            </p>
            <nav aria-label="Mobil hesap navigasyonu">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/hesabim"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#0040a4] transition-colors rounded-lg"
                  >
                    <User className="h-4 w-4 text-[#0040a4]" aria-hidden />
                    {userName || "Hesabım"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-red-500 hover:bg-red-50 transition-colors rounded-lg w-full"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#0040a4] transition-colors rounded-lg"
                  >
                    <User className="h-4 w-4 text-[#0040a4]" aria-hidden />
                    Giriş Yap
                  </Link>
                  <Link
                    href="/basvuru"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#0040a4] transition-colors rounded-lg"
                  >
                    <LogIn className="h-4 w-4 text-[#0040a4]" aria-hidden />
                    Hesap Oluştur
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface SearchProduct {
  id: string
  name: string
  slug: string
  images: string[]
  brand: { name: string; slug: string } | null
  price: number | null
  currency: string
}

interface SearchResponse {
  data: SearchProduct[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/* ------------------------------------------------------------------ */
/*  Search Bar                                                          */
/* ------------------------------------------------------------------ */

function HeaderSearchBar() {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [results, setResults] = useState<SearchProduct[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced search
  useEffect(() => {
    const query = value.trim()

    // Clear previous timeout
    const timeoutId = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      setIsLoading(true)
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(
          `/api/public/catalog/products?search=${encodeURIComponent(query)}&limit=8`,
          { signal: abortControllerRef.current.signal }
        )

        if (response.ok) {
          const data: SearchResponse = await response.json()
          setResults(data.data)
          setIsOpen(data.data.length > 0)
        } else {
          setResults([])
          setIsOpen(false)
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error)
        }
        setResults([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [value])

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Escape key handler
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      setIsOpen(false)
      router.push(`/katalog?search=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleResultClick(product: SearchProduct) {
    setIsOpen(false)
    setValue(product.name)
    router.push(`/katalog/${product.slug}`)
  }

  function getProductImage(product: SearchProduct): string {
    if (product.images && product.images.length > 0) {
      return product.images[0]
    }
    return '/images/placeholder-product.png'
  }

  return (
    <div className="flex-1 max-w-2xl mx-8 relative" ref={dropdownRef}>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Site genelinde ürün ara"
      >
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => {
              if (value.trim().length >= 2 && results.length > 0) {
                setIsOpen(true)
              }
            }}
            placeholder="Ürün, marka, model ve açıklama giriniz"
            className="w-full h-[46px] pl-5 pr-14 bg-[#f3f3f3] rounded-[20px] border border-transparent text-[14px] text-[#1e1e1e] placeholder:text-[#767676] focus:border-[#0040a4] focus:bg-white outline-none transition-all duration-300"
            aria-label="Arama"
            aria-expanded={isOpen}
            aria-controls="search-results"
            aria-autocomplete="list"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-[38px] w-[38px] flex items-center justify-center bg-gradient-to-r from-[#0040a4] to-[#1a6fe0] text-white rounded-full hover:scale-105 hover:shadow-md transition-all duration-300"
            aria-label="Ara"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id="search-results"
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-[#e9e9e9] max-h-[400px] overflow-y-auto z-50"
          role="listbox"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-[13px] text-[#767676] flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#0040a4] border-t-transparent rounded-full animate-spin" />
              <span>Aranıyor...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <ul className="py-1" role="presentation">
                {results.map((product) => (
                  <li key={product.id} role="option">
                    <button
                      type="button"
                      onClick={() => handleResultClick(product)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#f3f3f3] transition-colors text-left"
                      role="option"
                      aria-selected="false"
                    >
                      {/* Product Image */}
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-white border border-[#e9e9e9] flex items-center justify-center overflow-hidden">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1e1e1e] truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.brand && (
                            <span className="text-[11px] text-[#767676]">
                              {product.brand.name}
                            </span>
                          )}
                          {product.price !== null && (
                            <>
                              <span className="text-[#e9e9e9]">•</span>
                              <span className="text-[11px] text-[#0040a4] font-medium">
                                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: product.currency || "TRY", minimumFractionDigits: 2 }).format(product.price)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* "Tümünü Gör" Link */}
              <div className="border-t border-[#e9e9e9] px-4 py-2">
                <Link
                  href={`/katalog?search=${encodeURIComponent(value.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-[13px] font-semibold text-[#0040a4] hover:text-[#1e1e1e] transition-colors py-1"
                >
                  Tümünü Gör →
                </Link>
              </div>
            </>
          ) : value.trim().length >= 2 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[13px] text-[#767676]">Sonuç bulunamadı</p>
              <p className="text-[11px] text-[#a0a0a0] mt-1">
                Farklı bir arama terimi deneyin
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PublicHeader                                                        */
/* ------------------------------------------------------------------ */

export function PublicHeader() {
  const { user, isAuthenticated, isDealer } = useAuth()
  const { items } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY
      setIsSticky(scrollY > 10)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      {/* TOP BAR - Announcement/Info Bar */}
      <div className="bg-[#0040a4] text-white border-b border-[#1a6fe0]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[36px] text-[12px]">
            <a
              href="tel:+905529895959"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">0 552 989 5959</span>
              <span className="sm:hidden">Ara</span>
            </a>
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-1.5 text-white/80 font-medium whitespace-nowrap">
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Müşteri Temsilciniz: <strong className="text-white">Ahmet ÜSTÜN</strong></span>
                  </div>
                  <span className="text-white/30 hidden sm:inline">|</span>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors font-medium whitespace-nowrap"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Çıkış Yap</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/basvuru"
                    className="text-white/80 hover:text-white transition-colors font-medium whitespace-nowrap"
                  >
                    Bayimiz Olun
                  </Link>
                  <span className="text-white/30 hidden sm:inline">|</span>
                  <Link
                    href="/iletisim"
                    className="text-white/80 hover:text-white transition-colors font-medium hidden sm:inline whitespace-nowrap"
                  >
                    Yardım
                  </Link>
                </>
              )}
              <span className="text-white/30 hidden sm:inline">|</span>
              <ExchangeRateDisplay />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN HEADER - Sticky on scroll with glass morphism */}
      <header
        className={cn(
          "z-50 transition-all duration-300 linear border-b",
          isSticky
            ? "sticky top-0 shadow-md bg-white/80 backdrop-blur-md border-[#e9e9e9]/50"
            : "bg-white border-[#e9e9e9]"
        )}
        role="banner"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 h-[72px]">
            {/* Left: Mobile menu + Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex h-10 w-10 items-center justify-center text-[#1e1e1e] hover:text-[#0040a4] transition-colors"
                aria-label="Menüyü aç"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2 shrink-0"
                aria-label="Next AI Teknoloji ana sayfa"
              >
                <Image src="/logo.png" alt="Next AI Teknoloji" width={192} height={64} className="h-16 w-auto object-contain" />
              </Link>
            </div>

            {/* Center: Search Bar - Desktop */}
            <div className="hidden lg:flex items-center flex-1">
              <HeaderSearchBar />
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-3">
              {/* User Account */}
              {isAuthenticated && user?.companyName ? (
                <Link
                  href="/hesabim"
                  className="hidden lg:flex items-center gap-1.5 text-[#1e1e1e] hover:text-[#0040a4] transition-colors text-sm font-medium nav-underline"
                  aria-label={user.companyName}
                >
                  <User className="h-5 w-5" />
                  <span className="max-w-[240px] truncate">{user.companyName}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden lg:flex items-center gap-1.5 text-[#1e1e1e] hover:text-[#0040a4] transition-colors text-sm font-medium nav-underline"
                  aria-label="Bayi Girişi"
                >
                  <User className="h-5 w-5" />
                  <span>Bayi Girişi</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                href="/katalog"
                className="hidden sm:flex items-center gap-1 text-[#1e1e1e] hover:text-[#0040a4] transition-colors relative nav-underline"
                aria-label="Favorilerim"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Cart with badge */}
              <Link
                href="/sepet"
                className="relative flex items-center gap-1 text-[#1e1e1e] hover:text-[#0040a4] transition-colors"
                aria-label={cartCount > 0 ? `Sepetim, ${cartCount} ürün` : "Sepetim"}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-r from-[#0040a4] to-[#1a6fe0] text-white text-[11px] font-medium rounded-full flex items-center justify-center animate-badge-bounce shadow-sm">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile search icon */}
              <button
                type="button"
                onClick={() => {
                  const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]')
                  if (searchInput) searchInput.focus()
                }}
                className="lg:hidden flex h-10 w-10 items-center justify-center text-[#1e1e1e] hover:text-[#0040a4] transition-colors"
                aria-label="Ürün ara"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
            <HeaderSearchBar />
          </div>
        </div>
      </header>

      {/* Layer 3: Navigation Bar */}
      <NavigationBar />

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        userName={user?.companyName}
      />
    </>
  )
}
