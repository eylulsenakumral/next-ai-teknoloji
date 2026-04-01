// ============================================================================
// Tool: Price Inquiry — Calculate sale price (purchase + margin)
// ============================================================================
import { prisma } from "@/lib/db";
import { Prisma, MarginScope } from "@prisma/client";
import type { ConversationContext } from "../types";

export async function inquiryPrice(
  productId?: string,
  productName?: string,
  context?: ConversationContext,
): Promise<string> {
  let product;

  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        barcode: true,
        sku: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
  } else if (productName) {
    product = await prisma.product.findFirst({
      where: {
        name: { contains: productName, mode: "insensitive" },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        barcode: true,
        sku: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
  }

  if (!product) {
    return "Ürün bulunamadı.";
  }

  const supplierProduct = await prisma.supplierProduct.findFirst({
    where: {
      productId: product.id,
      isAvailable: true,
      deletedAt: null,
      purchasePrice: { not: null },
    },
    select: {
      id: true,
      purchasePrice: true,
      currency: true,
      vatRate: true,
      stockQuantity: true,
      supplier: { select: { name: true } },
    },
    orderBy: { purchasePrice: "asc" },
  });

  if (!supplierProduct?.purchasePrice) {
    return `Ürün: ${product.name}\nFiyat bilgisi mevcut değil.`;
  }

  const purchasePrice = new Prisma.Decimal(supplierProduct.purchasePrice);
  const vatRate = supplierProduct.vatRate ?? new Prisma.Decimal(20);

  // --- Calculate margin (most specific wins) ---
  let marginPct = new Prisma.Decimal(30);

  const orConditions: Array<Prisma.ProfitMarginWhereInput> = [
    { scope: "GLOBAL" as const, scopeId: null },
    { scope: "PRODUCT" as const, scopeId: product.id },
  ];

  if (product.brand) {
    orConditions.push({ scope: "BRAND" as const, scopeId: product.brand.id });
  }
  if (product.category) {
    orConditions.push({ scope: "CATEGORY" as const, scopeId: product.category.id });
  }
  if (context?.customerId) {
    orConditions.push({ scope: "CUSTOMER" as const, scopeId: context.customerId });
  }

  const margins = await prisma.profitMargin.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: orConditions,
    },
    orderBy: [{ priority: "desc" }],
    select: { scope: true, scopeId: true, marginPct: true },
  });

  if (margins.length > 0) {
    // Find the most specific (non-GLOBAL) margin
    const specificity: Record<string, number> = {
      GLOBAL: 0,
      CATEGORY: 1,
      BRAND: 2,
      PRODUCT: 3,
      CUSTOMER: 4,
    };
    margins.sort((a, b) => (specificity[b.scope] ?? 0) - (specificity[a.scope] ?? 0));
    marginPct = margins[0].marginPct;
  }

  // Sale price = purchasePrice × (1 + marginPct/100)
  const multiplier = marginPct.div(100).plus(1);
  const salePriceNet = purchasePrice.mul(multiplier);
  const salePriceVat = salePriceNet.mul(vatRate.div(100).plus(1));

  return (
    `💰 Ürün: ${product.name}${product.brand ? ` — ${product.brand.name}` : ""}\n` +
    `📦 Stok: ${supplierProduct.stockQuantity} adet (${supplierProduct.supplier.name})\n` +
    `🏷️ Birim Fiyat (KDV Hariç): ${salePriceNet.toFixed(2)} TL\n` +
    `🧾 KDV (%${vatRate}): ${salePriceVat.minus(salePriceNet).toFixed(2)} TL\n` +
    `📌 Toplam Fiyat (KDV Dahil): ${salePriceVat.toFixed(2)} TL`
  );
}
