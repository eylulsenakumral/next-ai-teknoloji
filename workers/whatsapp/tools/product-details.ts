// ============================================================================
// Tool: Get Product Details — Ürün Detayları
// ============================================================================
import { prisma } from "@/lib/db";

export async function getProductDetails(
  productId?: string,
  productName?: string,
): Promise<string> {
  let product;

  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true,
        supplierProducts: {
          where: { isAvailable: true, deletedAt: null },
          include: { supplier: true },
          orderBy: { purchasePrice: "asc" },
        },

      },
    });
  } else if (productName) {
    product = await prisma.product.findFirst({
      where: {
        name: { contains: productName, mode: "insensitive" },
        isActive: true,
        deletedAt: null,
      },
      include: {
        brand: true,
        category: true,
        supplierProducts: {
          where: { isAvailable: true, deletedAt: null },
          include: { supplier: true },
          orderBy: { purchasePrice: "asc" },
        },

      },
    });
  }

  if (!product) {
    return "Ürün bulunamadı.";
  }

  // Ana tedarikçi ürünü
  const mainSupplier = product.supplierProducts[0];

  // Spesifikasyonları formatla
  let specsText = "";
  const specsArr = Array.isArray(product.specs) ? product.specs as { name: string; value: string }[] : [];
  if (specsArr.length > 0) {
    specsText = "\n📋 *TEKNİK ÖZELLİKLER:*\n";
    for (const spec of specsArr) {
      specsText += `• ${spec.name}: ${spec.value}\n`;
    }
  }

  // Stok bilgisi
  let stockText = "";
  if (mainSupplier) {
    stockText = `\n📦 *Stok:* ${mainSupplier.stockQuantity} adet (${mainSupplier.supplier.name})`;
  }

  // Ürün tipi (kategoriye göre)
  const categoryName = product.category?.name || "Ürün";

  let response = `🏷️ *${product.name}*\n`;
  if (product.brand) response += `Marka: ${product.brand.name}\n`;
  response += `Kategori: ${categoryName}`;
  if (product.barcode) response += `\nBarkod: ${product.barcode}`;
  if (product.sku) response += `\nSKU: ${product.sku}`;
  response += stockText;
  response += specsText;

  // Ürün tipine göre soru ekle
  const nameLower = product.name.toLowerCase();

  if (nameLower.includes("kamera") || nameLower.includes("ip kamera") || nameLower.includes("ahd")) {
    response += "\n\n❓ *Teknik Soru:* Bu kamerayı nereye monte edeceksiniz? (iç mekan / dış mekan)";
    response += "\n❓ Kablolu mu olacak, wifi mi tercih edersiniz?";
  } else if (nameLower.includes("kayıt") || nameLower.includes("nvr") || nameLower.includes("dvr")) {
    response += "\n\n❓ *Teknik Soru:* Kaç gün kayıt saklamak istiyorsunuz?";
    response += "\n❓ Kaç kamera bağlayacaksınız? (kanal sayısı)";
    response += "\n❓ Tek disk yeterli mi, yoksa RAID yapı mı?";
  } else if (nameLower.includes("switch") || nameLower.includes("network")) {
    response += "\n\n❓ *Teknik Soru:* Kaç cihaz bağlayacaksınız?";
    response += "\n❓ PoE gücü yeterli olmalı mı?";
  } else if (nameLower.includes("disk") || nameLower.includes("hdd") || nameLower.includes("ssd")) {
    response += "\n\n❓ *Teknik Soru:* Kayıt cihazına mı yoksa NAS'a mı kullanacaksınız?";
    response += "\n❓ Sürekli kayıt mı, hareket algılamalı mı?";
  }

  return response;
}