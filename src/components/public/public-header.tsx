"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Cpu,
  Menu,
  X,
  Phone,
  LogIn,
  Search,
  User,
  Heart,
  ShoppingCart,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NavigationBar } from "./navigation-bar"

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
      <div className="fixed inset-y-0 left-0 z-50 w-[400px] max-w-[85vw] bg-white shadow-2xl flex flex-col">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eeeeee] bg-[#2189ff]">
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
                className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-[#1e1e1e] hover:bg-[#f5f5f5] hover:text-[#2189ff] transition-colors rounded"
              >
                <Package className="h-4 w-4 text-[#2189ff]" aria-hidden />
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
                className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-[#1e1e1e] hover:bg-[#f5f5f5] hover:text-[#2189ff] transition-colors rounded"
              >
                <User className="h-4 w-4 text-[#2189ff]" aria-hidden />
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
            className="flex items-center justify-center gap-2 h-10 px-4 bg-[#2189ff] text-white text-[13px] font-semibold hover:bg-[#1e1e1e] transition-colors"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Giris Yap
          </Link>
          <Link
            href="/basvuru"
            onClick={onClose}
            className="flex items-center justify-center gap-2 h-10 px-4 border border-[#eeeeee] text-[#1e1e1e] text-[13px] font-semibold hover:border-[#2189ff] hover:text-[#2189ff] transition-colors"
          >
            <User className="h-4 w-4" aria-hidden />
            Hesap Olustur
          </Link>
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
        aria-label="Site genelinde urun ara"
      >
        <div className="flex h-10 bg-[#f3f3f3] rounded-[20px] border border-[#e9e9e9] overflow-hidden focus-within:ring-2 focus-within:ring-[#2189ff] transition-all">
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
            placeholder="Aramak İstediğiniz Ürün, Marka, Model veya Kelimeyi Yazınız"
            className="flex-1 py-[12px] px-[20px] text-[13px] text-[#1e1e1e] placeholder:text-[#767676] bg-transparent focus:outline-none"
            aria-label="Arama"
            aria-expanded={isOpen}
            aria-controls="search-results"
            aria-autocomplete="list"
          />
          <button
            type="submit"
            className="h-10 w-12 shrink-0 flex items-center justify-center text-[#767676] hover:text-[#2189ff] transition-colors"
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
              <div className="w-4 h-4 border-2 border-[#2189ff] border-t-transparent rounded-full animate-spin" />
              <span>Aranıyor...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <ul className="py-1" role="presentation">
                {results.map((product, index) => (
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
                              <span className="text-[11px] text-[#2189ff] font-medium">
                                {product.price.toLocaleString('tr-TR')} ₺
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
                  className="block text-center text-[13px] font-semibold text-[#2189ff] hover:text-[#1e1e1e] transition-colors py-1"
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [cartCount] = useState(0) // TODO: Connect to actual cart state

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
      <div className="bg-[#1e1e1e] text-white">
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-9 text-[12px]">
            <a
              href="tel:+905529895959"
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">0 552 989 5959</span>
              <span className="sm:hidden">0552 989 5959</span>
            </a>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/basvuru"
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                Bayimiz Olun
              </Link>
              <span className="text-white/30 hidden sm:inline">|</span>
              <Link
                href="/basvuru"
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                Yardım
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN HEADER - Sticky on scroll */}
      <header
        className={cn(
          "bg-white z-50 transition-all duration-300",
          isSticky ? "sticky top-0 shadow-md" : ""
        )}
        role="banner"
      >
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex h-10 w-10 items-center justify-center text-[#1e1e1e] hover:text-[#2189ff] hover:bg-[#f3f3f3] rounded-full transition-colors"
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
                <div className="w-10 h-10 rounded bg-[#2189ff] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div className="hidden sm:flex flex-col leading-none">
                  <span className="font-extrabold text-[16px] text-[#1e1e1e] tracking-tight">
                    Next AI Teknoloji
                  </span>
                  <span className="text-[10px] text-[#767676] font-medium uppercase tracking-widest">
                    Teknoloji Market
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Search Bar - Desktop */}
            <div className="hidden lg:block flex-1">
              <HeaderSearchBar />
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* User Account */}
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 h-10 px-4 text-[#1e1e1e] hover:text-[#2189ff] hover:bg-[#f3f3f3] rounded-full transition-colors font-semibold text-[13px]"
                aria-label="Bayi Girişi"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Bayi Girişi
              </Link>

              {/* Wishlist */}
              <Link
                href="/katalog"
                className="hidden sm:flex h-10 w-10 items-center justify-center text-[#1e1e1e] hover:text-[#2189ff] hover:bg-[#f3f3f3] rounded-full transition-colors"
                aria-label="Favorilerim"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Cart with badge */}
              <Link
                href="/katalog"
                className="flex h-10 w-10 items-center justify-center text-[#1e1e1e] hover:text-[#2189ff] hover:bg-[#f3f3f3] rounded-full transition-colors relative"
                aria-label="Sepetim"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#2189ff] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile search icon */}
              <Link
                href="/katalog"
                className="lg:hidden flex h-10 w-10 items-center justify-center text-[#1e1e1e] hover:text-[#2189ff] hover:bg-[#f3f3f3] rounded-full transition-colors"
                aria-label="Urun ara"
              >
                <Search className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar - Show below header on mobile */}
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
      />
    </>
  )
}
