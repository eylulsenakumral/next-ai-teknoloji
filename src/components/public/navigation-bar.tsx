"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ChevronDown, ChevronRight, Menu, Loader2, Package } from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryChild {
  id: string
  name: string
  slug: string
  productCount: number
  children?: CategoryChild[]
}

interface CategoryTree {
  id: string
  name: string
  slug: string
  productCount: number
  children: CategoryChild[]
}

/* ------------------------------------------------------------------ */
/*  Hook: useCategoryTree                                              */
/* ------------------------------------------------------------------ */

function useCategoryTree() {
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchCategories() {
      try {
        const res = await fetch("/api/public/categories")
        if (!res.ok) throw new Error("Kategoriler yüklenemedi")
        const json = await res.json()
        if (!cancelled) {
          setCategories(json.data ?? [])
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchCategories()
    return () => { cancelled = true }
  }, [])

  return { categories, isLoading }
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "ANA SAYFA", href: "/" },
  { label: "ÜRÜNLER", href: "/katalog" },
  { label: "MARKALAR", href: "/markalar" },
  { label: "GARANTİ TAKİP", href: "/garanti-takip" },
]

const DEALER_NAV_LINKS = [
  { label: "ANA SAYFA", href: "/" },
  { label: "ÜRÜNLER", href: "/katalog" },
  { label: "MARKALAR", href: "/markalar" },
  { label: "FIRSAT ÜRÜNLERİ", href: "/kampanyalar" },
  { label: "SİPARİŞLERİM", href: "/siparisler" },
  { label: "CARİ HESAP", href: "/hesabim/cari" },
  { label: "ONLINE ÖDEME", href: "/online-odeme" },
  { label: "GARANTİ TAKİP", href: "/garanti-takip" },
  { label: "HESABIM", href: "/hesabim" },
]

/* ------------------------------------------------------------------ */
/*  CategoryDropdown — Two-panel mega menu (dealer style)              */
/* ------------------------------------------------------------------ */

function CategoryDropdown() {
  const [open, setOpen] = useState(false)
  const [activeParentId, setActiveParentId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { categories, isLoading } = useCategoryTree()

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveParentId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto-select first parent
  useEffect(() => {
    if (open && categories.length > 0 && activeParentId === null) {
      setActiveParentId(categories[0].id)
    }
  }, [open, categories, activeParentId])

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setOpen(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false)
      setActiveParentId(null)
    }, 200)
  }, [])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const activeParent = categories.find((c) => c.id === activeParentId)

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#0040a4] text-white text-[12px] font-bold uppercase tracking-wider hover:bg-[#1a6fe0] transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Menu className="h-4 w-4" aria-hidden />
        Tüm Kategoriler
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 bg-white border border-[#e9e9e9] shadow-xl mt-0 flex"
          style={{ minWidth: "680px" }}
          role="menu"
        >
          {/* Left panel: Parent categories */}
          <div className="w-56 border-r border-[#e9e9e9] py-2 shrink-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#767676]" />
              </div>
            ) : categories.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-[#767676]">
                Kategori bulunamadı
              </p>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setActiveParentId(cat.id)}
                  onClick={() => {
                    setOpen(false)
                    setActiveParentId(null)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors text-left",
                    activeParentId === cat.id
                      ? "bg-[#f0f4ff] text-[#0040a4] font-semibold"
                      : "text-[#1e1e1e] hover:bg-[#f3f3f3]"
                  )}
                  role="menuitem"
                >
                  <Link
                    href={`/katalog?categorySlug=${encodeURIComponent(cat.slug)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1"
                  >
                    {cat.name}
                    {cat.productCount > 0 && (
                      <span className="ml-1 text-[11px] font-normal text-[#767676]">
                        ({cat.productCount})
                      </span>
                    )}
                  </Link>
                  {cat.children && cat.children.length > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#999999]" aria-hidden />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Right panel: Sub-categories */}
          <div className="flex-1 p-5 min-h-[280px]">
            {activeParent && activeParent.children.length > 0 ? (
              <>
                <Link
                  href={`/katalog?categorySlug=${encodeURIComponent(activeParent.slug)}`}
                  onClick={() => {
                    setOpen(false)
                    setActiveParentId(null)
                  }}
                  className="inline-block text-[15px] font-bold text-[#0040a4] mb-4 hover:underline"
                >
                  {activeParent.name}
                  {activeParent.productCount > 0 && (
                    <span className="ml-1.5 text-[11px] font-normal text-[#767676]">
                      ({activeParent.productCount})
                    </span>
                  )}
                </Link>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  {activeParent.children.map((sub) => (
                    <div key={sub.id}>
                      <Link
                        href={`/katalog?categorySlug=${encodeURIComponent(sub.slug)}`}
                        onClick={() => {
                          setOpen(false)
                          setActiveParentId(null)
                        }}
                        className="inline-flex items-baseline gap-1.5 text-[13px] font-semibold text-[#1e1e1e] hover:text-[#0040a4] transition-colors py-1.5"
                      >
                        {sub.name}
                        {sub.productCount > 0 && (
                          <span className="text-[11px] font-normal text-[#999999]">
                            ({sub.productCount})
                          </span>
                        )}
                      </Link>
                      {sub.children && sub.children.length > 0 && (
                        <ul className="ml-3 mb-2">
                          {sub.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/katalog?categorySlug=${encodeURIComponent(child.slug)}`}
                                onClick={() => {
                                  setOpen(false)
                                  setActiveParentId(null)
                                }}
                                className="inline-flex items-baseline gap-1 text-[12px] text-[#767676] hover:text-[#0040a4] transition-colors py-1"
                              >
                                {child.name}
                                {child.productCount > 0 && (
                                  <span className="text-[10px] text-[#aaaaaa]">
                                    ({child.productCount})
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : activeParent ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Package className="h-8 w-8 text-[#767676]/30 mb-2" aria-hidden />
                <Link
                  href={`/katalog?categorySlug=${encodeURIComponent(activeParent.slug)}`}
                  onClick={() => {
                    setOpen(false)
                    setActiveParentId(null)
                  }}
                  className="text-[14px] font-semibold text-[#0040a4] hover:underline"
                >
                  {activeParent.name} kategorisine git
                  {activeParent.productCount > 0 && (
                    <span className="ml-1 text-[12px] font-normal text-[#767676]">
                      ({activeParent.productCount} ürün)
                    </span>
                  )}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  NavigationBar                                                      */
/* ------------------------------------------------------------------ */

export function NavigationBar() {
  const { data: session } = useSession()
  const isDealer = session?.user?.role === "dealer" && session?.user?.status === "APPROVED"
  const links = isDealer ? DEALER_NAV_LINKS : NAV_LINKS

  return (
    <nav
      className="w-full bg-white border-b border-[#e9e9e9]"
      role="navigation"
      aria-label="Ana navigasyon"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:flex items-center gap-6 h-[50px]">
          {/* Category dropdown */}
          <CategoryDropdown />

          {/* Nav links */}
          <ul className="flex items-center gap-0" role="list">
            {links.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="inline-flex items-center h-[50px] px-4 text-[13px] font-medium tracking-wider text-[#1e1e1e] hover:text-[#0040a4] transition-colors duration-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}
