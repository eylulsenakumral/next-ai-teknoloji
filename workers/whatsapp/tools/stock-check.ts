// ============================================================================
// Tool: Stock Check
// ============================================================================
import { prisma } from "@/lib/db";

export async function checkStock(
  productId?: string,
  productName?: string,
): Promise<string> {
  let product;

  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, brand: { select: { name: true } } },
    });
  } else if (productName) {
    product = await prisma.product.findFirst({
      where: {
        name: { contains: productName, mode: "insensitive" },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true, brand: { select: { name: true } } },
    });
  }

  if (!product) {
    return "Ürün bulunamadı.";
  }

  // Get all supplier stocks for this product
  const suppliers = await prisma.supplierProduct.findMany({
    where: {
      productId: product.id,
      isAvailable: true,
      deletedAt: null,
    },
    select: {
      supplier: { select: { name: true } },
      stockQuantity: true,
      currency: true,
      purchasePrice: true,
    },
    orderBy: { purchasePrice: "asc" },
  });

  if (suppliers.length === 0) {
    return `Ürün: ${product.name}${product.brand ? ` (${product.brand.name})` : ""}\nStok bilgisi bulunamadı.`;
  }

  const totalStock = suppliers.reduce((sum, s) => sum + s.stockQuantity, 0);
  const stockInfo = suppliers
    .map(
      (s) =>
        `• ${s.supplier.name}: ${s.stockQuantity} adet`,
    )
    .join("\n");

  return `📦 Ürün: ${product.name}${product.brand ? ` — ${product.brand.name}` : ""}\n\nStok Durumu:\n${stockInfo}\n\nToplam: ${totalStock} adet`;
}
