import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  // 1. Toplam ürün sayıları
  const stats = await prisma.supplierProduct.groupBy({
    by: ['supplierId'],
    _count: { id: true },
    where: { deletedAt: null }
  })

  console.log('\n=== SUPPLIER ISTATISTIKLERI ===')
  for (const stat of stats) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: stat.supplierId },
      select: { code: true, name: true }
    })
    console.log(`${supplier?.code}: ${stat._count.id} ürün`)
  }

  // 2. Örnek rawData yapısı
  console.log('\n=== ORNEK RAW_DATA ===')
  const samples = await prisma.supplierProduct.findMany({
    where: { deletedAt: null },
    select: { supplier: { select: { code: true } }, rawData: true },
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
  const mappings = await prisma.supplierCategoryMap.groupBy({
    by: ['supplierCode'],
    _count: { id: true }
  })
  
  for (const m of mappings) {
    console.log(`${m.supplierCode}: ${m._count.id} mapping`)
  }

} catch (error) {
  console.error('Error:', error.message)
} finally {
  await prisma.$disconnect()
}
