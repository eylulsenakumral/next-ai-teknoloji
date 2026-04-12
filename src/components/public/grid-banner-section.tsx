"use client"

import Link from "next/link"

interface GridBannerItem {
  id: string
  title: string
  image: string
  link?: string
}

interface GridBannerSectionProps {
  items: GridBannerItem[]
  columns?: 2 | 3 | 5
  className?: string
}

const gridColsMap: Record<2 | 3 | 5, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
}

export function GridBannerSection({ items, columns = 3, className = "" }: GridBannerSectionProps) {
  return (
    <section className={`py-12 px-4 ${className}`}>
      <div className="max-w-[1330px] mx-auto">
        <div className={`grid gap-[30px] ${gridColsMap[columns]}`}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.link ?? "#"}
              className="relative h-64 rounded-2xl overflow-hidden group block"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-end justify-start p-6">
                <h3 className="text-white text-2xl font-bold leading-tight">{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
