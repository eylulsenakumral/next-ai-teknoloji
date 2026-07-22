import "dotenv/config"
import { PrismaClient, type Prisma } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const settings: { key: string; value: Prisma.InputJsonValue; group: string; description: string }[] = [
    { key: "pricing.public_markup_percent", value: "80", group: "PRICING", description: "Giriş yapmamış kullanıcılar için maliyet üzerine eklenen yüzde (retail fiyat)" },
    { key: "pricing.public_show_price", value: "true", group: "PRICING", description: "Giriş yapmamış kullanıcılar fiyat görsün mü? (true/false)" },
  ]

  for (const s of settings) {
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

main()
