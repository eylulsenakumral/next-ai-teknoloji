import "server-only"
import { cache } from "react"
import { prisma } from "./db"

const SETTINGS_TTL = 5 * 60 // 5 dakika

export type SettingsMap = Record<string, unknown>

/**
 * Tüm ayarları DB'den çeker.
 * Server Component'lerde React cache ile request başına tek sorgu.
 */
export const getSettings = cache(async (): Promise<SettingsMap> => {
  const rows = await prisma.setting.findMany({
    orderBy: [{ group: "asc" }, { key: "asc" }],
  })

  const map: SettingsMap = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
})

/**
 * Tek bir ayar değerini okur, varsayılan değer döner.
 */
export async function getSetting<T = unknown>(key: string, fallback?: T): Promise<T> {
  const settings = await getSettings()
  return (settings[key] as T) ?? fallback as T
}

/**
 * Site genel ayarları (tip güvenli erişim için)
 */
export async function getSiteConfig() {
  const settings = await getSettings()
  return {
    name: (settings["general.site_name"] as string) || "Next AI Teknoloji",
    url: (settings["general.site_url"] as string) || "https://nexadepo.com",
    logoUrl: (settings["general.logo_url"] as string) || "/images/logo-dark.png",
    description: (settings["general.description"] as string) || "B2B güvenlik ve network tedarik platformu.",
    currency: (settings["general.currency"] as string) || "TRY",
    vatRate: Number(settings["general.vat_rate"] ?? 20),
    phone: (settings["contact.phone"] as string) || "+90 552 989 59 59",
    phoneRaw: (settings["contact.phone_raw"] as string) || "+905529895959",
    email: (settings["contact.email"] as string) || "info@nextai.com.tr",
    emailLegal: (settings["contact.email_legal"] as string) || "hukuk@next-ai.com.tr",
    emailKvkk: (settings["contact.email_kvkk"] as string) || "kvkk@next-ai.com.tr",
    address: (settings["contact.address"] as string) || "Esentepe Mh. Büyükdere Cd. No:123, Şişli, İstanbul 34394",
    whatsapp: (settings["contact.whatsapp"] as string) || "+905529895959",
    foundedYear: (settings["stats.founded_year"] as string) || "2014",
    responseTime: (settings["stats.response_time"] as string) || "2–4 saat",
    dealerCount: (settings["stats.dealer_count"] as string) || "340+",
    brandCount: (settings["stats.brand_count"] as string) || "27+",
    productCount: (settings["stats.product_count"] as string) || "1.800+",
    projectCount: (settings["stats.project_count"] as string) || "500+",
    satisfactionScore: (settings["stats.satisfaction_score"] as string) || "4.8/5",
    orderCompletionRate: (settings["stats.order_completion_rate"] as string) || "99.2%",
    monthlyVolume: (settings["stats.monthly_volume"] as string) || "₺2.4M+",
    dealerYears: (settings["stats.dealer_years"] as string) || "12",
    metadata: settings as Record<string, unknown>,
  }
}

/**
 * Dinamik sayılar — DB'den gerçek zamanlı
 */
export async function getLiveCounts() {
  const [brandCount, productCount, customerCount, orderCount] = await Promise.all([
    prisma.brand.count({ where: { isActive: true, deletedAt: null } }),
    prisma.product.count({ where: { isActive: true, deletedAt: null } }),
    prisma.customer.count({ where: { status: "APPROVED", deletedAt: null } }),
    prisma.order.count(),
  ])

  return {
    brandCount,
    productCount,
    customerCount,
    orderCount,
    brandCountFormatted: `${brandCount}+`,
    productCountFormatted: `${Math.floor(productCount / 100) * 100}+`,
    customerCountFormatted: `${customerCount}+`,
  }
}

/**
 * Cache invalidasyonu — admin panelden ayar değişince çağrılır.
 */
export async function invalidateSettingsCache(): Promise<void> {
  // React cache per-request'tir, ayrıca temizlemeye gerek yok.
  // Admin ayrı bir request'te yazdığı için bir sonraki sayfa yüklemesi taze veri çeker.
}