/**
 * Kategori Agaci LLM Destekli Yeniden Duzenleme
 * Kullanim: npx tsx scripts/reorganize-categories.ts --dry-run
 */
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import pg from "pg"
import { config } from "dotenv"
config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const DRY_RUN = process.argv.includes("--dry-run")
const MAX_TOKENS = parseInt(process.argv.find(a => a.startsWith("--max-tokens="))?.split("=")[1] ?? "16000")
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith("--batch-size="))?.split("=")[1] ?? "30")
const MODEL = process.argv.find(a => a.startsWith("--model="))?.split("=")[1] ?? "glm-4.5-air"
const MAX_RETRIES = 3
const API_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions"
const API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY

async function fetchAllProducts() {
  return prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true, name: true, sku: true, modelCode: true, specs: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  })
}

async function callLLMWithRetry(batch: Awaited<ReturnType<typeof fetchAllProducts>>, bi: number) {
  const items = batch.map(p => ({
    id: p.id, name: p.name, brand: p.brand?.name ?? "Marka Yok",
    sku: p.sku, modelCode: p.modelCode, specs: p.specs,
    currentCategory: p.category?.name ?? "Kategorisiz",
  }))

  const CATEGORY_TREE = `CCTV Sistemleri > IP Kamera > 2MP
CCTV Sistemleri > IP Kamera > 4MP
CCTV Sistemleri > IP Kamera > 5MP
CCTV Sistemleri > IP Kamera > 8MP
CCTV Sistemleri > IP Kamera > 12MP
CCTV Sistemleri > HDCVI Kamera > 2MP
CCTV Sistemleri > HDCVI Kamera > 4MP
CCTV Sistemleri > HDCVI Kamera > 5MP
CCTV Sistemleri > Analog Kamera
CCTV Sistemleri > PTZ Kamera
CCTV Sistemleri > Termal Kamera
CCTV Sistemleri > NVR
CCTV Sistemleri > DVR
CCTV Sistemleri > XVR
CCTV Sistemleri > Monitör
CCTV Sistemleri > Kamera Aksesuarı
CCTV Sistemleri > Diğer
Ag ve Transmisyon > PoE Switch
Ag ve Transmisyon > Managed Switch
Ag ve Transmisyon > Fiber Optik
Ag ve Transmisyon > Kablo
Ag ve Transmisyon > Video Balun
Ag ve Transmisyon > Kablosuz
Ag ve Transmisyon > Diğer
Erisim Kontrolu > Kart Okuyucu
Erisim Kontrolu > Turnike
Erisim Kontrolu > Bariyer
Erisim Kontrolu > Kapi Istasyonu
Erisim Kontrolu > Interkom
Erisim Kontrolu > Kontrol Paneli
Erisim Kontrolu > Diğer
Yangin ve Guvenlik > Dedektor
Yangin ve Guvenlik > Yangin Paneli
Yangin ve Guvenlik > Siren
Yangin ve Guvenlik > Alarm Sistemi
Yangin ve Guvenlik > Diğer
Akilli Sistemler > Goruntu Analizi
Akilli Sistemler > Plaka Tanimai
Akilli Sistemler > Yuz Tanimai
Akilli Sistemler > Hareket Analizi
Akilli Sistemler > IoT Sensor
Akilli Sistemler > Diğer
Bilisim > Hard Disk
Bilisim > SSD
Bilisim > Monitor
Bilisim > Bilgisayar
Bilisim > Yazici
Bilisim > Aksesuar
Bilisim > Diğer
Guc ve Enerji > Adaptör
Guc ve Enerji > Guc Kaynagi
Guc ve Enerji > UPS
Guc ve Enerji > Gunes Paneli
Guc ve Enerji > Pil
Guc ve Enerji > Diğer
Aksesuarlar ve Sarf > Montaj Aparati
Aksesuarlar ve Sarf > Kablo ve Konnektor
Aksesuarlar ve Sarf > Raf ve Dolap
Aksesuarlar ve Sarf > Sogutma
Aksesuarlar ve Sarf > Muhafaza
Aksesuarlar ve Sarf > Diğer`

  const prompt = `Sen guvenlik/bilisim teknolojileri B2B e-ticaret uzmanisin.
Urunleri analiz et ve ONCEDEN TANIMLI kategori agacina ata.

KATEGORI AGACI (SADECE BU KATEGORILERI KULLAN, YENI KATEGORI YARATMA):
${CATEGORY_TREE}

KURALLAR:
1. Her urunu yukaridaki kategorilerden birine ata
2. En uygun yaprak kategoriyi sec
3. Marka adlarini kategori KULLANMA
4. YENI kategori YARATMA - sadece yukaridaki listedeki kategorileri kullan
5. Emin degilsen "Diger" alt kategorisine ata
6. Turkce isimler kullan

URUNLER:
${JSON.stringify(items)}

SADECE JSON dondur:
{"assignments":[{"productId":"id","categoryPath":"CCTV Sistemleri > IP Kamera > 4MP"}]}`

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Batch ${bi+1}] LLM cagriliyor (${items.length} urun, deneme ${attempt}/${MAX_RETRIES})...`)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL, messages: [{ role: "user", content: prompt }],
          temperature: 0.1, max_tokens: MAX_TOKENS, response_format: { type: "json_object" },
        }),
      })
      clearTimeout(timeout)

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`)
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content || content.trim().length < 10) throw new Error("LLM bos/kisa yanit")

      let clean = content.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "")
      const parsed = JSON.parse(clean)

      if (!parsed.assignments || parsed.assignments.length === 0) {
        throw new Error("LLM atama dondurmedi")
      }

      return parsed
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  [Batch ${bi+1}] Deneme ${attempt} basarisiz: ${msg}`)
      if (attempt < MAX_RETRIES) {
        const wait = attempt * 2000
        console.log(`  ${wait/1000}s beklenip tekrar denenecek...`)
        await new Promise(r => setTimeout(r, wait))
      } else {
        throw new Error(`Batch ${bi+1} ${MAX_RETRIES} deneme sonrasi basarisiz: ${msg}`)
      }
    }
  }
  throw new Error("Ulasilmamali")
}

function slugify(t: string) {
  return t.toLowerCase().replace(/ı/g,"i").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")
}

async function ensureCategory(path: string): Promise<string> {
  const parts = path.split(" > ")
  let parentId: string | null = null
  let currentSlug = ""
  let categoryId = ""
  for (let i = 0; i < parts.length; i++) {
    const name = parts[i].trim()
    currentSlug = currentSlug ? `${currentSlug}/${slugify(name)}` : slugify(name)
    const existing = await prisma.category.findFirst({ where: { slug: currentSlug, deletedAt: null } })
    if (existing) { categoryId = existing.id; parentId = existing.id }
    else {
      const created: { id: string } = await prisma.category.create({
        data: { name, slug: currentSlug, parentId, depth: i, path: currentSlug, isActive: true },
      })
      categoryId = created.id; parentId = created.id
      console.log(`  + ${parts.slice(0, i+1).join(" > ")}`)
    }
  }
  return categoryId
}

async function main() {
  console.log(`\n${"=".repeat(60)}`)
  console.log(DRY_RUN ? "DRY-RUN - DB'ye yazilmayacak" : "GERCEK CALISTIRMA")
  console.log(`Model: ${MODEL} | Batch: ${BATCH_SIZE} | MaxTokens: ${MAX_TOKENS}`)
  console.log(`${"=".repeat(60)}\n`)

  const products = await fetchAllProducts()
  console.log(`${products.length} urun bulundu.\n`)

  const allCategories = new Map<string, string>()
  const allAssignments: { productId: string; categoryPath: string }[] = []
  const batches = Math.ceil(products.length / BATCH_SIZE)
  let failedBatches = 0

  for (let i = 0; i < batches; i++) {
    const batch = products.slice(i * BATCH_SIZE, (i+1) * BATCH_SIZE)
    try {
      const result = await callLLMWithRetry(batch, i)
      if (result.categories) result.categories.forEach((c: { path: string }) => { if (c.path) allCategories.set(c.path, "") })
      if (result.assignments) {
        const valid = result.assignments.filter((a: { categoryPath: string }) => a.categoryPath)
        // assignments'dan kategori path'lerini topla
        for (const a of valid) allCategories.set(a.categoryPath, "")
        allAssignments.push(...valid)
      }
      console.log(`  ✓ ${allCategories.size} kat, ${allAssignments.length} atama`)
    } catch (err) {
      console.error(`  ✗ ${err}`)
      failedBatches++
    }
    if (i < batches - 1 && i % 5 !== 4) { await new Promise(r => setTimeout(r, 2000)) }
    if (i % 5 === 4 && i < batches - 1) {
      console.log(`  --- %${Math.round((i+1)/batches*100)} (${i+1}/${batches}) ---`)
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log(`\nSonuc: ${allCategories.size} kategori, ${allAssignments.length} atama, ${products.length - allAssignments.length} kategorisiz, ${failedBatches} basarisiz batch`)
  console.log("\nKategori Agaci:")
  const sorted = [...allCategories.keys()].filter(Boolean).sort()
  for (const path of sorted) {
    const d = path.split(" > ").length - 1
    console.log(`${"  ".repeat(d)}├── ${path.split(" > ").pop()}`)
  }

  if (DRY_RUN) { console.log("\nDRY-RUN: Degisiklik yapilmadi."); return }

  console.log("\nKategoriler olusturuluyor...")
  for (const path of sorted) { const id = await ensureCategory(path); allCategories.set(path, id) }

  console.log("\nUrunler ataniyor...")
  let updated = 0, errors = 0
  for (const a of allAssignments) {
    const catId = allCategories.get(a.categoryPath)
    if (!catId) { errors++; continue }
    try { await prisma.product.update({ where: { id: a.productId }, data: { categoryId: catId } }); updated++ }
    catch { errors++ }
  }
  console.log(`\nTamamlandi! ${updated} guncellendi, ${errors} hata.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
