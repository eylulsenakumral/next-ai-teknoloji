// ============================================================================
// Chat API — Fast Web Chat (pre-search + natural conversation)
// ============================================================================
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { searchProducts } from "../../../../workers/whatsapp/tools/product-search";
import { searchBySpecs } from "../../../../workers/whatsapp/tools/specs-search";
import type { ConversationContext } from "../../../../workers/whatsapp/types";

const llm = new OpenAI({
  baseURL: process.env.WHATSAPP_AI_BASE_URL || "https://api.z.ai/api/coding/paas/v4",
  apiKey: process.env.WHATSAPP_AI_API_KEY,
});

const CHAT_MODEL = process.env.CHAT_AI_MODEL || "glm-4.5-air";

// ---------------------------------------------------------------------------
// Detect if message is product-related and extract search context
// ---------------------------------------------------------------------------
function extractSearchContext(msg: string): {
  isProductQuery: boolean;
  keywords: string[];
  specs: Record<string, string>;
  category?: string;
} {
  const lower = msg.toLowerCase();

  // Product-related keywords
  const productWords = [
    "kamera", "nvr", "dvr", "switch", "poE", "poe", "hdd", "disk",
    "kablo", "fiş", "priz", "ups", "monitör", "monitor", "barkod",
    "tarayıcı", "printer", "yazıcı", "router", "access point", "ap",
    "donanım", "hard", "ram", "ssd", "işlemci", "anakart",
  ];

  const isProductQuery = productWords.some((w) => lower.includes(w));

  const specs: Record<string, string> = {};
  const keywords: string[] = [];

  // Resolution detection
  const resMatch = lower.match(/(\d+)\s*mp/);
  if (resMatch) specs["Çözünürlük"] = resMatch[1] + "MP";

  // Camera type detection
  if (/\bip\b/.test(lower) || lower.includes("network")) keywords.push("IP");
  if (lower.includes("ahd")) keywords.push("AHD");
  if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("kablosuz")) keywords.push("WiFi");

  // Form factor
  if (lower.includes("dome")) specs["Tip"] = "Dome";
  if (lower.includes("bullet")) specs["Tip"] = "Bullet";
  if (lower.includes("ptz") || lower.includes("speed dome")) specs["Tip"] = "PTZ";
  if (lower.includes("turret")) specs["Tip"] = "Turret";

  // Night vision
  if (lower.includes("gece renkli") || lower.includes("full color") || lower.includes("colorvu") || lower.includes("renkli gece")) {
    specs["Gece Görüş"] = "Full Color";
  }
  if (lower.includes("gece") || lower.includes("ir") || lower.includes("infrared")) {
    if (!specs["Gece Görüş"]) keywords.push("gece görüşü");
  }

  // Channel count
  const chMatch = lower.match(/(\d+)\s*kanal/);
  if (chMatch) specs["Kanal Sayısı"] = chMatch[1];

  // Category detection
  let category: string | undefined;
  if (lower.includes("kamera")) category = "Kamera";
  if (lower.includes("nvr")) category = "NVR";
  if (lower.includes("dvr")) category = "DVR";
  if (lower.includes("switch") || lower.includes("poE")) category = "Switch";
  if (lower.includes("hdd") || lower.includes("disk") || lower.includes("hard")) category = "HDD";

  // General keywords
  const brandPatterns = ["hikvision", "dahua", "honeywell", "ezviz", "tp-link", "ubiquiti", "d-link"];
  for (const brand of brandPatterns) {
    if (lower.includes(brand)) keywords.push(brand);
  }

  return { isProductQuery, keywords, specs, category };
}

// ---------------------------------------------------------------------------
// Build system prompt with optional search results
// ---------------------------------------------------------------------------
function buildPrompt(
  context: ConversationContext,
  searchResults?: string,
): string {
  let prompt = `Sen NexaDepo'nun Profesyonel Ürün Danışmanısın. Web chat üzerinden müşteriye yardımcı oluyorsun.

TÜRKÇE, profesyonel ve samimi konuş. Emoji az kullan. "Siz" diye hitap et.

ÖNEMLİ KURALLAR:
- SADECE NexaDepo'daki teknoloji/güvenlik ürünleri hakkında bilgi ver. Kamera, NVR, DVR, switch, HDD, network, UPS, monitör, barkod tarayıcı, yazıcı vb.
- Tedarikçi bilgisi ASLA verme.
- FİYAT GÖSTERME. Hiçbir koşulda fiyat yazma. Müşteri fiyat sorarsa "Detaylı fiyat bilgisi için bizimle iletişime geçebilirsiniz." de.
- STOK BİLGİSİ: Arama sonuçlarında stok adedi varsa belirtebilirsin (ör: "Stokta X adet mevcut").
- MARKA VE MODEL: Ürün önerirken mutlaka MARKA ve TAM MODEL ADI yaz. Örn: "Hikvision DS-2CD1023G2-LIUF 2MP IP Bullet Kamera"
- KONU DIŞI SORULAR: Yemek tarifleri, haber, spor, hava durumu, genel bilgi soruları vb. konularda ASLA cevap verme. Kibarca konunun dışında olduğunu belirt: "Ben NexaDepo ürün danışmanıyım, sadece teknoloji ve güvenlik ürünlerimiz hakkında bilgi verebilirim."

CCTV ALAN BİLGİSİ:
- Kamera: IP, AHD, WiFi | Dome, Bullet, PTZ, Turret | 2MP-8MP
- Özellikler: IR, Full Color/ColorVu, AI/SMD, PoE, WDR
- Kayıt: NVR(IP), DVR(AHD) | 4-64 kanal | HDD: WD Purple, SkyHawk
- Network: PoE switch

AKIŞ: Müşteri ürün sorduğunda:
1. Eğer yeterli detay yoksa belirleyici sorular sor (max 2 soru, seçenekli)
   - Kamera: "IP mi AHD mi? Dome mu Bullet mı? Gece renkli görüntü ister misiniz?"
   - NVR/DVR: "Kaç kamera bağlayacaksınız? Kaç gün kayıt?"
   - Switch: "Kaç port? PoE gerekiyor mu?"
2. Müşteri yeterince detay belirtmişse direkt ürün öner
3. 2-3 ürün öner, her ürün için MARKA + TAM MODEL ADI + stok bilgisi ver
4. Müşteri isterse iletişime geçebilir`;

  if (searchResults) {
    prompt += `

ARAMA SONUÇLARI:
${searchResults}

Yukarıdaki sonuçlara dayanarak müşteriye doğal bir şekilde cevap ver. Sonuçlar varsa ürün öner, yoksa alternatif sor.`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// POST /api/chat — Streaming response with pre-search
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body as {
      message: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message?.trim()) {
      return new Response("Mesaj gerekli", { status: 400 });
    }

    const context: ConversationContext = { messageCount: history?.length ?? 0 };

    // Pre-search: detect product intent and search automatically
    let searchResults: string | undefined;
    const searchCtx = extractSearchContext(message);

    if (searchCtx.isProductQuery) {
      try {
        // Primary: text-based search by product name (most products have null specs)
        // Include spec values (2MP, Dome etc.) in the text query for better name matching
        const specValues = Object.values(searchCtx.specs);
        const searchQuery = [searchCtx.category, ...searchCtx.keywords, ...specValues].filter(Boolean).join(" ") || message;
        searchResults = await searchProducts(searchQuery, 5);

        // Fallback: if text search found nothing AND we have specs, try spec-based search
        if ((!searchResults || searchResults.includes("bulunamadı")) && Object.keys(searchCtx.specs).length > 0) {
          const specResult = await searchBySpecs({
            category: searchCtx.category,
            specs: searchCtx.specs,
            query: searchCtx.keywords.join(" ") || undefined,
            limit: 5,
          });
          if (specResult && !specResult.includes("bulunamadı")) {
            searchResults = specResult;
          }
        }
      } catch (err) {
        console.error("[Chat] Pre-search error:", err);
      }
    }

    // Build messages for LLM
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: buildPrompt(context, searchResults) },
    ];

    // Add history (last 6 messages)
    if (history && history.length > 0) {
      for (const msg of history.slice(-6)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: message });

    // Stream response
    const stream = await llm.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 2048,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch {
          // Stream ended
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("[Chat API] Error:", err);
    return new Response("Bir hata oluştu. Lütfen tekrar deneyin.", { status: 500 });
  }
}
