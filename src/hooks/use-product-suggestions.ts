import { useEffect, useRef, useState } from "react"

export interface ProductSuggestion {
  id: string
  name: string
  slug: string
  images: string[]
  sku: string | null
  modelCode: string | null
  brand: { name: string } | null
}

/**
 * useProductSuggestions — arama kutusu otomatik tamamlama önerileri.
 *
 * `minChars` (varsayılan 3) karakterden sonra 300ms debounce ile
 * /api/public/search'e istek atar; eski istekleri abort eder.
 * Fiyat içermez.
 */
export function useProductSuggestions(query: string, minChars = 3) {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = query.trim()

    if (q.length < minChars) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    // Debounce süresince da "aranıyor" görünsün (flash önleme)
    setIsLoading(true)

    const timeoutId = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`/api/public/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          setSuggestions((await res.json()) as ProductSuggestion[])
        } else {
          setSuggestions([])
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") setSuggestions([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      abortRef.current?.abort()
    }
  }, [query, minChars])

  return { suggestions, isLoading }
}
