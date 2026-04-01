"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, X, Package, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchResult } from "@/types/catalog"

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

function ResultImage({ src, alt }: { src?: string | null; alt: string }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100">
        <Package className="h-4 w-4 text-slate-300" aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-contain p-1"
      onError={() => setError(true)}
    />
  )
}

interface ProductSearchProps {
  defaultValue?: string
  onSearch?: (query: string) => void
  className?: string
  placeholder?: string
}

export function ProductSearch({
  defaultValue = "",
  onSearch,
  className,
  placeholder = "Ürün adı, marka, barkod veya SKU ara...",
}: ProductSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetch(`/api/catalog/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data: { results: SearchResult[] }) => {
        if (!cancelled) {
          setResults(data.results ?? [])
          setIsOpen(data.results?.length > 0)
        }
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setIsOpen(false)
    if (onSearch) {
      onSearch(query.trim())
    } else {
      router.push(`/urunler?q=${encodeURIComponent(query.trim())}`)
    }
  }

  function handleClear() {
    setQuery("")
    setResults([])
    setIsOpen(false)
    if (onSearch) onSearch("")
    inputRef.current?.focus()
  }

  function handleResultClick() {
    setIsOpen(false)
    setQuery("")
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} role="search" aria-label="Ürün arama">
        <div className="flex h-[50px] rounded-full border-2 border-[#00179e] bg-white overflow-hidden transition-all focus-within:shadow-md">
          {/* Arama input */}
          <div className="relative flex-1 flex items-center">
            <Search
              className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none"
              aria-hidden
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true)
              }}
              placeholder={placeholder}
              className="h-full w-full bg-transparent pl-10 pr-3 text-[13px] text-[#1e293b] placeholder:text-slate-400 focus:outline-none"
              aria-label="Ürün ara"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="search-results"
              autoComplete="off"
            />
            {/* Temizle / Loading */}
            <div className="flex items-center pr-2 gap-1">
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />
              )}
              {query && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Aramayı temizle"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* Arama butonu */}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-5 bg-[#00179e] hover:bg-[#0284c7] text-white text-[13px] font-bold transition-colors shrink-0"
            aria-label="Ara"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Ara</span>
          </button>
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && results.length > 0 && (
        <div
          id="search-results"
          role="listbox"
          aria-label="Arama sonuçları"
          className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
        >
          {results.map((result) => (
            <Link
              key={result.id}
              href={`/urunler/${result.slug}`}
              role="option"
              aria-selected={false}
              onClick={handleResultClick}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0 bg-slate-50">
                <ResultImage src={result.image} alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1e293b] truncate">
                  {result.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {[result.brand, result.category].filter(Boolean).join(" · ")}
                  {result.barcode && ` · ${result.barcode}`}
                </p>
              </div>
            </Link>
          ))}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
              className="text-[12px] text-[#00179e] font-semibold hover:underline w-full text-left"
            >
              &ldquo;{query}&rdquo; için tüm sonuçları gör →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
