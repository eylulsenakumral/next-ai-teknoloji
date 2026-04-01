// ============================================================================
// WhatsApp Message Templates
// ============================================================================

export const TEMPLATES = {
  welcome(name: string): string {
    return `Merhaba ${name}! 👋\n\nNexaDepo WhatsApp satış asistanına hoş geldiniz.\n\nSize yardımcı olabileceğim konular:\n• 🔍 Ürün arama\n• 📦 Stok kontrolü\n• 💰 Fiyat bilgisi\n• 🛒 Sipariş oluşturma\n• 👤 Hesap bilgileriniz\n\nNasıl yardımcı olabilirim?`;
  },

  productInfo(product: {
    name: string;
    brand?: string;
    category?: string;
    price?: string;
    stock?: number;
  }): string {
    let msg = `📦 *${product.name}*`;
    if (product.brand) msg += `\n🏷️ Marka: ${product.brand}`;
    if (product.category) msg += `\n📂 Kategori: ${product.category}`;
    if (product.price) msg += `\n💰 Fiyat: ${product.price}`;
    if (product.stock !== undefined) msg += `\n📦 Stok: ${product.stock} adet`;
    return msg;
  },

  stockInfo(productName: string, totalStock: number, details: Array<{ supplier: string; stock: number }>): string {
    let msg = `📦 *${productName}* Stok Durumu\n\n`;
    msg += `Toplam: ${totalStock} adet\n\n`;
    msg += details.map((d) => `• ${d.supplier}: ${d.stock} adet`).join("\n");
    return msg;
  },

  orderConfirmation(orderNumber: string, total: string, itemCount: number): string {
    return `✅ *Sipariş Onaylandı!*\n\n📋 Sipariş No: ${orderNumber}\n🛒 Ürün Sayısı: ${itemCount}\n💰 Toplam: ${total} TL\n\nSiparişiniz işleme alınmıştır. Onay süreci hakkında bilgilendirileceksiniz.`;
  },

  help(): string {
    return `Size şu konularda yardımcı olabilirim:\n\n` +
      `🔍 *Ürün Arama* — İsim, marka veya kategori ile arama yapın\n` +
      `📦 *Stok Kontrolü* — Ürün stok durumunu öğrenin\n` +
      `💰 *Fiyat Bilgisi* — Ürün fiyatlarını öğrenin\n` +
      `🛒 *Sipariş* — Sipariş oluşturun\n` +
      `👤 *Hesap Bilgileri* — Bayi bilgilerinizi görün\n\n` +
      `Nasıl yardımcı olabilirim?`;
  },

  noResults(query: string): string {
    return `"${query}" için sonuç bulunamadı. 😔\n\nFarklı bir arama terimi deneyebilir veya doğrudan sorularınızı yazabilirsiniz.`;
  },

  error(errorMsg: string): string {
    return `❌ Bir hata oluştu: ${errorMsg}\n\nLütfen tekrar deneyin veya sorununuzda farklı bir şekilde açıklayın.`;
  },

  unknownMessage(): string {
    return `Anlayamadım, kusura bakmayın 🤔\n\nÜrün arama, stok kontrolü, fiyat bilgisi veya sipariş oluşturma konularında yardımcı olabilirim.`;
  },
};
