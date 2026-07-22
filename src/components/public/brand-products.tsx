"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, PackageSearch } from "lucide-react"
import {
  PublicProductCard,
  PublicProductCardSkeleton,
  type PublicProduct,
} from "@/components/public/public-product-card"

const LIMIT = 12

/**
 * BrandProducts — bir markanın ürünlerini katalog API'sinden çekip listeler.
 * Fiyat/stok mantığı katalog API'sinde olduğundan client-side fetch edilir.
 */
export function BrandProducts({ brandSlug }: { brandSlug: string }) {
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({
      brandSlug,
      page: "1",
      limit: String(LIMIT),
      sortBy: "newest",
    })

    fetch(`/api/public/catalog/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setProducts(d.data ?? [])
        setTotal(d.meta?.total ?? 0)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [brandSlug])

  return (
    <section className="bg-[#F7FAFE] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-nx-mono text-xs font-bold uppercase tracking-[0.25em] text-[#1852ac]">
              Ürünler
            </p>
            <h2 className="mt-3 font-nx-heading text-3xl font-bold tracking-tight text-[#1852ac] md:text-4xl">
              {loading ? "Ürünler yükleniyor…" : `${total.toLocaleString("tr-TR")} ürün`}
            </h2>
          </div>
          {!loading && total > 0 && (
            <Link
              href={`/katalog?brandSlug=${brandSlug}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#1852ac]/20 bg-white px-5 py-2.5 text-sm font-bold text-[#1852ac] transition hover:border-[#1852ac] hover:bg-[#1852ac] hover:text-white"
            >
              Tümünü katalogda gör <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PublicProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <p className="text-sm text-slate-500">Ürünler yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <PackageSearch className="h-10 w-10 text-slate-300" aria-hidden />
            <p className="mt-4 text-sm text-slate-500">Bu markaya ait aktif ürün bulunmuyor.</p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <PublicProductCard key={p.id} product={p} />
              ))}
            </div>
            {total > LIMIT && (
              <div className="mt-10 text-center">
                <Link
                  href={`/katalog?brandSlug=${brandSlug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1852ac] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#12408a]"
                >
                  Tüm {total.toLocaleString("tr-TR")} ürünü gör <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
