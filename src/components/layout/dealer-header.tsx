"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  ShoppingCart,
  Menu,
  LogOut,
  Package,
  FileText,
  CreditCard,
  Cpu,
  X,
  Phone,
  User,
  ChevronDown,
  ChevronRight,
  Heart,
  Grid2X2,
  LayoutDashboard,
  Loader2,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart } from "@/hooks/use-cart"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { ProductSearch } from "@/components/products/product-search"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  productCount: number
  children: CategoryTreeNode[]
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const navItems = [
  { href: "/", label: "ANA SAYFA", icon: LayoutDashboard },
  { href: "/urunler", label: "ÜRÜNLER", icon: Package },
  { href: "/markalar", label: "MARKALAR", icon: Grid2X2 },
  { href: "/kampanyalar", label: "KAMPANYALI SETLER", icon: Heart },
  { href: "/siparisler", label: "SİPARİŞLERİM", icon: FileText },
  { href: "/hesabim/cari", label: "CARİ HESAP", icon: CreditCard },
  { href: "/garanti-takip", label: "GARANTİ TAKİP", icon: Shield },
  { href: "/hesabim", label: "HESABIM", icon: User },
]

/* ------------------------------------------------------------------ */
/*  Hook: useCategoryTree                                              */
/* ------------------------------------------------------------------ */

function useCategoryTree() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories/tree")
        if (!res.ok) throw new Error("Kategoriler yüklenemedi")
        const json = await res.json()
        if (!cancelled) {
          setCategories(json.data ?? [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Bilinmeyen hata")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchCategories()
    return () => { cancelled = true }
  }, [])

  return { categories, isLoading, error }
}

/* ------------------------------------------------------------------ */
/*  CartButton                                                         */
/* ------------------------------------------------------------------ */

function CartButton() {
  const { getItemCount, getGrandTotal, toggleCart } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = mounted ? getItemCount() : 0
  const total = mounted ? getGrandTotal() : 0

  const formattedTotal = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(total)

  return (
    <button
      type="button"
      onClick={toggleCart}
      className="relative flex items-center gap-2.5 group"
      aria-label={itemCount > 0 ? `Sepet, ${itemCount} ürün` : "Sepet"}
    >
      <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#2189ff] text-white transition-all group-hover:bg-[#1e1e1e]">
        <ShoppingCart className="h-5 w-5" aria-hidden />
        {itemCount > 0 && (
          <span
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-[#c82333] text-white text-[10px] font-bold border-2 border-white"
            aria-hidden
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </div>
      <div className="hidden sm:flex flex-col leading-none">
        <span className="text-[11px] text-[#767676] font-medium">Sepetim</span>
        <span className="text-[14px] font-bold text-[#333333]">{formattedTotal}</span>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  CategoryDropdown — Desktop Mega Menu                               */
/* ------------------------------------------------------------------ */

function CategoryDropdown() {
  const [open, setOpen] = useState(false)
  const [activeParentId, setActiveParentId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { categories, isLoading } = useCategoryTree()

  // Dropdown disina tiklaninca kapat
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

  // Ilk ust kategoriyi otomatik sec
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
        className="flex items-center gap-2 h-10 px-4 rounded bg-[#2189ff] text-white text-[12px] font-bold capitalize tracking-wider hover:bg-[#1e1e1e] transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Grid2X2 className="h-3.5 w-3.5" aria-hidden />
        KATEGORİLER
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
          className="absolute top-full left-0 z-50 bg-white border border-[#e5e5e5] shadow-xl mt-0 flex"
          style={{ minWidth: "680px" }}
          role="menu"
        >
          {/* Sol panel: Ust kategoriler */}
          <div className="w-56 border-r border-[#e5e5e5] py-2 shrink-0">
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
                      ? "bg-[#f0f4ff] text-[#2189ff] font-semibold"
                      : "text-[#1e1e1e] hover:bg-[#f3f3f3]"
                  )}
                  role="menuitem"
                >
                  <Link
                    href={`/urunler?kategori=${cat.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1"
                  >
                    {cat.name}
                  </Link>
                  {cat.children.length > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#999999]" aria-hidden />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Sag panel: Alt kategoriler */}
          <div className="flex-1 p-5 min-h-[280px]">
            {activeParent && activeParent.children.length > 0 ? (
              <>
                <Link
                  href={`/urunler?kategori=${activeParent.slug}`}
                  onClick={() => {
                    setOpen(false)
                    setActiveParentId(null)
                  }}
                  className="inline-block text-[15px] font-bold text-[#2189ff] mb-4 hover:underline"
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
                        href={`/urunler?kategori=${sub.slug}`}
                        onClick={() => {
                          setOpen(false)
                          setActiveParentId(null)
                        }}
                        className="inline-flex items-baseline gap-1.5 text-[13px] font-semibold text-[#1e1e1e] hover:text-[#2189ff] transition-colors py-1.5"
                      >
                        {sub.name}
                        {sub.productCount > 0 && (
                          <span className="text-[11px] font-normal text-[#999999]">
                            ({sub.productCount})
                          </span>
                        )}
                      </Link>
                      {sub.children.length > 0 && (
                        <ul className="ml-3 mb-2">
                          {sub.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/urunler?kategori=${child.slug}`}
                                onClick={() => {
                                  setOpen(false)
                                  setActiveParentId(null)
                                }}
                                className="inline-flex items-baseline gap-1 text-[12px] text-[#767676] hover:text-[#2189ff] transition-colors py-1"
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
                <Link
                  href={`/urunler?kategori=${activeParent.slug}`}
                  onClick={() => {
                    setOpen(false)
                    setActiveParentId(null)
                  }}
                  className="text-[14px] font-semibold text-[#2189ff] hover:underline"
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
/*  MobileCategoryAccordion                                            */
/* ------------------------------------------------------------------ */

function MobileCategoryAccordion({
  categories,
  isLoading,
  onNavigate,
}: {
  categories: CategoryTreeNode[]
  isLoading: boolean
  onNavigate: () => void
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-[#767676]" />
        <span className="ml-2 text-[12px] text-[#767676]">Kategoriler yükleniyor...</span>
      </div>
    )
  }

  if (categories.length === 0) return null

  return (
    <div className="border-t border-[#eeeeee] pt-2 mt-1">
      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#999999]">
        Kategoriler
      </p>
      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center">
            <Link
              href={`/urunler?kategori=${cat.slug}`}
              onClick={onNavigate}
              className="flex-1 px-3 py-2 text-[13px] font-semibold text-[#1e1e1e] hover:text-[#2189ff] transition-colors"
            >
              {cat.name}
              {cat.productCount > 0 && (
                <span className="ml-1 text-[11px] font-normal text-[#999999]">
                  ({cat.productCount})
                </span>
              )}
            </Link>
            {cat.children.length > 0 && (
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className="p-2 text-[#767676] hover:text-[#2189ff] transition-colors"
                aria-expanded={expandedIds.has(cat.id)}
                aria-label={`${cat.name} alt kategorilerini ${expandedIds.has(cat.id) ? "kapat" : "ac"}`}
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    expandedIds.has(cat.id) && "rotate-180"
                  )}
                />
              </button>
            )}
          </div>

          {expandedIds.has(cat.id) && cat.children.length > 0 && (
            <div className="ml-4 border-l-2 border-[#e5e5e5]">
              {cat.children.map((sub) => (
                <div key={sub.id}>
                  <div className="flex items-center">
                    <Link
                      href={`/urunler?kategori=${sub.slug}`}
                      onClick={onNavigate}
                      className="flex-1 px-3 py-1.5 text-[12px] text-[#555555] hover:text-[#2189ff] transition-colors"
                    >
                      {sub.name}
                      {sub.productCount > 0 && (
                        <span className="ml-1 text-[10px] text-[#999999]">
                          ({sub.productCount})
                        </span>
                      )}
                    </Link>
                    {sub.children.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggle(sub.id)}
                        className="p-2 text-[#767676] hover:text-[#2189ff] transition-colors"
                        aria-expanded={expandedIds.has(sub.id)}
                        aria-label={`${sub.name} alt kategorilerini ${expandedIds.has(sub.id) ? "kapat" : "ac"}`}
                      >
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-200",
                            expandedIds.has(sub.id) && "rotate-180"
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {expandedIds.has(sub.id) && sub.children.length > 0 && (
                    <div className="ml-3">
                      {sub.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/urunler?kategori=${child.slug}`}
                          onClick={onNavigate}
                          className="block px-3 py-1 text-[11px] text-[#767676] hover:text-[#2189ff] transition-colors"
                        >
                          {child.name}
                          {child.productCount > 0 && (
                            <span className="ml-1 text-[10px] text-[#aaaaaa]">
                              ({child.productCount})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MobileDrawer                                                       */
/* ------------------------------------------------------------------ */

function MobileDrawer({
  open,
  onClose,
  pathname,
  categories,
  categoriesLoading,
}: {
  open: boolean
  onClose: () => void
  pathname: string
  categories: CategoryTreeNode[]
  categoriesLoading: boolean
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eeeeee] bg-[#1e1e1e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#2189ff] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-[13px] text-white">Next AI Teknoloji</p>
              <p className="text-[10px] text-white/60">Bayi Portalı</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav
          className="flex flex-col px-3 py-4 gap-0.5 flex-1 overflow-y-auto"
          aria-label="Mobil navigasyon"
        >
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold transition-colors",
                pathname === href
                  ? "bg-[#2189ff] text-white"
                  : "text-[#1e1e1e] hover:bg-[#f3f3f3] hover:text-[#2189ff]"
              )}
              aria-current={pathname === href ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}

          {/* Mobil kategori accordion */}
          <MobileCategoryAccordion
            categories={categories}
            isLoading={categoriesLoading}
            onNavigate={onClose}
          />
        </nav>
        <div className="px-5 py-4 border-t border-[#eeeeee]">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-sm text-red-500 font-medium w-full"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  DealerHeader                                                       */
/* ------------------------------------------------------------------ */

export function DealerHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const { categories, isLoading: categoriesLoading } = useCategoryTree()

  const userName =
    session?.user?.contactName ?? session?.user?.companyName ?? "Bayi"

  useEffect(() => {
    function onScroll() {
      setIsSticky(window.scrollY > 80)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      {/* KATMAN 1 -- Top Bar */}
      <div className="bg-[#2189ff] text-white">
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8 text-[11px] uppercase tracking-wider">
            <span className="text-white hidden sm:block">
              Ücretsiz kargo --{" "}
              <span className="font-semibold">tüm siparişlerde</span> geçerlidir
            </span>
            <div className="flex items-center gap-4 ml-auto">
              <a
                href="tel:+905529895959"
                className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors"
              >
                <Phone className="h-3 w-3" />
                0 552 989 5959
              </a>
              <Link
                href="/hesabim"
                className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors"
              >
                <User className="h-3 w-3" />
                {userName}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KATMAN 2 -- Ana Header */}
      <div className="bg-white border-b border-[#eeeeee] hidden md:block">
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-[90px]">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0"
              aria-label="Next AI Teknoloji ana sayfa"
            >
              <div className="w-11 h-11 rounded bg-[#2189ff] flex items-center justify-center">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-[18px] text-[#1e1e1e] tracking-tight">
                  Next AI Teknoloji
                </span>
                <span className="text-[11px] text-[#767676] font-medium uppercase tracking-widest">
                  B2B Bayi Portalı
                </span>
              </div>
            </Link>

            {/* Yardim metni */}
            <div className="hidden lg:flex flex-col shrink-0">
              <span className="text-[11px] text-[#767676]">Yardıma mı ihtiyacınız var?</span>
              <a
                href="tel:+905529895959"
                className="text-[15px] font-bold text-[#1e1e1e] hover:text-[#2189ff] transition-colors"
              >
                0 552 989 5959
              </a>
            </div>

            {/* Arama */}
            <div className="flex-1 max-w-2xl">
              <ProductSearch
                placeholder="Tüm ürünlerde ara..."
                className="w-full"
              />
            </div>

            {/* Favori + Sepet */}
            <div className="flex items-center gap-4 shrink-0 ml-auto">
              <Link
                href="/favoriler"
                className="flex flex-col items-center gap-0.5 text-[#767676] hover:text-[#2189ff] transition-colors"
                aria-label="Favorilerim"
              >
                <Heart className="h-5 w-5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Favori</span>
              </Link>
              <CartButton />
            </div>
          </div>
        </div>
      </div>

      {/* KATMAN 3 -- Navigasyon Bar */}
      <nav
        className={cn(
          "bg-white border-b border-[#eeeeee] z-40 transition-all duration-200",
          isSticky ? "sticky top-0 shadow-sm" : "relative"
        )}
        aria-label="Ana navigasyon"
      >
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobil header */}
          <div className="flex items-center md:hidden h-14 gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded text-[#1e1e1e] hover:text-[#2189ff] hover:bg-[#f3f3f3] transition-colors"
              aria-label="Menüyü aç"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded bg-[#2189ff] flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-extrabold text-[14px] text-[#1e1e1e] tracking-tight">
                Next AI Teknoloji
              </span>
            </Link>
            <CartButton />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 h-[50px]">
            {/* Kategoriler dropdown */}
            <CategoryDropdown />

            {/* Nav linkleri */}
            <ul className="flex items-center gap-0" role="list">
              {navItems.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "inline-flex items-center h-[50px] px-4 text-[12px] font-bold capitalize tracking-wider transition-colors",
                      pathname === href
                        ? "text-[#2189ff] border-b-2 border-[#2189ff]"
                        : "text-[#1e1e1e] hover:text-[#2189ff] border-b-2 border-transparent"
                    )}
                    aria-current={pathname === href ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobil Drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />

      <CartDrawer />
    </>
  )
}
