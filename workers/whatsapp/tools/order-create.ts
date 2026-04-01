// ============================================================================
// Tool: Order Creation
// ============================================================================
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ConversationContext } from "../types";

export async function createOrder(
  items: Array<{
    productId: string;
    supplierProductId?: string;
    quantity: number;
  }>,
  notes?: string,
  context?: ConversationContext,
): Promise<string> {
  if (!context?.customerId) {
    return "❌ Sipariş oluşturulamadı: Müşteri tanınamadı. WhatsApp numaranız bayi kayıtlarımızda bulunmuyor.";
  }

  // Verify customer is approved
  const customer = await prisma.customer.findUnique({
    where: { id: context.customerId },
    select: { id: true, companyName: true, dealerCode: true, status: true },
  });

  if (!customer) {
    return "❌ Müşteri bulunamadı.";
  }

  if (customer.status !== "APPROVED") {
    return `❌ Sipariş oluşturulamadı: Hesabınız henüz onaylanmamış (${customer.status}). Lütfen yöneticimizle iletişime geçin.`;
  }

  // Build order items with price data
  const orderItemsData: Array<{
    productId: string;
    supplierProductId?: string;
    productName: string;
    productBarcode?: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    vatRate: Prisma.Decimal;
    purchasePrice?: Prisma.Decimal;
    profitMarginPct?: Prisma.Decimal;
  }> = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: {
        name: true,
        barcode: true,
        supplierProducts: {
          where: { isAvailable: true, deletedAt: null },
          select: {
            id: true,
            purchasePrice: true,
            currency: true,
            vatRate: true,
            stockQuantity: true,
          },
          orderBy: { purchasePrice: "asc" },
          take: 1,
        },
      },
    });

    if (!product) {
      return `❌ Ürün bulunamadı: ${item.productId}`;
    }

    const supplierProduct = item.supplierProductId
      ? product.supplierProducts.find((sp) => sp.id === item.supplierProductId)
      : product.supplierProducts[0];

    if (!supplierProduct?.purchasePrice) {
      return `❌ "${product.name}" için fiyat bilgisi bulunamadı.`;
    }

    if (supplierProduct.stockQuantity < item.quantity) {
      return `❌ "${product.name}" için yeterli stok yok. Mevcut stok: ${supplierProduct.stockQuantity}, Talep: ${item.quantity}`;
    }

    // Get margin
    let marginPct = new Prisma.Decimal(30);
    const margin = await prisma.profitMargin.findFirst({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { scope: "GLOBAL", scopeId: null },
          { scope: "PRODUCT", scopeId: item.productId },
        ],
      },
      orderBy: [{ scope: "asc" }, { priority: "desc" }],
      select: { scope: true, marginPct: true },
    });

    if (margin) {
      const specific = margin.scope !== "GLOBAL" ? margin : null;
      if (specific) marginPct = specific.marginPct;
      else if (margin.scope === "GLOBAL") marginPct = margin.marginPct;
    }

    const purchasePrice = supplierProduct.purchasePrice;
    const salePrice = purchasePrice.mul(marginPct.div(100).plus(1));
    const vatRate = supplierProduct.vatRate ?? new Prisma.Decimal(20);

    orderItemsData.push({
      productId: item.productId,
      supplierProductId: supplierProduct.id,
      productName: product.name,
      productBarcode: product.barcode ?? undefined,
      quantity: item.quantity,
      unitPrice: salePrice,
      vatRate,
      purchasePrice,
      profitMarginPct: marginPct,
    });
  }

  // Calculate totals
  let subtotal = new Prisma.Decimal(0);
  let vatTotal = new Prisma.Decimal(0);
  let grandTotal = new Prisma.Decimal(0);

  const formattedItems = orderItemsData.map((item) => {
    const lineSubtotal = item.unitPrice.mul(item.quantity);
    const lineVat = lineSubtotal.mul(item.vatRate.div(100));
    const lineTotal = lineSubtotal.plus(lineVat);

    subtotal = subtotal.plus(lineSubtotal);
    vatTotal = vatTotal.plus(lineVat);
    grandTotal = grandTotal.plus(lineTotal);

    return {
      ...item,
      lineSubtotal,
      lineVat,
      lineTotal,
    };
  });

  // Generate order number
  const lastOrder = await prisma.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const nextNum = lastOrder
    ? parseInt(lastOrder.orderNumber.replace("NAT-", ""), 10) + 1
    : 1;
  const orderNumber = `NAT-${String(nextNum).padStart(6, "0")}`;

  // Create order
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      orderNumber,
      status: "PENDING",
      subtotal,
      vatTotal,
      grandTotal,
      currency: "TRY",
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PENDING",
      notes: notes ?? `WhatsApp üzerinden oluşturuldu`,
      orderItems: {
        create: formattedItems.map((item) => ({
          productId: item.productId,
          supplierProductId: item.supplierProductId,
          productName: item.productName,
          productBarcode: item.productBarcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          lineSubtotal: item.lineSubtotal,
          lineVat: item.lineVat,
          lineTotal: item.lineTotal,
          purchasePrice: item.purchasePrice,
          profitMarginPct: item.profitMarginPct,
        })),
      },
    },
    select: { id: true, orderNumber: true, grandTotal: true },
  });

  return `✅ Sipariş oluşturuldu!\n\n` +
    `📋 Sipariş No: ${order.orderNumber}\n` +
    `🏢 Firma: ${customer.companyName} (${customer.dealerCode})\n\n` +
    `🛒 Ürünler:\n` +
    formattedItems.map((item, i) =>
      `${i + 1}. ${item.productName}\n   ${item.quantity} x ${item.unitPrice.toFixed(2)} TL = ${item.lineTotal.toFixed(2)} TL (KDV Dahil)`
    ).join("\n\n") +
    `\n\n💰 Ara Toplam: ${subtotal.toFixed(2)} TL\n` +
    `🧾 KDV: ${vatTotal.toFixed(2)} TL\n` +
    `📌 Toplam: ${grandTotal.toFixed(2)} TL\n\n` +
    `Siparişiniz alındı ve onay sürecine alınmıştır. Teşekkürler! 🙏`;
}
