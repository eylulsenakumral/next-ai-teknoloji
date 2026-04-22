/**
 * AI Ürün Açıklaması Üretici
 * Kullanım: npx tsx scripts/generate-descriptions.ts [--limit N] [--product-id UUID]
 */
import { config } from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

config()

const Z_AI_API_KEY = process.env.Z_AI_API_KEY
const Z_AI_API_URL = process.env.Z_AI_API_URL || "https://api.z.ai/api/coding/paas/v4/chat/completions"
const Z_AI_MODEL = process.env.Z_AI_MODEL || "glm-4.5-air"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function generateDescription(product: {
  name: string
  brand: string | null
  category: string | null
  specs: unknown
  sku: string | null
  barcode: string | null
  modelCode: string | null
}): Promise<string> {
  const specsText = product.specs
    ? typeof product.specs === "string"
      ? product.specs
      : JSON.stringify(product.specs, null, 2)
    : ""

  const prompt = `Türkçe olarak, aşağıdaki ürün için profesyonel bir e-ticaret ürün açıklaması yaz.
Ürünün teknik özelliklerini, kullanım alanlarını ve avantajlarını içeren 3-5 paragraflık bir açıklama yaz.
Doğrudan açıklama metnini yaz, başlık veya giriş yapma.

Ürün Adı: ${product.name}
${product.brand ? `Marka: ${product.brand}` : ""}
${product.category ? `Kategori: ${product.category}` : ""}
${product.modelCode ? `Model Kodu: ${product.modelCode}` : ""}
${product.sku ? `SKU: ${product.sku}` : ""}
${specsText ? `Teknik Özellikler: ${specsText}` : ""}`

  const res = await fetch(Z_AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Z_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: Z_AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ""
}

async function main() {
  const args = process.argv.slice(2)
  const limitIdx = args.indexOf("--limit")
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) || 10 : 10
  const productIdIdx = args.indexOf("--product-id")
  const productId = productIdIdx >= 0 ? args[productIdIdx + 1] : null

  if (!Z_AI_API_KEY) {
    console.error("HATA: Z_AI_API_KEY ortam değişkeni bulunamadı.")
    process.exit(1)
  }

  // Açıklaması olmayan ürünleri bul
  const where = productId
    ? { id: productId, deletedAt: null }
    : {
        deletedAt: null,
        isActive: true,
        OR: [{ description: null }, { description: "" }],
      }

  const total = await prisma.product.count({ where })

  if (total === 0) {
    console.log("✅ Açıklama gerektiren ürün bulunamadı.")
    await prisma.$disconnect()
    await pool.end()
    return
  }

  console.log(`📋 ${total} ürün bulundu, ${Math.min(limit, total)} adet işlenecek...\n`)

  const products = await prisma.product.findMany({
    where,
    take: limit,
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      modelCode: true,
      specs: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
  })

  let ok = 0
  let errors = 0

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    process.stdout.write(`[${i + 1}/${products.length}] ${p.name.substring(0, 60)}... `)

    try {
      const description = await generateDescription({
        name: p.name,
        brand: p.brand?.name ?? null,
        category: p.category?.name ?? null,
        specs: p.specs,
        sku: p.sku,
        barcode: p.barcode,
        modelCode: p.modelCode,
      })

      if (description) {
        await prisma.product.update({
          where: { id: p.id },
          data: { description },
        })
        console.log(`✅ (${description.length} karakter)`)
        ok++
      } else {
        console.log("⚠️ Boş yanıt")
        errors++
      }
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : "Hata"}`)
      errors++
    }

    // Rate limit: 1 saniye bekle
    if (i < products.length - 1) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  console.log(`\n📊 Sonuç: ${ok} başarılı, ${errors} hata`)
  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error("Fatal:", err)
  prisma.$disconnect()
  pool.end()
  process.exit(1)
})
