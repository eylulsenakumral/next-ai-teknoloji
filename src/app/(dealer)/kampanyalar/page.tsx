import Link from "next/link"
import { prisma } from "@/lib/db"
import { Package, InboxIcon, ShoppingCart, Eye, Percent, Flame } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"

export default async function CampaignsPage() {
  // Kampanyalı ürünler = outlet, öne çıkan veya isFeatured olanlar
  const campaignProducts = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { isOutlet: true },
        { isFeatured: true },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      brand: { select: { name: true, slug: true } },
      supplierProducts: {
        where: { isAvailable: true, deletedAt: null },
        take: 1,
        orderBy: { purchasePrice: "asc" },
        select: { purchasePrice: true },
      },
    },
  })

  return (
    <div className="bg-white">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#2189ff] via-[#2189ff] to-[#2189ff] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame className="h-6 w-6 text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-300">
              Fırsat Ürünleri
            </span>
            <Flame className="h-6 w-6 text-orange-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Kampanyalı Setler
          </h1>
          <p className="text-white/70 text-[14px] mt-3 max-w-lg mx-auto">
            Özel fiyatlı set ürünleri ve outlet fırsatlarını kaçırmayın.
            Sınırlı stok ile avantajlı fiyatlar.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {campaignProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <InboxIcon className="h-14 w-14 text-[#cccccc]" aria-hidden />
            <div>
              <p className="text-[16px] font-semibold text-[#333333]">
                Şu an aktif kampanya bulunmuyor
              </p>
              <p className="text-[13px] text-[#767676] mt-1">
                Kampanyalı ürünler eklendiğinde burada görünecektir.
              </p>
            </div>
            <Link
              href="/urunler"
              className="inline-flex items-center gap-2 bg-[#2189ff] text-white text-[13px] font-semibold px-6 py-2.5 hover:bg-[#1a6fd4] transition-colors"
            >
              Tüm Ürünlere Göz At
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[#767676]">
                <span className="font-semibold text-[#333]">{campaignProducts.length}</span> kampanyalı ürün
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {campaignProducts.map((product) => {
                const priceRaw = product.supplierProducts[0]?.purchasePrice
                const price = priceRaw ? Number(priceRaw) : null

                return (
                  <Link
                    key={product.id}
                    href={`/urunler/${product.slug}`}
                    className="group relative flex flex-col bg-white border border-[#eeeeee] hover:shadow-lg transition-all duration-300"
                  >
                    {/* Badge'ler */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      {product.isOutlet && (
                        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold text-white bg-[#c82333]">
                          <Percent className="h-3 w-3" /> OUTLET
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold text-white bg-orange-500">
                          <Flame className="h-3 w-3" /> FIRSAT
                        </span>
                      )}
                    </div>

                    {/* Görsel */}
                    <div className="aspect-square bg-[#fafafa] flex items-center justify-center overflow-hidden relative">
                      <Package className="h-16 w-16 text-[#e0e0e0]" aria-hidden />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md text-[#333] hover:bg-[#2189ff] hover:text-white transition-colors">
                          <ShoppingCart className="h-4 w-4" />
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md text-[#333] hover:bg-[#2189ff] hover:text-white transition-colors">
                          <Eye className="h-4 w-4" />
                        </span>
                      </div>
                    </div>

                    {/* İçerik */}
                    <div className="p-4 flex flex-col gap-1.5">
                      {/* Marka */}
                      {product.brand && (
                        <p className="text-[11px] font-semibold text-[#2189ff] uppercase tracking-wide">
                          {product.brand.name}
                        </p>
                      )}

                      {/* Fiyat */}
                      {price !== null ? (
                        <p className="text-[18px] font-bold text-[#333333]">
                          {formatCurrency(price)}
                        </p>
                      ) : (
                        <p className="text-[13px] text-[#767676] italic">Fiyat bilgisi yok</p>
                      )}

                      {/* Ürün adı */}
                      <p className="text-[13px] text-[#767676] leading-snug line-clamp-2 group-hover:text-[#2189ff] transition-colors">
                        {product.name}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
