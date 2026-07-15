"use client"

import Link from "next/link"

interface BrandLogoItem {
  id: string
  name: string
  logo: string
  link?: string
}

interface BrandLogoBarProps {
  brands: BrandLogoItem[]
  className?: string
}

export function BrandLogoBar({ brands, className = "" }: BrandLogoBarProps) {
  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold mb-12 text-[#0040a4]">Öne Çıkan Markalar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={brand.link ?? "#"}
              className="flex items-center justify-center p-4 bg-[#f4f7fa] rounded-[20px] hover:shadow-lg transition-shadow duration-300"
            >
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-16 object-contain"
                />
              ) : (
                <span className="text-sm font-semibold text-[#0040a4]">{brand.name}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
