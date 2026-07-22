"use client"

import { useRouter } from "next/navigation"
import { CatalogHero } from "@/components/public/catalog-hero"

/**
 * Anasayfa hero'su — katalog hero'sunun aynısı.
 * Arama, /katalog?search=... adresine yönlendirir.
 */
export function HomeHero({ total }: { total: number }) {
  const router = useRouter()
  return (
    <CatalogHero
      total={total}
      onSearch={(q) => router.push(`/katalog?search=${encodeURIComponent(q)}`)}
    />
  )
}
