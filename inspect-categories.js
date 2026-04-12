const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 1. VERİTABANINDAKİ KATEGORİLER ===\n');
  
  try {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      include: { parent: true },
      orderBy: [{ depth: 'asc' }, { path: 'asc' }],
      take: 100
    });

    console.log(`Toplam aktif kategori: ${categories.length}\n`);
    console.table(categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      depth: c.depth,
      parent_id: c.parentId,
      parent_name: c.parent?.name || '-',
      is_active: c.isActive,
      path: c.path
    })));

  } catch (e) {
    console.error('Hata:', e.message);
  }

  console.log('\n=== 2. DUPLICATE KONTROL ===\n');
  
  try {
    const duplicates = await prisma.$queryRaw`
      SELECT name, "parentId", COUNT(*) as adet
      FROM "Category"
      WHERE "deletedAt" IS NULL
      GROUP BY name, "parentId"
      HAVING COUNT(*) > 1;
    `;

    if (duplicates.length === 0) {
      console.log('✓ Duplicate kategori yok');
    } else {
      console.log(`⚠ ${duplicates.length} duplicate grup bulundu:\n`);
      console.table(duplicates);
    }
  } catch (e) {
    console.error('Hata:', e.message);
  }

  console.log('\n=== 3. SUPPLIER CATEGORY MAP DURUMU ===\n');
  
  try {
    const maps = await prisma.$queryRaw`
      SELECT 
        supplier_code,
        COUNT(*) as toplam_eslestirme,
        COUNT(category_id) as eslestirilen,
        COUNT(*) - COUNT(category_id) as eslestirilen_yok
      FROM "SupplierCategoryMap"
      GROUP BY supplier_code
      ORDER BY toplam_eslestirme DESC;
    `;

    console.log(`Toplam supplier code: ${maps.length}\n`);
    console.table(maps);
  } catch (e) {
    console.error('Hata:', e.message);
  }

  console.log('\n=== 4. KATEGORİSİZ ÜRÜN SAYISI ===\n');
  
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as kategorisiz_urun 
      FROM "Product" 
      WHERE "categoryId" IS NULL AND "deletedAt" IS NULL;
    `;

    console.table(result);
  } catch (e) {
    console.error('Hata:', e.message);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
