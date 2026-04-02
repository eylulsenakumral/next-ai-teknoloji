// ============================================================================
// Tool: Get Categories — Kategori Listesi
// ============================================================================
import { prisma } from "@/lib/db";

export async function getCategories(): Promise<string> {
  const categories = await prisma.category.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, depth: true, parentId: true },
  });

  if (categories.length === 0) {
    return "Henüz kategori bulunmuyor.";
  }

  // Kategorileri grupla
  const categoryList = categories.map((c) => `• ${c.name}`).join("\n");

  return (
    `📂 *ÜRÜN KATEGORİLERİ*\n\n` +
    categoryList +
    `\n\nHangisini incelemek istersiniz?`
  );
}