"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PublicProductCard } from "@/components/public/public-product-card"
import type { PublicProduct } from "@/components/public/public-product-card"

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface TabbedProductSectionProps {
  bestSellers?: PublicProduct[]
  newArrivals?: PublicProduct[]
  topSellings?: PublicProduct[]
}

type TabKey = "bestSellers" | "newArrivals" | "topSellings"

interface Tab {
  key: TabKey
  label: string
}

const TABS: Tab[] = [
  { key: "bestSellers", label: "Çok Satanlar" },
  { key: "newArrivals", label: "Yeni Gelenler" },
  { key: "topSellings", label: "En Popüler" },
]

/* ------------------------------------------------------------------ */
/*  TabbedProductSection                                                */
/* ------------------------------------------------------------------ */

export function TabbedProductSection({
  bestSellers = [],
  newArrivals = [],
  topSellings = [],
}: TabbedProductSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("bestSellers")

  const productMap: Record<TabKey, PublicProduct[]> = {
    bestSellers,
    newArrivals,
    topSellings,
  }

  const activeProducts = productMap[activeTab]

  // Hide section if all tabs are empty
  if (!bestSellers.length && !newArrivals.length && !topSellings.length) {
    return null
  }

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Tab Bar */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
              activeTab === tab.key
                ? "bg-[#0040a4] text-white shadow-sm"
                : "bg-transparent text-[#1e1e1e] hover:bg-[#f3f3f3]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div
        key={activeTab}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[30px] animate-in fade-in duration-200"
      >
        {activeProducts.length > 0 ? (
          activeProducts.map((product) => (
            <PublicProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="col-span-full text-center text-sm text-[#767676] py-12">
            Bu kategoride ürün bulunamadı.
          </p>
        )}
      </div>
    </section>
  )
}
