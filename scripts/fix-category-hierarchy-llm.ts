/**
 * Kategori Hiyerarşi Düzeltme Scripti (LLM Destekli)
 *
 * Sorunlar:
 * 1. parentId=null ama depth>=1 olan kategoriler (root'ta kaybolmuş)
 * 2. depth/parent depth uyumsuzluğu (Power Supply, Akü, Elektrik Aksesuarları)
 * 3. Bellekler/Harddiskler alt tipleri parent'sız
 *
 * Kullanım:
 *   npx tsx scripts/fix-category-hierarchy-llm.ts            ← dry-run
 *   npx tsx scripts/fix-category-hierarchy-llm.ts --execute  ← gerçek çalıştırma
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const EXECUTE = process.argv.includes("--execute")
const DRY_RUN = !EXECUTE

const Z_API_KEY = process.env.Z_AI_API_KEY || process.env.WHATSAPP_AI_API_KEY
const Z_API_URL = process.env.Z_AI_API_URL || "https://api.z.ai/api/coding/paas/v4/chat/completions"
const Z_MODEL = process.env.Z_AI_MODEL || "glm-5-turbo"

// ============================================================================
// TİPLER
// ============================================================================

interface CategoryRow {
  id: string
  name: string
  parentId: string | null
  depth: number
  slug: string
  path: string | null
}

interface MoveOperation {
  categoryId: string
  categoryName: string
  newParentId: string
  newParentName: string
  oldParentId: string | null
  reason: string
}

// ============================================================================
// LLM ÇAĞRISI
// ============================================================================

async function callLLM(prompt: string): Promise<string> {
  const res = await fetch(Z_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Z_API_KEY}`,
    },
    body: JSON.stringify({
      model: Z_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LLM API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content
}

// ============================================================================
// LLM ile GRUPLAMA
// ============================================================================

async function getLLMMappings(
  orphans: CategoryRow[],
  allCategories: CategoryRow[]
): Promise<Record<string, string>> {
  const roots = allCategories.filter((c) => !c.parentId)
  const l1s = allCategories.filter((c) => {
    if (!c.parentId) return false
    const parent = allCategories.find((p) => p.id === c.parentId)
    return parent && !parent.parentId
  })

  const rootList = roots
    .map((c) => `  - "${c.name}" (id: ${c.id}, slug: ${c.slug})`)
    .join("\n")

  const l1List = l1s
    .map((c) => {
      const parent = allCategories.find((p) => p.id === c.parentId)
      return `  - "${c.name}" (parent: "${parent?.name}", id: ${c.id})`
    })
    .join("\n")

  const orphanList = orphans
    .map((c) => `  - "${c.name}" (id: ${c.id}, depth: ${c.depth}, slug: ${c.slug})`)
    .join("\n")

  const prompt = `Sen bir e-ticaret kategori uzmanısın. Aşağıdaki kategorilerin hangi parent kategori altına girmesi gerektiğini belirle.

## Mevcut Root Kategoriler (L0):
${rootList}

## Mevcut L1 Kategoriler (örnekler):
${l1List}

## Parent'sız Kalan Kategoriler (bunları yerleştirmem lazım):
${orphanList}

## Görev:
Her parent'sız kategori için EN UYGUN parent kategoriyi belirle.
- Fiber ile ilgili kategoriler → "Ağ ve Network Ürünleri" altındaki "Fiber Ürünler" L1 kategorisine (id: b1000000-0000-4000-8000-000000000002)
- Network/Switch/Access Point → "Ağ ve Network Ürünleri" altındaki "Ağ İletişim Ürünleri" veya "Switch Ürünleri" L1'e
- Kablo kategorileri → uygun parent'a
- Barkod okuyucular → "OT/VT Barkod & PDKS" altındaki "Barkod Okuyucular"a
- Bellekler (Masaüstü/Notebook) → "Bilgisayar Bileşenleri" altındaki "Bellekler"e
- Harddiskler (Sata/Notebook/Taşınabilir) → "Bilgisayar Bileşenleri" altındaki "Harddiskler"e
- İş İstasyonları → "Sunucu ve Donanımları" altındaki "İş İstasyonları"na
- Lisans kategorileri → "Yazılım ve Lisanslar" altındaki uygun L1'e
- Güvenlik ile ilgili → "Güvenlik Ürünleri" altına
- Bağlantı Ekipmanları → "Ağ ve Network Ürünleri" altına

SADECE JSON döndür, başka açıklama yazma:
{
  "kategori_id": "parent_kategori_id",
  ...
}

Mevcut L1 ID'leri:
- Ağ İletişim Ürünleri: b1000000-0000-4000-8000-000000000001
- Ağ Kabloları: b1000000-0000-4000-8000-000000000000
- Fiber Ürünler: b1000000-0000-4000-8000-000000000002
- Network Sarf: b1000000-0000-4000-8000-000000000003
- Switch Ürünleri: b1000000-0000-4000-8000-000000000004
- Barkod Okuyucular (OT/VT): b0d65c56-5c11-4e9f-83a4-c15f48b75741
- Bellekler: 858556bb-7e34-4938-b9e1-7d4640d68c7f
- Harddiskler: eab4c3b3-0dd5-4ef7-b1fb-f5bb3b60b9e6
- İş İstasyonları (Sunucu): 90df25b4-0e4c-411e-aae8-eab1f39ab694
- Antivirüs Yazılımları: a0000000-0000-4000-8000-000000000000
- Ofis Yazılımları: a0000000-0000-4000-8000-000000000002
- Sunucu Lisansları: a0000000-0000-4000-8000-000000000003
- Güvenlik Aksesuarları: ad86c758-e2a0-40b1-a3ae-9e4a8b74c1e7
- Kameralar (Güvenlik): 58df7e12-9ac4-4c36-9a40-65b0f56a0a54`

  console.log("\nLLM'e istek gönderiliyor...")
  const response = await callLLM(prompt)
  console.log("LLM yanıtı alındı.")

  // JSON parse
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("LLM JSON döndürmedi: " + response.slice(0, 500))
  }

  return JSON.parse(jsonMatch[0]) as Record<string, string>
}

// ============================================================================
// PATH ve DEPTH HESAPLAMA
// ============================================================================

async function recalculateSubtree(
  categoryId: string,
  catMap: Map<string, CategoryRow>
): Promise<void> {
  const cat = catMap.get(categoryId)
  if (!cat) return

  const parent = cat.parentId ? catMap.get(cat.parentId) : null
  const newDepth = parent ? parent.depth + 1 : 0
  const newPath = parent ? `${parent.path}/${cat.slug}` : cat.slug

  if (cat.depth !== newDepth || cat.path !== newPath) {
    if (!DRY_RUN) {
      await prisma.category.update({
        where: { id: categoryId },
        data: { depth: newDepth, path: newPath },
      })
    }
    cat.depth = newDepth
    cat.path = newPath
  }

  // Alt kategorileri de güncelle
  const children = [...catMap.values()].filter((c) => c.parentId === categoryId)
  for (const child of children) {
    await recalculateSubtree(child.id, catMap)
  }
}

// ============================================================================
// ANA FONKSİYON
// ============================================================================

async function main() {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`Kategori Hiyerarşi Düzeltme Scripti`)
  console.log(`Mod: ${DRY_RUN ? "DRY-RUN (değişiklik yok)" : "EXECUTE (gerçek güncelleme)"}`)
  console.log("=".repeat(60))

  // Tüm kategorileri yükle
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, parentId: true, depth: true, slug: true, path: true },
    orderBy: [{ depth: "asc" }, { name: "asc" }],
  })

  const catMap = new Map(categories.map((c) => [c.id, c as CategoryRow]))

  // ============================================================================
  // PHASE 1: Manuel bilinen düzeltmeler (LLM'e gerek yok)
  // ============================================================================

  console.log("\n--- PHASE 1: Bilinen Düzeltmeler ---")

  // Gerçek parent ID'lerini veritabanından al
  const ağKabloları = categories.find((c) => c.slug === "ag-kablolari")
  const fiberUrunler = categories.find((c) => c.slug === "fiber-urunler")
  const ağIletisim = categories.find((c) => c.slug === "ag-iletisim-urunleri")
  const switchUrunler = categories.find((c) => c.slug === "switch-urunleri")
  const networkSarf = categories.find((c) => c.slug === "network-sarf")
  const barkodOkuyucular = categories.find((c) => c.slug === "barkod-okuyucular-1")
  const bellekler = categories.find((c) => c.slug === "bellekler-1")
  const harddiskler = categories.find((c) => c.slug === "harddiskler-1")
  const isIstasyonlari = categories.find((c) => c.slug === "i-s-i-stasyonlari")
  const yazilimVeLisanslar = categories.find((c) => c.slug === "yazilim-ve-lisanslar")
  const bilgisayarBilesenleri = categories.find((c) => c.slug === "bilgisayar-bilesenleri-1")
  const guvenlikUrunleri = categories.find((c) => c.slug === "guvenlik-urunleri")
  const kameralar = categories.find((c) => c.slug === "kameralar")
  const guvenlikAksesuarlari = categories.find((c) => c.slug === "guvenlik-aksesuarlari-1")
  const ağVeNetwork = categories.find((c) => c.slug === "ag-ve-network-urunleri")
  const networkUrunleri = categories.find((c) => c.slug === "network-urunleri")
  const ofisYazilimlari = categories.find((c) => c.slug === "ofis-yazilimlari")
  const sunucuLisanslari = categories.find((c) => c.slug === "sunucu-lisanslari")
  const antivirusYazilimlari = categories.find((c) => c.slug === "antivirüs-yazilimlari")

  // Düzeltme operasyonları listesi
  const operations: MoveOperation[] = []

  function addMove(
    catSlug: string,
    newParent: CategoryRow | undefined,
    reason: string
  ) {
    const cat = categories.find((c) => c.slug === catSlug)
    if (!cat) {
      console.warn(`  UYARI: slug="${catSlug}" kategorisi bulunamadı, atlanıyor`)
      return
    }
    if (!newParent) {
      console.warn(`  UYARI: "${cat.name}" için hedef parent bulunamadı, atlanıyor`)
      return
    }
    operations.push({
      categoryId: cat.id,
      categoryName: cat.name,
      newParentId: newParent.id,
      newParentName: newParent.name,
      oldParentId: cat.parentId,
      reason,
    })
  }

  // --- Fiber kategoriler → Fiber Ürünler (Ağ ve Network altında) ---
  if (fiberUrunler) {
    addMove("fiber-adaptorler-1", fiberUrunler, "Fiber donanım → Fiber Ürünler altına")
    addMove("fiber-converter-1", fiberUrunler, "Fiber converter → Fiber Ürünler altına")
    addMove("fiber-kablolar", fiberUrunler, "Fiber kablo → Fiber Ürünler altına")
    addMove("fiber-patch-kablo-1", fiberUrunler, "Fiber patch kablo → Fiber Ürünler altına")
    addMove("fiber-patch-paneller-1", fiberUrunler, "Fiber patch paneller → Fiber Ürünler altına")
    addMove("fiber-pigtail-1", fiberUrunler, "Fiber pigtail → Fiber Ürünler altına")
  }

  // --- Kablo kategorileri → Ağ Kabloları ---
  if (ağKabloları) {
    addMove("cat6-utp-ftp-kablolar", ağKabloları, "CAT6 kablo → Ağ Kabloları altına")
    addMove("cctv-kablolar", ağKabloları, "CCTV kablo → Ağ Kabloları altına")
    addMove("data-kablolari-ka", ağKabloları, "Data kabloları → Ağ Kabloları altına")
    addMove("guc-kablolari-ka", ağKabloları, "Güç kabloları → Ağ Kabloları altına")
  }

  // --- Ağ İletişim → Access Point, Kablosuz ---
  if (ağIletisim) {
    addMove("access-point-ve-router-1", ağIletisim, "Access Point → Ağ İletişim altına")
    addMove("kablosuz-usb-adaptor-1", ağIletisim, "Kablosuz USB Adaptör → Ağ İletişim altına")
    addMove("kablosuz-pci-kart-1", ağIletisim, "Kablosuz PCI Kart → Ağ İletişim altına")
    addMove("baglanti-ekipmanlari", ağIletisim, "Bağlantı Ekipmanları → Ağ İletişim altına")
  }

  // --- Güvenlik kategorileri ---
  if (kameralar) {
    addMove("ahd-hd-tvi-kameralar", kameralar, "AHD/TVI Kamera → Kameralar altına")
  }
  if (guvenlikAksesuarlari) {
    addMove("guvenlik-adaptorleri", guvenlikAksesuarlari, "Güvenlik Adaptörleri → Güvenlik Aksesuarları altına")
  }

  // --- Barkod Okuyucular ---
  if (barkodOkuyucular) {
    addMove("el-tipi-barkod-okuyucular", barkodOkuyucular, "El Tipi Barkod → Barkod Okuyucular altına")
    addMove("karekod-2d-barkod-okuyucular", barkodOkuyucular, "Karekod 2D → Barkod Okuyucular altına")
    addMove("masaustu-barkod-okuyucular", barkodOkuyucular, "Masaüstü Barkod → Barkod Okuyucular altına")
  }

  // --- Bellekler alt tipleri ---
  if (bellekler) {
    addMove("masaustu-bellekler", bellekler, "Masaüstü Bellekler → Bellekler altına")
    addMove("notebook-bellekler", bellekler, "Notebook Bellekler → Bellekler altına")
  }

  // --- Harddiskler alt tipleri ---
  if (harddiskler) {
    addMove("ssd-diskler", harddiskler, "SSD Diskler → Harddiskler altına")
    addMove("sata-harddiskler", harddiskler, "Sata Harddiskler → Harddiskler altına")
    addMove("tasinabilir-hdd", harddiskler, "Taşınabilir HDD → Harddiskler altına")
    addMove("tasinabilir-ssd", harddiskler, "Taşınabilir SSD → Harddiskler altına")
    addMove("notebook-harddiskleri", harddiskler, "Notebook Harddiskleri → Harddiskler altına")
  }

  // --- İş İstasyonları ---
  if (isIstasyonlari) {
    addMove("masaustu-is-istasyonlari", isIstasyonlari, "Masaüstü İş İstasyonları → İş İstasyonları altına")
    addMove("mobil-is-istasyonlari", isIstasyonlari, "Mobil İş İstasyonları → İş İstasyonları altına")
  }

  // --- Yazılım/Lisans kategorileri ---
  if (ofisYazilimlari) {
    addMove("esd-online-lisans-1", ofisYazilimlari, "ESD Online Lisans → Ofis Yazılımları altına")
    addMove("kutu-lisans-1", ofisYazilimlari, "Kutu Lisans → Ofis Yazılımları altına")
  }

  // --- Kurumsal → Kurumsal Ürünler ---
  if (categories.find((c) => c.slug === "kurumsal-urunler")) {
    addMove("kurumsal", categories.find((c) => c.slug === "kurumsal-urunler")!, "Kurumsal → Kurumsal Ürünler altına")
  }

  // --- SORUN 2: depth uyumsuzluğu düzeltmeleri ---
  // Power Supply: parent=Bilgisayar Bileşenleri (depth=0) ama depth=2 → depth=1 olmalı
  // Bu depth recalculation adımında otomatik düzelecek

  // Akü ve Elektrik Aksesuarları: parent=Kesintisiz Güç Kaynakları (depth=1) ama depth=1
  // → depth=2 olmalı, bu da recalculation ile düzelecek

  // ============================================================================
  // ÖZET YAZDIRMA
  // ============================================================================

  console.log(`\nToplam ${operations.length} taşıma operasyonu planlandı:\n`)

  const byTarget = new Map<string, MoveOperation[]>()
  for (const op of operations) {
    const key = op.newParentName
    if (!byTarget.has(key)) byTarget.set(key, [])
    byTarget.get(key)!.push(op)
  }

  for (const [target, ops] of byTarget) {
    console.log(`  → ${target}:`)
    ops.forEach((op) => {
      const oldParentName = op.oldParentId
        ? catMap.get(op.oldParentId)?.name ?? "PARENT_YOK(root)"
        : "ROOT"
      console.log(`      [${op.categoryId.slice(0, 8)}] "${op.categoryName}" (eskiden: ${oldParentName})`)
    })
  }

  // ============================================================================
  // EXECUTE
  // ============================================================================

  if (DRY_RUN) {
    console.log("\n[DRY-RUN] Değişiklik yapılmadı. --execute ile çalıştırın.")
  } else {
    console.log("\n--- Kategoriler güncelleniyor ---")

    for (const op of operations) {
      await prisma.category.update({
        where: { id: op.categoryId },
        data: { parentId: op.newParentId },
      })

      // CatMap'i güncelle
      const cat = catMap.get(op.categoryId)
      if (cat) cat.parentId = op.newParentId

      console.log(`  ✓ "${op.categoryName}" → "${op.newParentName}"`)
    }

    // ============================================================================
    // PATH ve DEPTH YENİDEN HESAPLAMA
    // ============================================================================

    console.log("\n--- Path ve depth yeniden hesaplanıyor ---")

    // Güncel veriyi yeniden yükle
    const updatedCategories = await prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, parentId: true, depth: true, slug: true, path: true },
    })
    const updatedMap = new Map(updatedCategories.map((c) => [c.id, c as CategoryRow]))

    const roots = updatedCategories.filter((c) => !c.parentId)
    for (const root of roots) {
      await recalculateSubtree(root.id, updatedMap)
    }

    console.log("  ✓ Tüm path ve depth değerleri güncellendi")
  }

  // ============================================================================
  // DOĞRULAMA
  // ============================================================================

  console.log("\n--- Doğrulama ---")

  const afterCategories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, parentId: true, depth: true, slug: true, path: true },
  })

  const afterMap = new Map(afterCategories.map((c) => [c.id, c]))

  // Hâlâ orphan var mı?
  const stillOrphan = afterCategories.filter((c) => c.depth >= 1 && !c.parentId)
  console.log(`  Hâlâ parent'sız (depth>=1): ${stillOrphan.length}`)
  stillOrphan.forEach((c) => console.log(`    - [d${c.depth}] "${c.name}" (${c.slug})`))

  // Depth uyumsuzluğu var mı?
  const depthMismatch = afterCategories.filter((c) => {
    if (!c.parentId) return false
    const parent = afterMap.get(c.parentId)
    if (!parent) return false
    return c.depth !== parent.depth + 1
  })
  console.log(`  Depth uyumsuzluğu: ${depthMismatch.length}`)
  depthMismatch.forEach((c) => {
    const parent = afterMap.get(c.parentId!)
    console.log(`    - "${c.name}" depth=${c.depth} parent="${parent?.name}" depth=${parent?.depth}`)
  })

  // Kategori sayıları
  const depthCounts = new Map<number, number>()
  afterCategories.forEach((c) => depthCounts.set(c.depth, (depthCounts.get(c.depth) || 0) + 1))
  console.log("\n  Depth dağılımı:")
  ;[...depthCounts.entries()].sort().forEach(([d, count]) => {
    console.log(`    L${d}: ${count} kategori`)
  })

  await pool.end()
  console.log("\nScript tamamlandı.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
