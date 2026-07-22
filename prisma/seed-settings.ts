import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

import type { Prisma } from "@prisma/client"

const defaultSettings: { key: string; value: Prisma.InputJsonValue; group: string; description: string }[] = [
  { key: "general.site_name", value: "Next AI Teknoloji", group: "GENERAL", description: "Site adı" },
  { key: "general.site_url", value: "https://nexadepo.com", group: "GENERAL", description: "Site URL" },
  { key: "general.logo_url", value: "/images/logo-dark.png", group: "GENERAL", description: "Logo URL" },
  { key: "general.description", value: "B2B güvenlik ve network tedarik platformu. 27+ global markanın yetkili tedarikçisi.", group: "GENERAL", description: "Site açıklaması" },
  { key: "general.currency", value: "TRY", group: "GENERAL", description: "Varsayılan para birimi" },
  { key: "general.vat_rate", value: "20", group: "GENERAL", description: "Varsayılan KDV oranı (%)" },

  { key: "contact.phone", value: "+90 552 989 59 59", group: "CONTACT", description: "Telefon numarası" },
  { key: "contact.phone_raw", value: "+905529895959", group: "CONTACT", description: "Telefon (raw format)" },
  { key: "contact.email", value: "info@nextai.com.tr", group: "CONTACT", description: "Genel e-posta" },
  { key: "contact.email_legal", value: "hukuk@next-ai.com.tr", group: "CONTACT", description: "Hukuk e-posta" },
  { key: "contact.email_kvkk", value: "kvkk@next-ai.com.tr", group: "CONTACT", description: "KVKK e-posta" },
  { key: "contact.address", value: "Esentepe Mh. Büyükdere Cd. No:123, Şişli, İstanbul 34394", group: "CONTACT", description: "Firma adresi" },
  { key: "contact.whatsapp", value: "+905529895959", group: "CONTACT", description: "WhatsApp numarası" },

  { key: "stats.founded_year", value: "2014", group: "STATS", description: "Kuruluş yılı" },
  { key: "stats.response_time", value: "2–4 saat", group: "STATS", description: "Yanıt süresi" },
  { key: "stats.dealer_count", value: "340+", group: "STATS", description: "Bayi sayısı (fallback)" },
  { key: "stats.brand_count", value: "27+", group: "STATS", description: "Marka sayısı (fallback)" },
  { key: "stats.product_count", value: "1.800+", group: "STATS", description: "Ürün sayısı (fallback)" },
  { key: "stats.project_count", value: "500+", group: "STATS", description: "Proje sayısı (fallback)" },
  { key: "stats.satisfaction_score", value: "4.8/5", group: "STATS", description: "Memnuniyet skoru" },
  { key: "stats.order_completion_rate", value: "99.2%", group: "STATS", description: "Sipariş tamamlama oranı" },
  { key: "stats.monthly_volume", value: "₺2.4M+", group: "STATS", description: "Aylık bayi hacmi" },
  { key: "stats.dealer_years", value: "12", group: "STATS", description: "Sektör deneyimi (yıl)" },

  { key: "seo.org_name", value: "Next AI Teknoloji — nexadepo", group: "SEO", description: "Organization name (schema)" },
  { key: "seo.org_description", value: "B2B güvenlik ve network tedarik platformu. 27+ global markanın yetkili tedarikçisi.", group: "SEO", description: "Organization description" },

  { key: "login.product_count", value: "5.000+", group: "LOGIN", description: "Login sayfası ürün sayısı" },
  { key: "login.brand_count", value: "150+", group: "LOGIN", description: "Login sayfası marka sayısı" },
  { key: "login.dealer_count", value: "500+", group: "LOGIN", description: "Login sayfası bayi sayısı" },
]

async function main() {
  console.log(`Seeding ${defaultSettings.length} settings...`)

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group, description: s.description },
      create: { key: s.key, value: s.value, group: s.group, description: s.description },
    })
    console.log(`  ✓ ${s.key}`)
  }

  console.log("Done!")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})