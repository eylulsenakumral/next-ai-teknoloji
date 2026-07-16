"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Package, X } from "lucide-react"

interface CategoryChild {
  id: string
  name: string
  slug: string
  productCount?: number
  children?: CategoryChild[]
}

interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  productCount?: number
  children?: CategoryChild[]
}

interface MegaMenuDropdownProps {
  isOpen: boolean
  onClose?: () => void
}

export function MegaMenuDropdown({ isOpen, onClose }: MegaMenuDropdownProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  function navigateTo(slug: string) {
    onClose?.()
    router.push(`/katalog?categorySlug=${encodeURIComponent(slug)}`)
  }

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/public/categories")
        if (res.ok) {
          const json = await res.json()
          const tree: Category[] = (json.data || []).filter(
            (c: Category) => (c.productCount ?? 0) > 0
          )
          setCategories(tree)
        }
      } catch {
        console.error("Kategoriler yüklenemedi")
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Full-screen Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1200px] max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[var(--color-primary)]">Tüm Kategoriler</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 transition-colors"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-400">
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                Kategoriler yükleniyor...
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-20 text-sm text-gray-400">
                <Package className="h-8 w-8" />
                Kategori bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    {/* Parent Category */}
                    <button
                      type="button"
                      onClick={() => navigateTo(cat.slug)}
                      className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--color-primary)] uppercase tracking-wide hover:text-[var(--color-primary)] transition-colors"
                    >
                      {cat.name}
                      {cat.productCount ? (
                        <span className="text-[10px] font-normal text-gray-400">({cat.productCount})</span>
                      ) : null}
                    </button>

                    {/* Children */}
                    {cat.children && cat.children.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {cat.children.map((child) => (
                          <li key={child.id}>
                            <button
                              type="button"
                              onClick={() => navigateTo(child.slug)}
                              className="text-[12px] text-gray-600 hover:text-[var(--color-primary)] transition-colors block"
                            >
                              {child.name}
                              {child.productCount ? (
                                <span className="text-[10px] text-gray-300 ml-1">({child.productCount})</span>
                              ) : null}
                            </button>

                            {/* 3rd level */}
                            {child.children && child.children.length > 0 && (
                              <ul className="ml-3 mt-1 space-y-0.5">
                                {child.children.map((sub) => (
                                  <li key={sub.id}>
                                    <button
                                      type="button"
                                      onClick={() => navigateTo(sub.slug)}
                                      className="text-[11px] text-gray-400 hover:text-[var(--color-primary)] transition-colors block"
                                    >
                                      {sub.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
