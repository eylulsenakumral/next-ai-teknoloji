// ============================================================================
// Tool: Product Search — Prisma query for Product + SupplierProduct JOIN
// ============================================================================
import { prisma } from "@/lib/db";

export async function searchProducts(
  query: string,
  limit: number = 5,
): Promise<string> {
  const normalized = query.trim().toLowerCase();

  // Search by name, slug, barcode, SKU, or brand name
  const products = await prisma.product.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: normalized, mode: "insensitive" } },
            { slug: { contains: normalized, mode: "insensitive" } },
            { barcode: { contains: query.trim() } },
            { sku: { contains: query.trim(), mode: "insensitive" } },
            { brand: { name: { contains: normalized, mode: "insensitive" } } },
          ],
        },
        { isActive: true },
        { deletedAt: null },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      barcode: true,
      sku: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      supplierProducts: {
        where: { isAvailable: true, deletedAt: null },
        select: {
          id: true,
          purchasePrice: true,
          currency: true,
          stockQuantity: true,
          supplier: { select: { name: true, code: true } },
        },
        orderBy: { purchasePrice: "asc" },
        take: 1,
      },
    },
    take: limit,
  });

  if (products.length === 0) {
    return `"${query}" için ürün bulunamadı. Farklı bir arama terimi deneyebilir misiniz?`;
  }

  const results = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand?.name,
    category: p.category?.name,
    barcode: p.barcode,
    sku: p.sku,
    bestSupplier: p.supplierProducts[0]
      ? {
          supplier: p.supplierProducts[0].supplier.name,
          purchasePrice: p.supplierProducts[0].purchasePrice,
          currency: p.supplierProducts[0].currency,
          stock: p.supplierProducts[0].stockQuantity,
        }
      : null,
  }));

  // Format as readable text for the AI
  const text = results
    .map(
      (r, i) =>
        `${i + 1}. ${r.name}${r.brand ? ` — ${r.brand}` : ""}${r.category ? ` (${r.category})` : ""}` +
        (r.bestSupplier
          ? `\n   Stok: ${r.bestSupplier.stock} adet`
          : "\n   Stok bilgisi mevcut değil"),
    )
    .join("\n\n");

  return `Ürün arama sonuçları ("${query}):\n\n${text}\n\nFiyat detayı için "inquiry_price", stok kontrolü için "check_stock" tool'unu kullan.`;
}
