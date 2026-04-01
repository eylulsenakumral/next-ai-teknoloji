/**
 * Supplier Product Import Utility
 */

import { PrismaClient, ScraperType } from "@prisma/client"
import { CategoryMatcher } from "./category-matcher"

const prisma = new PrismaClient()

interface ImportProduct {
  productCode: string
  productName: string
  brand?: string
  categoryCode?: string
  categoryName?: string
  groupCode?: string
  groupName?: string
  imageUrl?: string
  specifications?: Record<string, string>
  stock?: number
  price?: number
  currency?: string
}

export class SupplierProductImporter {
  private categoryMatcher: CategoryMatcher

  constructor() {
    this.categoryMatcher = new CategoryMatcher()
  }

  async init() {
    await this.categoryMatcher.init()
  }

  /**
   * Supplier kaydını upsert et
   */
  async upsertSupplier(code: string, name: string, type: ScraperType = "API") {
    return await prisma.supplier.upsert({
      where: { code },
      create: {
        code,
        name,
        scraperType: type,
        isActive: true,
        syncIntervalMinutes: 360, // 6 saat
      },
      update: {
        name,
        scraperType: type,
      },
    })
  }

  /**
   * Brand'i upsert et
   */
  async upsertBrand(name: string) {
    if (!name) return null

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    return await prisma.brand.upsert({
      where: { slug },
      create: { name, slug },
      update: { name },
    })
  }

  /**
   * Ürünleri import et
   */
  async importProducts(
    supplierId: string,
    supplierCode: string,
    products: ImportProduct[]
  ) {
    console.log(`\n📦 ${products.length} ürün import ediliyor...`)

    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < products.length; i++) {
      const product = products[i]

      try {
        // Progress log (her 100 üründe)
        if ((i + 1) % 100 === 0) {
          console.log(`   ⏳ ${i + 1}/${products.length} işlendi...`)
        }

        // Kategori eşleştir
        let categoryId: string | null = null
        if (product.categoryName && product.groupName) {
          categoryId = await this.categoryMatcher.match(
            supplierCode,
            product.categoryName,
            product.groupName
          )
        }

        // Brand upsert
        let brandId: string | null = null
        if (product.brand) {
          const brand = await this.upsertBrand(product.brand)
          if (brand) brandId = brand.id
        }

        // SupplierProduct upsert
        const existing = await prisma.supplierProduct.findFirst({
          where: {
            supplierId,
            externalSku: product.productCode,
          },
        })

        const supplierProductData = {
          externalName: product.productName,
          externalSku: product.productCode,
          purchasePrice: product.price != null ? product.price : undefined,
          stockQuantity: product.stock ?? 0,
          currency: product.currency ?? "TRY",
          isAvailable: (product.stock ?? 0) > 0,
          rawData: {
            brandId,
            categoryId,
            imageUrl: product.imageUrl,
            specifications: product.specifications,
          } as any,
          lastScrapedAt: new Date(),
        }

        if (existing) {
          await prisma.supplierProduct.update({
            where: { id: existing.id },
            data: supplierProductData,
          })
          updated++
        } else {
          await prisma.supplierProduct.create({
            data: {
              supplierId,
              ...supplierProductData,
            },
          })
          created++
        }
      } catch (error) {
        errors.push(`${product.productCode}: ${error instanceof Error ? error.message : "Unknown error"}`)
        skipped++
      }
    }

    console.log(`\n✅ Import tamamlandı:`)
    console.log(`   📝 Yeni: ${created}`)
    console.log(`   🔄 Güncellenen: ${updated}`)
    console.log(`   ⏭️  Atlanan: ${skipped}`)
    if (errors.length > 0) {
      console.log(`   ❌ Hatalar: ${errors.length}`)
      errors.slice(0, 5).forEach((err) => console.log(`      - ${err}`))
    }

    return { created, updated, skipped, errors }
  }

  async disconnect() {
    await this.categoryMatcher.disconnect()
    await prisma.$disconnect()
  }
}
