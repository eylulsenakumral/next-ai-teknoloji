export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const metadata: Metadata = {
  title: "Kampanyalar",
}
import Image from "next/image"
import { Package, InboxIcon, ShoppingCart, Eye, Percent, Flame, Sparkles, ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { calculateBulkPrices } from "@/services/pricing.service"

export default async function CampaignsPage() {
  // KRİTİK: Bayi fiyatları içerir — giriş yapmamış/anonim kullanıcıya açmamak için auth zorunlu.
  // (dealer) route group URL'e yansımaz → /kampanyalar herkese açık olurdu.
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "dealer") {
    redirect("/login")
  }

  // Kampanyalı ürünler = outlet, öne çıkan veya isFeatured olanlar
  const [campaignProducts, campaignSets] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { isOutlet: true },
          { isFeatured: true },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        isOutlet: true,
        isFeatured: true,
        manualPrice: true,
        manualPriceCurrency: true,
        campaignDiscountPct: true,
        brand: { select: { name: true, slug: true } },
        supplierProducts: {
          where: { deletedAt: null, isAvailable: true },
          select: { stockQuantity: true },
        },
      },
    }),
    prisma.campaignSet.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { validFrom: null },
          { validFrom: { lte: new Date() } },
        ],
        AND: [
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                brand: { select: { name: true } },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ])

  // Bulk fiyat hesaplama
  const productIds = campaignProducts.map(p => p.id)
  const priceMap = await calculateBulkPrices(productIds)

  return (
    <div className="bg-white">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-primary)] text-white">
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
              <p className="text-[16px] font-semibold text-[var(--color-foreground)]">
                Şu an aktif kampanya bulunmuyor
              </p>
              <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                Kampanyalı ürünler eklendiğinde burada görünecektir.
              </p>
            </div>
            <Link
              href="/urunler"
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white text-[13px] font-semibold px-6 py-2.5 hover:bg-[#1a6fd4] transition-colors"
            >
              Tüm Ürünlere Göz At
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[var(--color-text-muted)]">
                <span className="font-semibold text-[#333]">{campaignProducts.length}</span> kampanyalı ürün
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {campaignProducts.map((product) => {
                // Stok hesapla
                const totalStock = product.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)

                // Fiyat mantığı: manualPrice > pricing service
                let displayPrice: number | null = null
                let originalPrice: number | null = null
                let discountPct: number | null = null

                const manualPrice = product.manualPrice ? Number(product.manualPrice) : null
                const pricing = priceMap.get(product.id)
                const calculatedPrice = pricing?.salePriceExVat ?? null

                if (manualPrice) {
                  displayPrice = manualPrice
                } else if (calculatedPrice) {
                  displayPrice = calculatedPrice
                }

                // İndirim oranı
                const campaignDiscount = product.campaignDiscountPct ? Number(product.campaignDiscountPct) : null

                if (campaignDiscount && displayPrice) {
                  originalPrice = displayPrice
                  displayPrice = Math.round((displayPrice * (1 - campaignDiscount / 100)) * 100) / 100
                  discountPct = campaignDiscount
                }

                return (
                  <Link
                    key={product.id}
                    href={`/urunler/${product.slug}`}
                    className="group relative flex flex-col bg-white border border-[var(--color-border)] hover:shadow-lg transition-all duration-300"
                  >
                    {/* Badge'ler */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      {discountPct !== null && (
                        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold text-white bg-red-500">
                          %{Math.round(discountPct)} İNDİRİM
                        </span>
                      )}
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
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain p-4"
                        />
                      ) : (
                        <Package className="h-16 w-16 text-[#e0e0e0]" aria-hidden />
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md text-[#333] hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                          <ShoppingCart className="h-4 w-4" />
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md text-[#333] hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                          <Eye className="h-4 w-4" />
                        </span>
                      </div>
                    </div>

                    {/* İçerik */}
                    <div className="p-4 flex flex-col gap-1.5">
                      {/* Marka */}
                      {product.brand && (
                        <p className="text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wide">
                          {product.brand.name}
                        </p>
                      )}

                      {/* Fiyat */}
                      {displayPrice !== null ? (
                        <div className="flex flex-col">
                          {discountPct !== null && originalPrice !== null && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[13px] text-[#999] line-through">
                                {formatCurrency(originalPrice)}
                              </span>
                            </div>
                          )}
                          <p className="text-[18px] font-bold text-[var(--color-foreground)]">
                            {formatCurrency(displayPrice)} <span className="text-[10px] text-gray-400 font-normal">+KDV</span>
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {formatCurrency(displayPrice * 1.2)} <span className="text-[9px]">KDV dahil</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-[13px] text-[var(--color-text-muted)] italic">Fiyat bilgisi yok</p>
                      )}

                      {/* Stok */}
                      <p className={`text-[11px] font-semibold ${totalStock > 0 ? 'text-emerald-600' : 'text-[var(--color-error)]'}`}>
                        {totalStock > 0 ? `Stok: ${totalStock} adet` : 'Stokta yok'}
                      </p>

                      {/* Ürün adı */}
                      <p className="text-[13px] text-[var(--color-text-muted)] leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
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

      {/* Kampanyalı Setler */}
      {campaignSets.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-3 h-3" />
                  SET
                </span>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                  KAMPANYA
                </p>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-foreground)]">Kampanyalı Setler</h2>
              <p className="text-sm text-gray-500 mt-1">Özel fiyatlarla hazırlanmış ürün setleri</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaignSets.map((set) => (
              <Link
                key={set.id}
                href={`/kampanya/${set.slug}`}
                className="group bg-white rounded-xl border border-[var(--color-border)] overflow-hidden hover:shadow-lg hover:border-[var(--color-primary)]/30 transition-all duration-300 flex flex-col"
              >
                {/* Set Görseli */}
                <div className="relative h-44 bg-gradient-to-br from-[var(--color-primary)]/5 to-gray-50 flex items-center justify-center p-4">
                  {set.imageUrl ? (
                    <img src={set.imageUrl} alt={set.name} className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <Package className="h-14 w-14 text-gray-200" />
                  )}
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-[var(--color-primary)] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      {set.type === "BUNDLE" ? "PAKET" : set.type === "OUTLET" ? "OUTLET" : "SET"}
                    </span>
                    {set.discountPct && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        %{Number(set.discountPct)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Set Bilgisi */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-[15px] font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 min-h-[44px]">
                    {set.name}
                  </h3>
                  {set.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{set.description}</p>
                  )}

                  {/* Paket İçeriği */}
                  <div className="mt-3 flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Paket İçeriği</p>
                    <ul className="space-y-1">
                      {set.products.slice(0, 4).map((p) => (
                        <li key={p.product.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] shrink-0" />
                          <span className="truncate flex-1">{p.product.name}</span>
                        </li>
                      ))}
                      {set.products.length > 4 && (
                        <li className="text-xs text-[var(--color-primary)] font-semibold pl-2.5">
                          +{set.products.length - 4} ürün daha
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Set Stok */}
                  <div className="flex items-center gap-2 mt-2">
                    <p className={`text-[12px] font-semibold ${set.stockQuantity != null && set.stockQuantity > 0 ? 'text-emerald-600' : 'text-[var(--color-error)]'}`}>
                      {set.stockQuantity != null ? (set.stockQuantity > 0 ? `Set Stok: ${set.stockQuantity} adet` : 'Stokta yok') : 'Stok bilgisi yok'}
                    </p>
                  </div>

                  {/* Fiyat */}
                  {set.price !== null && (
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-[var(--color-primary)]">
                            {formatCurrency(Number(set.price) * (set.discountPct ? (1 - Number(set.discountPct) / 100) : 1))}
                            <span className="text-[10px] font-normal text-gray-400 ml-1">+KDV</span>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {formatCurrency(Number(set.price) * (set.discountPct ? (1 - Number(set.discountPct) / 100) : 1) * 1.2)} KDV Dahil
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[var(--color-primary)] transition-colors" />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
