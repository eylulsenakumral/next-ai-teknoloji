"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "motion/react"
import {
  Package,
  Truck,
  Shield,
  HeadphonesIcon,
  RefreshCw,
  ChevronRight,
  Lock,
  Sparkles,
  TrendingUp,
  Star,
  Zap,
  Cpu,
  Monitor,
  Keyboard,
  Mouse,
  Wifi,
  HardDrive,
  Cable,
  Settings,
  Server,
  FolderTree,
  Network,
  Volume2,
  Printer,
  ScanBarcode,
  Code2,
} from "lucide-react"
import { PublicProductCard } from "@/components/public/public-product-card"
import { NewsletterSection } from "@/components/public/newsletter-section"
import { useAuth } from "@/hooks/use-auth"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  description?: string | null
  brand: { name: string; slug: string } | null
  category: { name: string; slug: string } | null
  stockStatus: boolean
  campaignDiscountPct?: number | null
}

interface Category {
  id: string
  name: string
  slug: string
  productCount?: number
  imageUrl?: string | null
  icon?: string
}

// ─── Skeletons ───────────────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="bg-[#f3f3f3] rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white rounded-t-2xl" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Section 1: Hero ─────────────────────────────────────────────────────────────

const HERO_CATEGORY_SLUGS = [
  "guvenlik-urunleri",
  "kisisel-bilgisayarlar",
  "ag-ve-network-urunleri",
  "yazici-tarayici",
]

interface HeroImage {
  src: string
  alt: string
  slug: string
}

function HeroSection({ images }: { images: HeroImage[] }) {
  const imgs = images.length >= 4 ? images : [
    { src: "/images/hero/cpu.jpg", alt: "İşlemci", slug: "" },
    { src: "/images/hero/monitor.jpg", alt: "Monitör", slug: "" },
    { src: "/images/hero/keyboard.jpg", alt: "Klavye", slug: "" },
    { src: "/images/hero/mouse.jpg", alt: "Mouse", slug: "" },
  ]
  return (
    <section className="bg-gray-50 py-12 lg:py-20">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* LEFT: 2x2 Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Link href={imgs[0].slug ? `/katalog/${imgs[0].slug}` : "/katalog"} className="block h-48 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {imgs[0].src.startsWith("/") ? (
                  <img src={imgs[0].src} alt={imgs[0].alt} className="w-full h-full object-cover" />
                ) : (
                  <img src={imgs[0].src} alt={imgs[0].alt} className="w-full h-full object-contain p-4" />
                )}
              </Link>
              <Link href={imgs[1].slug ? `/katalog/${imgs[1].slug}` : "/katalog"} className="block h-48 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {imgs[1].src.startsWith("/") ? (
                  <img src={imgs[1].src} alt={imgs[1].alt} className="w-full h-full object-cover" />
                ) : (
                  <img src={imgs[1].src} alt={imgs[1].alt} className="w-full h-full object-contain p-4" />
                )}
              </Link>
            </div>
            <div className="space-y-4 pt-8">
              <Link href={imgs[2].slug ? `/katalog/${imgs[2].slug}` : "/katalog"} className="block h-48 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {imgs[2].src.startsWith("/") ? (
                  <img src={imgs[2].src} alt={imgs[2].alt} className="w-full h-full object-cover" />
                ) : (
                  <img src={imgs[2].src} alt={imgs[2].alt} className="w-full h-full object-contain p-4" />
                )}
              </Link>
              <Link href={imgs[3].slug ? `/katalog/${imgs[3].slug}` : "/katalog"} className="block h-48 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {imgs[3].src.startsWith("/") ? (
                  <img src={imgs[3].src} alt={imgs[3].alt} className="w-full h-full object-cover" />
                ) : (
                  <img src={imgs[3].src} alt={imgs[3].alt} className="w-full h-full object-contain p-4" />
                )}
              </Link>
            </div>
          </div>

          {/* RIGHT: Content */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 bg-[#0040a4]/10 text-[#0040a4] px-4 py-2 rounded-full text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                Yeni Koleksiyon
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl lg:text-6xl font-bold text-[#1e1e1e] leading-tight"
            >
              Premium Teknoloji Ürünleri
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-600 leading-relaxed max-w-xl"
            >
              En yeni bilgisayar, elektronik ve çevre bileşenleri. Kurumsal ve bireysel ihtiyaçlarınıza
              özel çözümler, toptan fiyat avantajları.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/katalog"
                className="inline-flex items-center justify-center gap-2 bg-[#0040a4] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#003080] transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Keşfet
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/basvuru"
                className="inline-flex items-center justify-center gap-2 border-2 border-[#0040a4] text-[#0040a4] px-8 py-4 rounded-full font-semibold hover:bg-[#0040a4]/5 transition-all duration-300"
              >
                Bayi Olun
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Promo Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mt-12"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-[#0040a4]/10 rounded-xl flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-[#0040a4]" />
            </div>
            <h3 className="font-bold text-[#1e1e1e] mb-1">Anlaşmalı Kargo</h3>
            <p className="text-sm text-gray-500">Tüm Türkiye'ye anlaşmalı kargo ile teslimat</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-[#0040a4]/10 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#0040a4]" />
            </div>
            <h3 className="font-bold text-[#1e1e1e] mb-1">2 Yıl Garanti</h3>
            <p className="text-sm text-gray-500">Tüm ürünlerde garanti güvencesi</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-[#0040a4]/10 rounded-xl flex items-center justify-center mb-4">
              <HeadphonesIcon className="w-6 h-6 text-[#0040a4]" />
            </div>
            <h3 className="font-bold text-[#1e1e1e] mb-1">7/24 Destek</h3>
            <p className="text-sm text-gray-500">Uzman teknik destek ekibi</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section 2: Newest Products ───────────────────────────────────

function NewestProductsSection({ products }: { products: Product[] }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-[#0040a4] text-white px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                YENİ
              </span>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                STOKTAN TESLİM
              </p>
            </div>
            <h2 className="text-2xl font-bold text-[#1e1e1e]">En Yeni</h2>
          </div>
          <Link
            href="/katalog?sortBy=newest"
            className="text-sm font-semibold text-[#0040a4] hover:text-[#003080] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.slice(0, 10).map((product) => (
              <PublicProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Section 3: 2-Column Promotional Banners ───────────────────────────────────────

function PromoBannersSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Banner */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-[#0040a4] to-[#003080] rounded-2xl p-10 text-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <h3 className="text-2xl lg:text-3xl font-bold mb-3">En Yeni</h3>
              <p className="text-white/90 mb-6 max-w-md">
                En yeni teknoloji ürünleri ilk siz keşfedin. Güncel fiyatlar ve kampanyalı seçenekler.
              </p>
              <Link
                href="/katalog?sortBy=newest"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0040a4] px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Keşfet
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Right Banner */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-[#1e1e1e] to-[#333] rounded-2xl p-10 text-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <h3 className="text-2xl lg:text-3xl font-bold mb-3">Outlet Fırsatları</h3>
              <p className="text-white/90 mb-6 max-w-md">
                Stoktan çıkar ürünlerde özel indirimler. Sınırlı sayıdaki fırsatları kaçırmayın.
              </p>
              <Link
                href="/katalog?outlet=1"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1e1e1e] px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Keşfet
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Section 4: Kampanyalı Ürünler ──────────────────────────────────────────────────

function CampaignProductsSection({ products }: { products: Product[] }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                <Zap className="w-3 h-3" />
                FIRSAT
              </span>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                KAMPANYALAR
              </p>
            </div>
            <h2 className="text-2xl font-bold text-[#1e1e1e]">Kampanyalı Ürünler</h2>
          </div>
          <Link
            href="/katalog?campaign=1"
            className="text-sm font-semibold text-[#0040a4] hover:text-[#003080] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl bg-[#f3f3f3]/50">
            <Package className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">Şu anda aktif kampanya bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <PublicProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Section 5: Kampanyalı Set ──────────────────────────────────────────────────

interface CampaignSetData {
  id: string
  name: string
  slug: string
  description?: string | null
  type: string
  discountPct?: string | null
  imageUrl?: string | null
  price?: number | null
  currency?: string | null
  priceTry?: number | null
  usdTryRate?: number | null
  products: { product: Product; label?: string; quantity?: number }[]
}

function CampaignSetSection({ sets }: { sets: CampaignSetData[] }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const hideLoginCTA = isAuthenticated || isAdmin

  if (sets.length === 0) return null

  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-3 h-3" />
                KAMPANYA
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#1e1e1e]">Fırsat Ürünleri</h2>
            <p className="text-sm text-gray-500 mt-1">Özel fiyatlarla hazırlanmış ürün setleri</p>
          </div>
          <Link
            href="/kampanya"
            className="text-sm font-semibold text-[#0040a4] hover:text-[#003080] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/kampanya/${set.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#0040a4]/30 transition-all duration-300 flex flex-col"
            >
              {/* Set Görseli */}
              <div className="relative h-44 bg-gradient-to-br from-[#0040a4]/5 to-gray-50 flex items-center justify-center p-4">
                {set.imageUrl ? (
                  <img src={set.imageUrl} alt={set.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-16 w-16 text-gray-200" />
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#0040a4] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    <Sparkles className="w-3 h-3" />
                    {set.type === "BUNDLE" ? "PAKET" : set.type === "OUTLET" ? "OUTLET" : "SET"}
                  </span>
                  {set.discountPct && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                      %{set.discountPct}
                    </span>
                  )}
                </div>
              </div>

              {/* Set Bilgisi */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-base font-semibold text-[#1e1e1e] group-hover:text-[#0040a4] transition-colors line-clamp-2 min-h-[48px]">
                  {set.name}
                </h3>
                {set.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{set.description}</p>
                )}

                {/* Paket İçeriği */}
                <div className="mt-3 flex-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Paket İçeriği</p>
                  <ul className="space-y-1">
                    {set.products.slice(0, 5).map((p) => (
                      <li key={p.product.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-[#0040a4] shrink-0" />
                        <span className="truncate flex-1">{p.product.name}</span>
                        {p.quantity && (
                          <span className="text-xs text-gray-400 shrink-0">{p.quantity} Adet</span>
                        )}
                      </li>
                    ))}
                    {set.products.length > 5 && (
                      <li className="text-xs text-[#0040a4] font-semibold pl-2.5">
                        +{set.products.length - 5} ürün daha
                      </li>
                    )}
                  </ul>
                </div>

                {/* Alt bilgi - Fiyat / Login CTA */}
                <div className="mt-auto pt-3">
                {hideLoginCTA && set.price != null ? (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-[#0040a4]">
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: set.currency || "TRY", minimumFractionDigits: 2 }).format(set.price)}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">+KDV</span>
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: set.currency || "TRY", minimumFractionDigits: 2 }).format(set.price * 1.20)} KDV Dahil
                      </span>
                    </div>
                    {set.currency !== "TRY" && set.priceTry != null && (
                      <div className="flex flex-col items-end">
                        <span className="text-[13px] font-semibold text-gray-600">
                          {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(set.priceTry)}
                          <span className="text-[10px] font-normal text-gray-400 ml-1">+KDV</span>
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(set.priceTry * 1.20)} KDV Dahil
                        </span>
                      </div>
                    )}
                  </div>
                ) : !hideLoginCTA ? (
                  <div className="flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold rounded-lg border border-[#0040a4]/30 bg-[#0040a4]/5 text-[#0040a4]">
                    <Lock className="h-3.5 w-3.5" />
                    Bayi Fiyatı İçin Giriş Yapın
                  </div>
                ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 5.5: Reusable Category Products Section ────────────────────────────────

interface CategorySectionConfig {
  title: string
  badge: string
  slug: string
  icon: React.ElementType
  color: string
}

const CATEGORY_SECTIONS: CategorySectionConfig[] = [
  { title: "Güvenlik Sistemleri Ürünleri", badge: "GÜVENLİK", slug: "guvenlik-urunleri", icon: Shield, color: "bg-emerald-600" },
  { title: "Bilgisayar Ürünleri", badge: "BİLGİSAYAR", slug: "kisisel-bilgisayarlar", icon: Cpu, color: "bg-blue-600" },
  { title: "Sunucular", badge: "SUNUCU", slug: "sunucu-aksesuarlari-1", icon: Server, color: "bg-violet-600" },
  { title: "Kabinler", badge: "KABİN", slug: "kabinler", icon: FolderTree, color: "bg-amber-600" },
  { title: "Ağ ve Network Ürünleri", badge: "NETWORK", slug: "ag-ve-network-urunleri", icon: Network, color: "bg-cyan-600" },
  { title: "Seslendirme Sistemleri", badge: "SESLİ", slug: "seslendirme-sistemleri", icon: Volume2, color: "bg-pink-600" },
  { title: "Yazıcı ve Tarayıcılar", badge: "YAZICI", slug: "yazici-tarayici", icon: Printer, color: "bg-orange-600" },
  { title: "POS ve Barkod Ürünleri", badge: "POS", slug: "otvt-barkod-pdks", icon: ScanBarcode, color: "bg-teal-600" },
  { title: "Yazılımlar", badge: "YAZILIM", slug: "yazilim-ve-lisanslar", icon: Code2, color: "bg-indigo-600" },
]

function CategoryProductsSection({
  config,
  products,
  index,
}: {
  config: CategorySectionConfig
  products: Product[]
  index: number
}) {
  if (products.length === 0) return null
  const isEven = index % 2 === 0

  return (
    <section className={`py-16 ${isEven ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center gap-1.5 ${config.color} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                <config.icon className="w-3 h-3" />
                {config.badge}
              </span>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                STOKTAN TESLİM
              </p>
            </div>
            <h2 className="text-2xl font-bold text-[#1e1e1e]">{config.title}</h2>
          </div>
          <Link
            href={`/katalog?categorySlug=${config.slug}`}
            className="text-sm font-semibold text-[#0040a4] hover:text-[#003080] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product) => (
            <PublicProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 6: Categories Grid ─────────────────────────────────────────────────────

const categoryIcons: Record<string, any> = {
  "Bilgisayar": Cpu,
  "Monitör": Monitor,
  "Klavye": Keyboard,
  "Mouse": Mouse,
  "Ağ Cihazları": Wifi,
  "Depolama": HardDrive,
  "Kablo": Cable,
  "Diğer": Settings,
}

const categoryGradients: string[] = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-cyan-500 to-cyan-700",
  "from-orange-500 to-orange-700",
  "from-teal-500 to-teal-700",
  "from-pink-500 to-pink-700",
  "from-indigo-500 to-indigo-700",
  "from-lime-500 to-lime-700",
  "from-fuchsia-500 to-fuchsia-700",
]

function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-[#0040a4] text-white px-3 py-1 rounded-full text-xs font-bold">
                <FolderTree className="w-3 h-3" />
                KATEGORİLER
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#1e1e1e]">Popüler Kategoriler</h2>
          </div>
          <Link
            href="/kategoriler"
            className="text-sm font-semibold text-[#0040a4] hover:text-[#003080] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl bg-[#f3f3f3]/50">
            <Package className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">Henüz kategori eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories.slice(0, 12).map((category, i) => {
              const Icon = categoryIcons[category.name] || Package
              const gradient = categoryGradients[i % categoryGradients.length]
              const hasImage = !!category.imageUrl
              return (
                <motion.div
                  key={category.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    href={`/katalog?categorySlug=${encodeURIComponent(category.slug)}`}
                    className="relative flex flex-col justify-end rounded-2xl overflow-hidden h-44 group"
                  >
                    {/* Background */}
                    {hasImage ? (
                      <img
                        src={category.imageUrl!}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Icon (only when no image) */}
                    {!hasImage && (
                      <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Text */}
                    <div className="relative z-10 p-4">
                      <p className="text-white font-bold text-sm leading-tight line-clamp-2">
                        {category.name}
                      </p>
                      <p className="text-white/70 text-xs mt-1">
                        {category.productCount || 0} ürün
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Section 6: Tabbed Products ─────────────────────────────────────────────────────

type TabType = "newest" | "popular"

function TabbedProductsSection({
  newest,
  popular,
}: {
  newest: Product[]
  popular: Product[]
}) {
  const [activeTab, setActiveTab] = useState<TabType>("newest")

  const tabs: { id: TabType; label: string; products: Product[] }[] = [
    { id: "newest", label: "En Yeni", products: newest },
    { id: "popular", label: "En Popüler", products: popular },
  ]

  const activeProducts = tabs.find((t) => t.id === activeTab)?.products || []

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                ÖNE ÇIKANLAR
              </span>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                STOKTAN TESLİM
              </p>
            </div>
            <h2 className="text-2xl font-bold text-[#1e1e1e]">Öne Çıkan Ürünler</h2>
          </div>
          <Link
            href="/katalog"
            className="text-sm font-semibold text-[#0040a4] hover:text-[#003080] transition-colors flex items-center gap-1 group"
          >
            Tümünü Gör
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-[#0040a4] text-white"
                  : "text-[#1e1e1e] hover:bg-[#f3f3f3]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {activeProducts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[30px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[30px]"
          >
            {activeProducts.slice(0, 6).map((product) => (
              <PublicProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}

// ─── Section 7: Trust Badges ─────────────────────────────────────────────────────────

function TrustBadgesSection() {
  const badges = [
    {
      icon: Shield,
      title: "Güvenli Ödeme",
      description: "256-bit SSL ile korunan ödeme altyapısı",
    },
    {
      icon: Truck,
      title: "Hızlı Teslimat",
      description: "Aynı gün kargo, 24 saatte kargoya teslim",
    },
    {
      icon: RefreshCw,
      title: "Kolay İade",
      description: "15 gün içinde koşulsuz iade hakkı",
    },
    {
      icon: Star,
      title: "Orijinal Ürün",
      description: "Tüm ürünler orijinal ve garantili",
    },
  ]

  return (
    <section className="py-12 bg-gray-50 border-y border-[#e9e9e9]">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="w-14 h-14 bg-[#0040a4]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <badge.icon className="w-7 h-7 text-[#0040a4]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1e1e1e] text-sm mb-1">{badge.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{badge.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Main Page Component ────────────────────────────────────────────────────────────

export default function PublicHomePage() {
  const [loading, setLoading] = useState(true)
  const [bestSelling, setBestSelling] = useState<Product[]>([])
  const [newest, setNewest] = useState<Product[]>([])
  const [popular, setPopular] = useState<Product[]>([])
  const [campaignProducts, setCampaignProducts] = useState<Product[]>([])
  const [campaignSets, setCampaignSets] = useState<CampaignSetData[]>([])
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [heroImages, setHeroImages] = useState<HeroImage[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Hero görselleri: her kategoriden 1 rastgele ürün
        const heroFetches = HERO_CATEGORY_SLUGS.map((slug) =>
          fetch(`/api/public/catalog/products?limit=20&inStock=true&categorySlug=${slug}`)
            .then((r) => r.json())
            .then((d) => {
              const prods: Product[] = d.data || []
              const shuffled = [...prods].sort(() => Math.random() - 0.5)
              return shuffled[0] || null
            })
            .catch(() => null)
        )

        const baseResponses = await Promise.all([
          fetch("/api/public/catalog/products?limit=10&sortBy=newest"),
          fetch("/api/public/catalog/products?limit=10&inStock=true"),
          fetch("/api/public/categories"),
          fetch("/api/public/catalog/products?limit=8&campaign=true"),
          fetch("/api/public/campaigns"),
        ])
        const [newestRes, inStockRes, categoriesRes, campaignsRes, campaignSetsRes] = baseResponses

        // Tüm kategori bölüm ürünlerini paralel çek
        const categoryResponses = await Promise.all(
          CATEGORY_SECTIONS.map((cs) =>
            fetch(`/api/public/catalog/products?limit=20&inStock=true&categorySlug=${cs.slug}`)
          )
        )

        const [newestData, inStockData, categoriesData, campaignsData, campaignSetsData] = await Promise.all([
          newestRes.json(),
          inStockRes.json(),
          categoriesRes.json(),
          campaignsRes.json(),
          campaignSetsRes.json(),
        ])

        const categoryDataArr = await Promise.all(categoryResponses.map((r) => r.json()))

        setNewest(newestData.data || [])
        setBestSelling(inStockData.data || [])
        // En Popüler: stoklu ürünlerden rastgele seç
        const stockProducts = inStockData.data || []
        const shuffled = [...stockProducts].sort(() => Math.random() - 0.5)
        setPopular(shuffled.slice(0, 6))

        setCampaignProducts(campaignsData.data || [])

        // Kategori ürünlerini karıştır ve map'e ata
        const cMap: Record<string, Product[]> = {}
        CATEGORY_SECTIONS.forEach((cs, i) => {
          const prods = categoryDataArr[i]?.data || []
          cMap[cs.slug] = [...prods].sort(() => Math.random() - 0.5)
        })
        setCategoryProducts(cMap)

        // Campaign Sets — map API response
        const sets: CampaignSetData[] = (campaignSetsData.data || [])
          .map(
            (c: { id: string; name: string; slug: string; description?: string | null; type: string; discountPct?: string | null; imageUrl?: string | null; price?: number | null; currency?: string; priceTry?: number | null; usdTryRate?: number; products: { product: Product; label?: string }[] }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description,
              type: c.type,
              discountPct: c.discountPct,
              imageUrl: c.imageUrl,
              price: c.price,
              currency: c.currency,
              priceTry: c.priceTry,
              usdTryRate: c.usdTryRate,
              products: c.products,
            })
          )
          .filter((s: CampaignSetData) => s.products.length > 0)
        setCampaignSets(sets)

        // Only top-level categories for grid
        setCategories(
          (categoriesData.data || [])
            .filter((c: Category & { parentId?: string | null }) => !c.parentId)
            .slice(0, 12)
        )

        // Hero görsellerini ayarla
        const heroResults = await Promise.all(heroFetches)
        const hImages: HeroImage[] = heroResults
          .filter((p): p is Product => p !== null && Array.isArray(p.images) && p.images.length > 0)
          .map((p) => ({
            src: p.images[Math.floor(Math.random() * p.images.length)],
            alt: p.name,
            slug: p.slug,
          }))
        setHeroImages(hImages)
      } catch (error) {
        console.error("Failed to fetch homepage data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="bg-white min-h-screen">
      <HeroSection images={heroImages} />

      {loading ? (
        <>
          <section className="py-16 bg-white">
            <div className="max-w-[1400px] mx-auto px-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>
          <section className="py-16 bg-gray-50">
            <div className="max-w-[1400px] mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>
          <section className="py-16 bg-white">
            <div className="max-w-[1400px] mx-auto px-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <CategoriesSection categories={categories} />
          <CampaignSetSection sets={campaignSets} />
          <CampaignProductsSection products={campaignProducts} />
          {CATEGORY_SECTIONS.map((cs, i) => (
            <CategoryProductsSection
              key={cs.slug}
              config={cs}
              products={categoryProducts[cs.slug] || []}
              index={i}
            />
          ))}
          <NewestProductsSection products={newest} />
          <PromoBannersSection />
          <CategoriesSection categories={categories} />
          <TabbedProductsSection
            newest={newest}
            popular={popular}
          />
          <TrustBadgesSection />
          <NewsletterSection />
        </>
      )}
    </div>
  )
}
