import Link from "next/link"
import { prisma } from "@/lib/db"
import { Package, InboxIcon } from "lucide-react"

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          products: { where: { deletedAt: null, isActive: true } },
        },
      },
    },
  })

  return (
    <div className="bg-white">
      {/* Başlık */}
      <div className="border-b border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-[22px] font-bold text-[#333333] uppercase tracking-wider">
            Markalar
          </h1>
          <div className="w-12 h-0.5 bg-[#2189ff] mx-auto mt-3" />
          <p className="text-[13px] text-[#767676] mt-3">
            Tüm markalarımızı inceleyin, markanın ürünlerini görüntüleyin
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <InboxIcon className="h-12 w-12 text-[#cccccc]" aria-hidden />
            <p className="text-[14px] text-[#767676]">Henüz marka eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/urunler?marka=${encodeURIComponent(brand.slug)}`}
                className="group flex flex-col items-center gap-3 bg-white border border-[#eeeeee] p-6 hover:border-[#2189ff] hover:shadow-md transition-all duration-200"
              >
                {/* Marka baş harfi */}
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#f0f4ff] group-hover:bg-[#2189ff] transition-colors duration-200">
                  <span className="text-[22px] font-bold text-[#2189ff] group-hover:text-white transition-colors duration-200">
                    {brand.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Marka adı */}
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-[#333333] group-hover:text-[#2189ff] transition-colors">
                    {brand.name}
                  </p>
                  <p className="text-[12px] text-[#767676] mt-1">
                    {brand._count.products > 0
                      ? `${brand._count.products} ürün`
                      : "Ürün yok"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
