/**
 * Duplicate Kategori Temizleme Scripti
 *
 * Aynı parentId + name kombinasyonuna sahip duplicate kategorileri bulur.
 * Her grup için en eskiyi (en küçük createdAt) "master" olarak tutar, diğerlerini siler.
 * Silinecek kategorilere bağlı ürünleri master kategoriye taşır.
 * SupplierCategoryMap'te silinen kategori ID'lerini master ID ile günceller.
 *
 * Kullanım:
 *   Dry run (önizleme):
 *   npx tsx scripts/cleanup-duplicate-categories.ts --dry-run
 *
 *   Gerçek temizlik:
 *   npx tsx scripts/cleanup-duplicate-categories.ts
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

// ============================================================================
// DB BAĞLANTISI (proje standardı)
// ============================================================================

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ============================================================================
// CLI BAYRAKLARI
// ============================================================================

const DRY_RUN = process.argv.includes("--dry-run")

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

function log(msg: string) {
  console.log(msg)
}

function logSection(title: string) {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`  ${title}`)
  console.log("=".repeat(60))
}

// ============================================================================
// DUPLICATE BULMA
// ============================================================================

interface DuplicateGroup {
  parentId: string | null
  name: string
  categories: Array<{
    id: string
    name: string
    slug: string
    parentId: string | null
    createdAt: Date
    productCount: number
    supplierMapCount: number
  }>
}

async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  // parentId + name kombinasyonunda 2+ kayıt olan grupları bul
  const duplicateKeys = await prisma.$queryRaw<
    Array<{ parent_id: string | null; name: string; cnt: bigint }>
  >`
    SELECT parent_id, name, COUNT(*) as cnt
    FROM categories
    WHERE deleted_at IS NULL
    GROUP BY parent_id, name
    HAVING COUNT(*) > 1
    ORDER BY name
  `

  if (duplicateKeys.length === 0) {
    return []
  }

  const groups: DuplicateGroup[] = []

  for (const key of duplicateKeys) {
    const categories = await prisma.category.findMany({
      where: {
        parentId: key.parent_id ?? null,
        name: key.name,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    })

    // Her kategori için ilişkili kayıt sayılarını çek
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await prisma.product.count({
          where: { categoryId: cat.id, deletedAt: null },
        })
        const supplierMapCount = await prisma.supplierCategoryMap.count({
          where: { categoryId: cat.id },
        })
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          parentId: cat.parentId,
          createdAt: cat.createdAt,
          productCount,
          supplierMapCount,
        }
      })
    )

    groups.push({
      parentId: key.parent_id ?? null,
      name: key.name,
      categories: enriched,
    })
  }

  return groups
}

// ============================================================================
// TEMİZLİK İŞLEMİ
// ============================================================================

interface CleanupStats {
  duplicateGroupsFound: number
  categoriesDeleted: number
  productsReassigned: number
  supplierMapsUpdated: number
}

async function cleanupGroup(
  group: DuplicateGroup,
  dryRun: boolean
): Promise<{ deleted: number; productsReassigned: number; supplierMapsUpdated: number }> {
  // İlk sıradaki (en eski createdAt) master olarak kalır
  const [master, ...duplicates] = group.categories

  log(`\n  Grup: "${group.name}" (parentId: ${group.parentId ?? "null"})`)
  log(`    Master  : ${master.id} | slug: ${master.slug} | createdAt: ${master.createdAt.toISOString()}`)

  let totalProductsMoved = 0
  let totalMapsMoved = 0

  for (const dup of duplicates) {
    log(`    Silinecek: ${dup.id} | slug: ${dup.slug} | ürün: ${dup.productCount} | supplierMap: ${dup.supplierMapCount}`)

    if (dryRun) {
      totalProductsMoved += dup.productCount
      totalMapsMoved += dup.supplierMapCount
      continue
    }

    // Transaction içinde tüm işlemleri yap
    await prisma.$transaction(async (tx) => {
      // 1) Ürünleri master'a taşı
      if (dup.productCount > 0) {
        await tx.product.updateMany({
          where: { categoryId: dup.id },
          data: { categoryId: master.id },
        })
        log(`      → ${dup.productCount} ürün master kategoriye taşındı`)
      }

      // 2) SupplierCategoryMap referanslarını güncelle
      if (dup.supplierMapCount > 0) {
        await tx.supplierCategoryMap.updateMany({
          where: { categoryId: dup.id },
          data: { categoryId: master.id },
        })
        log(`      → ${dup.supplierMapCount} supplierCategoryMap kaydı güncellendi`)
      }

      // 3) Alt kategorileri (çocukları) varsa master'a bağla
      const childCount = await tx.category.count({
        where: { parentId: dup.id, deletedAt: null },
      })
      if (childCount > 0) {
        await tx.category.updateMany({
          where: { parentId: dup.id },
          data: { parentId: master.id },
        })
        log(`      → ${childCount} alt kategori master'a bağlandı`)
      }

      // 4) Duplicate kategoriyi soft-delete yap
      await tx.category.update({
        where: { id: dup.id },
        data: { deletedAt: new Date() },
      })
      log(`      → Kategori soft-delete yapıldı`)
    })

    totalProductsMoved += dup.productCount
    totalMapsMoved += dup.supplierMapCount
  }

  return {
    deleted: duplicates.length,
    productsReassigned: totalProductsMoved,
    supplierMapsUpdated: totalMapsMoved,
  }
}

// ============================================================================
// ANA FONKSİYON
// ============================================================================

async function main() {
  logSection(DRY_RUN ? "DRY RUN - Duplicate Kategori Temizleme Önizlemesi" : "Duplicate Kategori Temizleme")

  if (DRY_RUN) {
    log("  [DRY RUN] Hiçbir değişiklik yapılmayacak, sadece rapor gösterilecek.\n")
  }

  // 1) Duplicate grupları bul
  log("Duplicate kategoriler taranıyor...")
  const groups = await findDuplicateGroups()

  if (groups.length === 0) {
    log("\nDuplicate kategori bulunamadı. Veritabanı temiz!")
    return
  }

  log(`\n${groups.length} duplicate grup bulundu.`)

  // 2) Her grubu işle
  const stats: CleanupStats = {
    duplicateGroupsFound: groups.length,
    categoriesDeleted: 0,
    productsReassigned: 0,
    supplierMapsUpdated: 0,
  }

  logSection("Duplicate Gruplar")

  for (const group of groups) {
    const result = await cleanupGroup(group, DRY_RUN)
    stats.categoriesDeleted += result.deleted
    stats.productsReassigned += result.productsReassigned
    stats.supplierMapsUpdated += result.supplierMapsUpdated
  }

  // 3) Özet raporu
  logSection("Özet Rapor")
  log(`  Duplicate grup sayısı  : ${stats.duplicateGroupsFound}`)
  log(`  Silinen kategori sayısı: ${stats.categoriesDeleted}`)
  log(`  Taşınan ürün sayısı    : ${stats.productsReassigned}`)
  log(`  Güncellenen map sayısı : ${stats.supplierMapsUpdated}`)

  if (DRY_RUN) {
    log(`\n  [DRY RUN] Gerçek temizlik için --dry-run olmadan çalıştırın:`)
    log(`  npx tsx scripts/cleanup-duplicate-categories.ts`)
  } else {
    log(`\n  Temizlik tamamlandı.`)
  }
}

main()
  .catch((err) => {
    console.error("Hata:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
