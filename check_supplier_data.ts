import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // 1. Toplam ürün sayıları
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null }
    })

    console.log('\n=== SUPPLIER ISTATISTIKLERI ===')
    for (const supplier of suppliers) {
      const count = await prisma.supplierProduct.count({
        where: { supplierId: supplier.id, deletedAt: null }
      })
      console.log(`${supplier.code}: ${count} ürün`)
    }

    // 2. Örnek rawData yapısı
    console.log('\n=== ORNEK RAW_DATA ===')
    const samples = await prisma.supplierProduct.findMany({
      where: { deletedAt: null },
      include: { supplier: { select: { code: true } } },
      take: 2
    })

    for (const sp of samples) {
      if (sp.rawData) {
        console.log(`\nSupplier: ${sp.supplier.code}`)
        console.log('rawData keys:', Object.keys(sp.rawData).slice(0, 20))
      }
    }

    // 3. SupplierCategoryMap tablosundaki veriler
    console.log('\n=== EXISTING MAPPINGS ===')
    const mappings = await prisma.supplierCategoryMap.findMany()
    const bySupplier = new Map<string, number>()
    
    for (const m of mappings) {
      bySupplier.set(m.supplierCode, (bySupplier.get(m.supplierCode) || 0) + 1)
    }
    
    for (const [code, count] of bySupplier.entries()) {
      console.log(`${code}: ${count} mapping`)
    }

  } catch (error) {
    console.error('Error:', (error as Error).message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
