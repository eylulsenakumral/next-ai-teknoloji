// ============================================================================
// Tool: Product Search — Prisma query for Product + SupplierProduct JOIN
// ============================================================================
import { prisma } from "@/lib/db";

export async function searchProducts(
  query: string,
  limit: number = 5,
  includePrice: boolean = false,
): Promise<string> {
  const normalized = query.trim().toLowerCase();
  // Split into words for AND-based multi-word search
  const words = normalized.split(/\s+/).filter(w => w.length > 1);

  // Build OR conditions for each word (name, slug, barcode, sku, brand)
  const wordConditions = words.map(word => ({
    OR: [
      { name: { contains: word, mode: "insensitive" as const } },
      { slug: { contains: word, mode: "insensitive" as const } },
      { barcode: { contains: word } },
      { sku: { contains: word, mode: "insensitive" as const } },
      { brand: { name: { contains: word, mode: "insensitive" as const } } },
    ],
  }));

  // Search by name, slug, barcode, SKU, or brand name
  // Each word must match (AND), but can match any field (OR)
  const products = await prisma.product.findMany({
    where: {
      AND: [
        ...wordConditions,
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
          vatRate: true,
          supplier: { select: { name: true, code: true, marginRate: true } },
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

  const results = products.map((p) => {
    const sp = p.supplierProducts[0];
    return {
      id: p.id,
      name: p.name,
      brand: p.brand?.name,
      category: p.category?.name,
      barcode: p.barcode,
      sku: p.sku,
      bestSupplier: sp
        ? {
            supplier: sp.supplier.name,
            purchasePrice: sp.purchasePrice ? Number(sp.purchasePrice) : null,
            currency: sp.currency,
            stock: sp.stockQuantity,
            marginRate: Number(sp.supplier.marginRate),
            vatRate: sp.vatRate ? Number(sp.vatRate) : 20,
          }
        : null,
    };
  });

  // Format as readable text for the AI
  const text = results
    .map((r, i) => {
      let line =
        `${i + 1}. ${r.name}${r.brand ? ` — ${r.brand}` : ""}${r.category ? ` (${r.category})` : ""}`;
      if (r.bestSupplier) {
        line += `\n   Stok: ${r.bestSupplier.stock} adet`;
        if (includePrice && r.bestSupplier.purchasePrice !== null) {
          // Bayi satış fiyatı: alış × (1 + marj/100), KDV hariç
          const margin = r.bestSupplier.marginRate || 30;
          const saleExVat = r.bestSupplier.purchasePrice * (1 + margin / 100);
          const vat = r.bestSupplier.vatRate || 20;
          const saleIncVat = saleExVat * (1 + vat / 100);
          const cur = r.bestSupplier.currency || "USD";
          line += `\n   Bayi Fiyatı: ${saleIncVat.toFixed(2)} ${cur} (KDV dahil)`;
        }
      } else {
        line += "\n   Stok bilgisi mevcut değil";
      }
      return line;
    })
    .join("\n\n");

  const footer = includePrice
    ? "Yukarıdaki ürünler bayi fiyatları ile listelendi."
    : 'Fiyat detayı için "inquiry_price", stok kontrolü için "check_stock" tool\'unu kullan.';

  return `Ürün arama sonuçları ("${query}):\n\n${text}\n\n${footer}`;
}
