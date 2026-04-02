// ============================================================================
// Tool: Price Inquiry — Calculate sale price based on verification status
// ============================================================================
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ConversationContext } from "../types";

export async function inquiryPrice(
  productId?: string,
  productName?: string,
  context?: ConversationContext,
): Promise<string> {
  const isVerified = context?.isVerified ?? false;

  let product;

  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        barcode: true,
        sku: true,
        manualPrice: true,
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
        manualPrice: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
  }

  if (!product) {
    return "Ürün bulunamadı.";
  }

  // ---------------------------------------------------------------------------
  // DOĞRULANMIŞ BAYİ → BAYİ FİYATI (alış + marj)
  // ---------------------------------------------------------------------------
  if (isVerified) {
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
      `💰 *${product.name}*\n` +
      `${product.brand ? `🏷️ Marka: ${product.brand.name}\n` : ""}` +
      `📦 Stok: ${supplierProduct.stockQuantity} adet\n` +
      `\n🏪 *Bayi Fiyatı (KDV Dahil): ${salePriceVat.toFixed(2)} TL*\n` +
      `(KDV Hariç: ${salePriceNet.toFixed(2)} TL + %${vatRate} KDV)`
    );
  }

  // ---------------------------------------------------------------------------
  // DOĞRULANMAMIŞ → SON KULLANICI FİYATI (manualPrice veya marketPrice yoksa bilgi ver)
  // ---------------------------------------------------------------------------
  const displayPrice = product.manualPrice;

  if (!displayPrice) {
    return `💰 *${product.name}*\n\n` +
      `Bu ürün için son kullanıcı fiyatı belirlenmemiş.\n` +
      `Bayi fiyatlarını görmek için doğrulama yapabilirsiniz.\n` +
      `Komut: *DOĞRULA [bayi_kodu]*`;
  }

  return (
    `💰 *${product.name}*\n` +
    `${product.brand ? `🏷️ Marka: ${product.brand.name}\n` : ""}` +
    `\n👤 *Son Kullanıcı Fiyatı:* ${Number(displayPrice).toFixed(2)} TL (KDV Dahil)\n` +
    `\nℹ️ Not: Bayi misiniz? Özel fiyatlarımızı görmek için *DOĞRULA [bayi_kodu]* yazabilirsiniz.`
  );
}
