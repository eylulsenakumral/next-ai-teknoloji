// ============================================================================
// Tool: Specs-Based Product Search — PostgreSQL JSONB filtering
// ============================================================================
import { prisma } from "@/lib/db";

// LLM Turkce/Ingilizce key'leri veritabani key'lerine cevir
const SPEC_KEY_ALIASES: Record<string, string[]> = {
  cozunurluk: ["Cozunurluk", "Çözünürlük", "Cikis", "Çıkış", "Resolution"],
  gece_gorusu: ["Gece Gorusu", "Gece Görüşü", "IR Mesafe", "IR Distance"],
  ip_sinifi: ["IP Sinifi", "IP Sınıfı", "IP Rating"],
  lens: ["Lens", "Odak Uzakligi", "Odak Uzaklığı"],
  kanal: ["Kanal Sayisi", "Kanal Sayısı", "Channel"],
  hdd: ["HDD Yuvasi", "HDD Yuvası", "Max HDD", "Disk Kapasitesi"],
  port: ["Port Sayisi", "Port Sayısı", "Toplam Port"],
  poe: ["PoE Port", "PoE Butcesi", "PoE Bütçesi", "PoE"],
  codec: ["Codec", "Sikistirma", "Sıkıştırma", "Compression"],
  ai: ["AI", "SMD", "AcuSense", "Yapay Zeka"],
  wifi: ["WiFi", "Wi-Fi", "Kablosuz", "Wireless"],
  form_faktor: ["Form Faktor", "Form Faktör", "Tip", "Tipi"],
  tip: ["Tip", "Tipi", "Cihaz Tipi"],
  renk: ["Renk", "Full Color", "ColorVu", "Gece Renkli"],
  marka: ["Marka", "Brand"],
};

function resolveSpecKey(key: string): string[] {
  const lower = key.toLowerCase().replace(/[^a-z0-9]/g, "_");

  // Direkt eslesme
  if (SPEC_KEY_ALIASES[lower]) return SPEC_KEY_ALIASES[lower];

  // Key kendisi de olabilir (LLM Turkce gondermis olabilir)
  return [key];
}

export async function searchBySpecs(params: {
  category?: string;
  query?: string;
  specs?: Record<string, string>;
  limit?: number;
}): Promise<string> {
  const { category, query, specs, limit = 5 } = params;

  if (!specs || Object.keys(specs).length === 0) {
    return "Spec filtresi belirtilmedi. En az bir spec belirtin (orn: { \"Cozunurluk\": \"2MP\" }).";
  }

  // SQL sartlari olustur
  const specConditions: string[] = [];
  const sqlParams: unknown[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(specs)) {
    const possibleKeys = resolveSpecKey(key);
    // Her olasi key icin OR sarti: specs->>'key' ILIKE '%value%'
    const keyConditions = possibleKeys.map((k) => {
      sqlParams.push(`%${value}%`);
      return `p.specs->>'${k.replace(/'/g, "''")}' ILIKE $${paramIdx++}`;
    });
    specConditions.push(`(${keyConditions.join(" OR ")})`);
  }

  // Category filter
  let categoryJoin = "";
  let categoryCondition = "";
  if (category) {
    categoryJoin = `LEFT JOIN categories c ON p.category_id = c.id`;
    categoryCondition = `AND (c.name ILIKE ${sqlParams.push(`%${category}%`), `$${paramIdx++}`} OR c.slug ILIKE ${sqlParams.push(`%${category}%`), `$${paramIdx++}`})`;
  }

  // Text search
  let textCondition = "";
  if (query) {
    textCondition = `AND (p.name ILIKE ${sqlParams.push(`%${query}%`), `$${paramIdx++}`} OR b.name ILIKE ${sqlParams.push(`%${query}%`), `$${paramIdx++}`})`;
  }

  const safeLimit = Math.min(limit, 20);
  sqlParams.push(safeLimit);

  const sql = `
    SELECT
      p.id, p.name, p.slug, p.specs, p.barcode, p.sku,
      b.name as brand_name,
      ${category ? "c.name as category_name," : "cat.name as category_name,"}
      (
        SELECT sp.purchase_price
        FROM supplier_products sp
        WHERE sp.product_id = p.id AND sp.is_available = true AND sp.deleted_at IS NULL
        ORDER BY sp.purchase_price ASC LIMIT 1
      ) as best_price,
      (
        SELECT sp.stock_quantity
        FROM supplier_products sp
        WHERE sp.product_id = p.id AND sp.is_available = true AND sp.deleted_at IS NULL
        ORDER BY sp.purchase_price ASC LIMIT 1
      ) as stock_qty
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    ${category ? categoryJoin : "LEFT JOIN categories cat ON p.category_id = cat.id"}
    WHERE p.is_active = true
      AND p.deleted_at IS NULL
      AND p.specs IS NOT NULL
      ${category ? categoryCondition : ""}
      ${textCondition}
      AND (${specConditions.join(" AND ")})
    ORDER BY p.name ASC
    LIMIT $${paramIdx}
  `;

  type Row = {
    id: string;
    name: string;
    slug: string;
    specs: Record<string, string> | null;
    barcode: string | null;
    sku: string | null;
    brand_name: string | null;
    category_name: string | null;
    best_price: number | null;
    stock_qty: number | null;
  };

  let results: Row[];
  try {
    results = await prisma.$queryRawUnsafe<Row[]>(sql, ...sqlParams);
  } catch (err) {
    console.error("[specs-search] SQL error:", err);
    return "Teknik arama sirasinda hata olustu. Lutfen farkli filtreler deneyin.";
  }

  if (results.length === 0) {
    const specDesc = Object.entries(specs).map(([k, v]) => `${k}=${v}`).join(", ");
    return `"${specDesc}" ile eslesen urun bulunamadi. Farkli spec filtreleri deneyebilir misiniz?`;
  }

  const text = results
    .map((r, i) => {
      const matchedSpecs = specs
        ? Object.entries(specs)
            .map(([k, v]) => {
              const possibleKeys = resolveSpecKey(k);
              for (const pk of possibleKeys) {
                if (r.specs?.[pk]) return `${pk}: ${r.specs[pk]}`;
              }
              return null;
            })
            .filter(Boolean)
            .join(", ")
        : "";

      return (
        `${i + 1}. ${r.name}${r.brand_name ? ` — ${r.brand_name}` : ""}${r.category_name ? ` (${r.category_name})` : ""}` +
        (matchedSpecs ? `\n   Ozellikler: ${matchedSpecs}` : "") +
        (r.best_price != null ? `\n   Fiyat: ${r.best_price.toLocaleString("tr-TR")} TL` : "") +
        (r.stock_qty != null ? ` | Stok: ${r.stock_qty} adet` : "\n   Stok bilgisi mevcut degil")
      );
    })
    .join("\n\n");

  return `Spec bazli arama sonuclari:\n\n${text}\n\nDetayli fiyat icin "inquiry_price", stok kontrolu icin "check_stock" tool'unu kullan.`;
}
