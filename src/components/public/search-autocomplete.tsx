"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useProductSuggestions,
  type ProductSuggestion,
} from "@/hooks/use-product-suggestions"

interface SearchAutocompleteProps {
  placeholder?: string
  ariaLabel?: string
  /** Öneri için minimum karakter (varsayılan 3) */
  minChars?: number
  /** <input> sınıfları */
  inputClassName: string
  /** icon + input + action'ı saran görsel kutu (opsiyonel, ör. hero'daki overflow-hidden kap) */
  boxClassName?: string
  /** <form> sınıfları */
  formClassName?: string
  /** input'un soluna mutlak konumlu ikon */
  icon?: React.ReactNode
  /** input'un sağına submit butonu (type="submit" çağırana ait) */
  action?: React.ReactNode
  /** dropdown'a ek sınıflar (hizalama/genişlik için) */
  dropdownClassName?: string
  /** Submit davranışı (verilmezse /katalog?search='e yönlendirir) */
  onSubmit?: (query: string) => void
}

/**
 * SearchAutocomplete — 3+ karakterde otomatik ürün önerisi gösteren arama kutusu.
 * Fiyat göstermez; sonuç görsel + ad + marka/model ile listelenir.
 * Enter → /katalog?search=..., sonuç tıklaması → /katalog/<slug>.
 */
export function SearchAutocomplete({
  placeholder = "Ürün, model, marka ara…",
  ariaLabel = "Ürün ara",
  minChars = 3,
  inputClassName,
  boxClassName,
  formClassName,
  icon,
  action,
  dropdownClassName,
  onSubmit,
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { suggestions, isLoading } = useProductSuggestions(query, minChars)

  const trimmed = query.trim()
  const showDropdown = isOpen && trimmed.length >= minChars

  // Dışarı tıklama → kapat
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  // Escape → kapat + blur
  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", onEscape)
    return () => document.removeEventListener("keydown", onEscape)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trimmed) return
    setIsOpen(false)
    if (onSubmit) {
      onSubmit(trimmed)
    } else {
      router.push(`/katalog?search=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleSelect(product: ProductSuggestion) {
    setIsOpen(false)
    setQuery(product.name)
    router.push(`/katalog/${product.slug}`)
  }

  const hasImage = (p: ProductSuggestion) => !!p.images?.[0]

  return (
    <form onSubmit={handleSubmit} role="search" aria-label={ariaLabel} className={formClassName}>
      <div ref={containerRef} className="relative">
        <div className={cn("relative w-full", boxClassName)}>
          {icon}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={showDropdown}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            className={inputClassName}
          />
          {action}
        </div>

        {showDropdown && (
          <div
            id="search-suggestions"
            className={cn(
              "absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl",
              dropdownClassName
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-[13px] text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--color-primary)]" />
                Aranıyor...
              </div>
            ) : suggestions.length > 0 ? (
              <>
                <ul className="max-h-[380px] overflow-y-auto py-1" role="listbox">
                  {suggestions.map((p) => (
                    <li key={p.id} role="option" aria-selected={false}>
                      <button
                        type="button"
                        onClick={() => handleSelect(p)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                          {hasImage(p) ? (
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <ImageOff className="h-5 w-5 text-slate-300" aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-slate-900">
                            {p.name}
                          </span>
                          {(p.brand?.name || p.modelCode || p.sku) && (
                            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                              {p.brand?.name && <span className="truncate">{p.brand.name}</span>}
                              {p.brand?.name && (p.modelCode || p.sku) && (
                                <span className="text-slate-300">•</span>
                              )}
                              {(p.modelCode || p.sku) && (
                                <span className="truncate">{p.modelCode ?? p.sku}</span>
                              )}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-slate-100 px-4 py-2">
                  <Link
                    href={`/katalog?search=${encodeURIComponent(trimmed)}`}
                    onClick={() => setIsOpen(false)}
                    className="block py-1 text-center text-[13px] font-semibold text-[var(--color-primary)] transition-colors hover:text-nx-accent"
                  >
                    Tümünü Gör →
                  </Link>
                </div>
              </>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[13px] text-slate-500">Sonuç bulunamadı</p>
                <p className="mt-1 text-[11px] text-slate-400">Farklı bir arama terimi deneyin</p>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
