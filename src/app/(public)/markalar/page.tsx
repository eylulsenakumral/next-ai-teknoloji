import Link from "next/link"
import { prisma } from "@/lib/db"
import { Search } from "lucide-react"

export const metadata = {
  title: "Markalar | Next AI Teknoloji",
  description: "Tüm markaları keşfedin",
}

export default async function MarkalarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  const brands = await prisma.brand.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      _count: { select: { products: { where: { deletedAt: null, isActive: true } } } },
    },
  })

  const grouped = brands.reduce<Record<string, typeof brands>>((acc, brand) => {
    const letter = brand.name[0]?.toUpperCase() ?? "#"
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(brand)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#0040a4] to-[#1a6fe0] text-white py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Markalar</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Güvenilir markaların tamamını keşfedin. Bayi olarak özel fiyatlarla erişim sağlayın.
          </p>
          <form className="mt-8 max-w-lg mx-auto relative" action="/markalar">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Marka ara..."
              className="w-full h-[50px] pl-6 pr-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 outline-none focus:bg-white/30 focus:border-white/50 transition-all duration-300"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-[38px] w-[38px] flex items-center justify-center bg-white text-[#0040a4] rounded-full hover:scale-105 transition-transform"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Letter Nav */}
      {letters.length > 0 && (
        <section className="border-b border-[#e9e9e9] bg-[#f9f9f9]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {letters.map((letter) => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium text-[#1e1e1e] hover:bg-[#0040a4] hover:text-white transition-all duration-200"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brands Grid */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {brands.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[#767676]">
              {q ? `"${q}" ile eşleşen marka bulunamadı.` : "Henüz marka bulunmuyor."}
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`}>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-3xl font-bold text-[#0040a4]">{letter}</span>
                  <div className="flex-1 h-px bg-[#e9e9e9]" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {grouped[letter].map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/katalog?marka=${brand.slug}`}
                      className="group flex flex-col items-center justify-center p-6 bg-[#f3f3f3] rounded-[20px] hover:shadow-[0_8px_30px_rgba(33,137,255,0.15)] hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="w-20 h-20 flex items-center justify-center mb-4">
                        {brand.logoUrl ? (
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="max-h-16 object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-[#0040a4]/30">
                            {brand.name[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-[#1e1e1e] group-hover:text-[#0040a4] transition-colors text-center">
                        {brand.name}
                      </span>
                      {brand._count.products > 0 && (
                        <span className="text-xs text-[#767676] mt-1">
                          {brand._count.products} ürün
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {brands.length > 0 && (
          <div className="mt-16 pt-8 border-t border-[#e9e9e9] text-center">
            <p className="text-[#767676]">
              Toplam <span className="font-bold text-[#1e1e1e]">{brands.length}</span> marka listeleniyor
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
