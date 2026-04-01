// ============================================================================
// Tool: Customer Info
// ============================================================================
import { prisma } from "@/lib/db";
import type { ConversationContext } from "../types";

export async function getCustomerInfo(
  context: ConversationContext,
): Promise<string> {
  if (!context.customerId) {
    return "Müşteri tanınamadı. WhatsApp numarası bayi kayıtlarımızda bulunmuyor. Bayi başvurusu yapmak için https://nexadepo.com adresini ziyaret edebilirsiniz.";
  }

  const customer = await prisma.customer.findUnique({
    where: { id: context.customerId },
    select: {
      companyName: true,
      dealerCode: true,
      contactName: true,
      phone: true,
      email: true,
      city: true,
      status: true,
      balance: true,
      creditLimit: true,
      discountRate: true,
      lastOrderAt: true,
    },
  });

  if (!customer) {
    return "Müşteri bilgisi bulunamadı.";
  }

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: { customerId: context.customerId },
    select: {
      orderNumber: true,
      status: true,
      grandTotal: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const statusMap: Record<string, string> = {
    PENDING: "⏳ Bekliyor",
    CONFIRMED: "✅ Onaylandı",
    PREPARING: "📦 Hazırlanıyor",
    SHIPPED: "🚚 Kargoda",
    DELIVERED: "✔️ Teslim Edildi",
    CANCELLED: "❌ İptal",
    RETURNED: "🔄 İade",
  };

  const customerStatusMap: Record<string, string> = {
    PENDING: "⏳ Onay Bekliyor",
    APPROVED: "✅ Onaylı",
    REJECTED: "❌ Reddedildi",
    SUSPENDED: "⏸️ Askıda",
    BLACKLISTED: "🚫 Karaliste",
  };

  let result = `🏢 Firma: ${customer.companyName}\n` +
    `🔢 Bayi Kodu: ${customer.dealerCode}\n` +
    `👤 Yetkili: ${customer.contactName ?? "-"}\n` +
    `📞 Tel: ${customer.phone ?? "-"}\n` +
    `📧 E-posta: ${customer.email ?? "-"}\n` +
    `📍 Şehir: ${customer.city ?? "-"}\n` +
    `📋 Durum: ${customerStatusMap[customer.status] ?? customer.status}\n` +
    `💰 Cari Bakiye: ${Number(customer.balance).toFixed(2)} TL\n` +
    `💳 Kredi Limiti: ${Number(customer.creditLimit).toFixed(2)} TL\n` +
    `🏷️ Ek İskonto: %${Number(customer.discountRate).toFixed(1)}`;

  if (recentOrders.length > 0) {
    result += `\n\n📜 Son Siparişler:\n` +
      recentOrders.map((o) =>
        `• ${o.orderNumber} — ${statusMap[o.status] ?? o.status} — ${Number(o.grandTotal).toFixed(2)} TL (${new Date(o.createdAt).toLocaleDateString("tr-TR")})`
      ).join("\n");
  }

  return result;
}
