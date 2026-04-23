// ============================================================================
// WhatsApp AI Engine — NexaDepo Ürün Danışmanı (Gelişmiş)
// ============================================================================
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { toolDefinitions, executeTool } from "./tools";
import { TEMPLATES } from "./templates";
import type { AIResponse, ConversationContext } from "./types";

// ---------------------------------------------------------------------------
// LLM Client
// ---------------------------------------------------------------------------
const whatsappAiApiKey = process.env.WHATSAPP_AI_API_KEY;
if (!whatsappAiApiKey) {
  throw new Error(
    "WHATSAPP_AI_API_KEY environment variable is required but not set. " +
      "Set it in your .env file before starting the WhatsApp worker."
  );
}

const llm = new OpenAI({
  baseURL: process.env.WHATSAPP_AI_BASE_URL || "https://api.z.ai/api/coding/paas/v4",
  apiKey: whatsappAiApiKey,
});

const DEFAULT_MODEL = process.env.WHATSAPP_AI_MODEL || "glm-4.5-air";

async function getAIModel(): Promise<string> {
  try {
    const setting = await prisma.setting.findFirst({
      where: { group: "WHATSAPP", key: "AI_MODEL" },
      select: { value: true },
    });
    if (setting && typeof setting.value === "string") return setting.value;
  } catch {
    // ignore
  }
  return DEFAULT_MODEL;
}

// ---------------------------------------------------------------------------
// System Prompt — GELIŞMIŞ ÜRÜN DANIŞMANI
// ---------------------------------------------------------------------------
function buildSystemPrompt(context: ConversationContext): string {
  const isVerified = context.isVerified ?? false;
  const customerInfo = context.customerName
    ? `Müşteri: ${context.customerName}${context.dealerCode ? ` (${context.dealerCode})` : ""}${isVerified ? " [BAYİ]" : ""}`
    : "Yeni müşteri.";

  const priceInfo = isVerified
    ? "→ BAYİ FİYATI göster (alış + kar marjı)"
    : "→ SON KULLANICI FİYATI göster (manualPrice). Fiyat gösterirken sonuna kısa bir not ekle: 'Bayi fiyatlarımız için DOĞRULA [bayi_kodu] yazabilirsiniz.'";

  const lines = [
    "Sen NexaDepo'nun Profesyonel Ürün Danışmanısın.",
    "",
    "👤 KİMLİK:",
    "- Türkçe, profesyonel ve samimi konuş",
    "- Müşteriye \"siz\" diye hitap et",
    "- Emoji kullan (ama aşırıya kaçma)",
    "",
    "🎯 GÖREVİN:",
    "1. Müşterinin ihtiyacını anla",
    "2. Belirleyici sorular sor → gereksinim profili oluştur",
    "3. Doğru ürünü bul (spec bazlı filtreleme)",
    "4. Ürünü detaylı sun",
    "",
    "❌ ÖNEMLİ KISITLAMALAR:",
    "- SADECE NexaDepo'daki ürünler hakkında bilgi ver",
    "- Yiyecek, yemek, haber gibi konulara HİÇBİR ŞEKİLDE cevap verme",
    "- Bilmediğin bir konuda: \"Bu konuda yardımcı olamıyorum, ancak güvenlik kamera sistemleri, kayıt cihazları, network ürünleri gibi konularda uzmanız\" de",
    "- ASLA tedarikçi adı, tedarikçi bilgisi, tedarikçi bulunamadığı gibi İÇ BİLGİLERİ müşteriye gösterme",
    "- Stok bilgisi olmayan ürünler için sadece \"stok bilgisi mevcut değil\" de, NEDENİYLE açıklama",
    "",
    "💰 FİYAT GÖSTERİMİ:",
    `- Müşteri durumu: ${priceInfo}`,
    "- Doğrulanmamış müşteriye asla alış fiyatı, kar marjı gösterme",
    "- Doğrulama konusunda ISRARCI OLMA. Müşteri sadece ürün soruyorsa normal cevap ver.",
    "- Sadece fiyat sorduğunda son kullanıcı fiyatını gösterip doğrulama notu ekle.",
    "",
    "🏗️ CCTV/GÜVENLİK ALAN BİLGİSİ:",
    "- Kamera tipleri: IP (network), AHD (analog HD), WiFi, Turbo HD",
    "- Form faktörleri: Dome (tavan/monte), Bullet (duvar/cidde), PTZ/Speed Dome (hareketli), Turret (göz küresi)",
    "- Çözünürlükler: 2MP (1080p), 4MP (1440p), 5MP, 8MP (4K)",
    "- Temel özellikler: IR gece görüşü, Full Color / ColorVu (renkli gece), AI/SMD (akıllı algılama), AcuSense, WDR, PoE",
    "- Kayıt cihazları: NVR (IP kameralar), DVR (AHD kameralar), XVR (ikisini de destekler)",
    "- Kanal sayısı: 4, 8, 16, 32, 64 kanal seçenekleri",
    "- Depolama: Süveylans HDD (WD Purple, Seagate SkyHawk), SSD cache",
    "- Network: PoE switch (toplam watt'ı kamera sayısına göre eşleştir), managed vs unmanaged",
    "",
    "📋 VERİTABANI SPEC KEY'LERİ (Türkçe):",
    "- Cozunurluk / Cikis → çözünürlük (2MP, 4MP, 8MP)",
    "- Gece Gorusu / IR Mesafe → gece görüşü mesafesi ve tipi",
    "- Tip / Cihaz Tipi → form faktörü (Dome, Bullet, PTZ)",
    "- IP Sinifi → koruma sınıfı (IP67, IP67+IK10)",
    "- Lens → odak uzaklığı (2.8mm, 4mm, 2.8-12mm)",
    "- Kanal Sayisi → NVR/DVR kanal sayısı",
    "- HDD Yuvasi / Max HDD → disk kapasitesi",
    "- Port Sayisi / Toplam Port → switch port sayısı",
    "- PoE Port / PoE Butcesi → PoE güç bütçesi",
    "- Codec → video sıkıştırma (H.265+, H.264)",
    "",
    "🔄 BELİRLEYİCİ SORU AKIŞI (MUTLAKA UY):",
    "1. Müşteri bir ürün tipi sorduğunda → search_by_specs ile teknik spec'lere göre ara",
    "2. Sonuçlar geldiğinde, hemen ürün önerME → önce 1-2 belirleyici soru sor",
    "3. update_requirements tool'u ile müşterinin verdiklerini ve sorulacak soruları kaydet",
    "4. Müşteri cevap verdikten sonra → search_by_specs ile daraltılmış arama yap",
    "5. 2-3 en uygun ürünü öner, kilit özellikleri vurgula",
    "6. Fiyat/stok teklif et",
    "",
    "Soru kuralları:",
    "- Her turn'da maksimum 2 soru sor",
    "- Sorular seçenekli olsun (örn: \"IP mi AHD mi?\" değil \"Hangi teknolojiyi istersiniz: IP kamera mı AHD kamera mı?\")",
    "- Müşteri yeterince detay belirtmişse soru sorma, direkt öner",
    "- Daha önce sorulup cevaplanan şeyi tekrar sorma",
    "",
    "🛠️ TOOL'LAR:",
    "- search_products: Genel ürün arama (isim, marka, kategori, barkod)",
    "- search_by_specs: Teknik spec'lere göre arama (Cozunurluk, Tip, Gece Gorusu vb.)",
    "- update_requirements: Müşteri gereksinim profilini güncelle",
    "- get_categories: Kategorileri listele",
    "- get_product_details: Ürünün tüm detaylarını getir",
    "- check_stock: Stok durumu sorgula",
    "- inquiry_price: Fiyat bilgisi ver",
    "- create_order: Sipariş oluştur",
    "- get_customer_info: Müşteri bilgilerini göster",
    "",
    `📌 MÜŞTERİ BİLGİSİ: ${customerInfo}`,
    "",
    "⚡ KURAL: Teknik spec belirten müşterilerde → önce update_requirements, sonra search_by_specs, sonra belirleyici sorular, sonra öneri.",
  ];

  // Inject requirement profile
  if (context.requirementProfile) {
    const rp = context.requirementProfile;
    lines.push("", "📌 MEVCUT MÜŞTERİ İHTİYAÇLARI:");
    if (rp.productType) lines.push(`- Ürün tipi: ${rp.productType}`);
    if (rp.specs && Object.keys(rp.specs).length > 0) {
      for (const [key, val] of Object.entries(rp.specs)) {
        lines.push(`- ${key}: ${val}`);
      }
    }
    if (rp.answeredQuestions && rp.answeredQuestions.length > 0) {
      lines.push("", "✅ CEVAPLANAN SORULAR:");
      rp.answeredQuestions.forEach((q) => lines.push(`- ${q.question} → ${q.answer}`));
    }
    if (rp.openQuestions && rp.openQuestions.length > 0) {
      lines.push("", "⏳ HENÜZ SORULACAK SORULAR:");
      rp.openQuestions.forEach((q) => lines.push(`- ${q}`));
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Generate AI Response with tool-use loop + conversation history
// ---------------------------------------------------------------------------
export async function generateAIResponse(params: {
  userMessage: string;
  context: ConversationContext;
  conversationId: string;
}): Promise<AIResponse> {
  const { userMessage, context, conversationId } = params;
  const model = await getAIModel();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(context) },
  ];

  // Load last 6 messages for multi-turn qualifying dialog
  try {
    const recentMessages = await prisma.whatsAppMessage.findMany({
      where: {
        conversationId,
        direction: { in: ["INBOUND", "OUTBOUND"] },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { direction: true, content: true },
    });

    // Reverse to chronological order
    const history = recentMessages.reverse();
    for (const msg of history) {
      const content = (msg.content ?? "").slice(0, 300); // Truncate long messages
      if (!content) continue;
      if (msg.direction === "INBOUND") {
        messages.push({ role: "user", content });
      } else {
        messages.push({ role: "assistant", content });
      }
    }
  } catch {
    // History loading failed — continue without it
  }

  // Current message
  messages.push({ role: "user", content: userMessage });

  const toolCalls: AIResponse["toolCalls"] = [];
  let totalTokens = 0;
  let maxIterations = 5;

  while (maxIterations-- > 0) {
    const response = await llm.chat.completions.create({
      model,
      messages,
      tools: toolDefinitions as unknown as OpenAI.Chat.ChatCompletionTool[],
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const choice = response.choices[0];
    totalTokens += response.usage?.total_tokens ?? 0;

    const toolCallsRaw = choice.message.tool_calls;

    if (
      choice.finish_reason === "tool_calls" &&
      toolCallsRaw &&
      toolCallsRaw.length > 0
    ) {
      messages.push(choice.message);

      for (const rawToolCall of toolCallsRaw) {
        const fn =
          "function" in rawToolCall
            ? (rawToolCall as { function: { name: string; arguments: string }; id: string }).function
            : null;
        if (!fn) continue;

        const toolName = fn.name;
        let toolArgs: Record<string, unknown>;
        try {
          toolArgs = JSON.parse(fn.arguments);
        } catch {
          toolArgs = {};
        }

        try {
          const toolResult = await executeTool(toolName, toolArgs, context);

          toolCalls.push({
            name: toolName,
            arguments: toolArgs,
            result: toolResult,
          });

          messages.push({
            role: "tool",
            tool_call_id: rawToolCall.id,
            content:
              typeof toolResult === "string"
                ? toolResult
                : JSON.stringify(toolResult),
          } as OpenAI.Chat.ChatCompletionMessageParam);
        } catch (err) {
          const errorMsg = `Tool error: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`;
          toolCalls.push({
            name: toolName,
            arguments: toolArgs,
            result: errorMsg,
          });
          messages.push({
            role: "tool",
            tool_call_id: rawToolCall.id,
            content: errorMsg,
          } as OpenAI.Chat.ChatCompletionMessageParam);
        }
      }
      continue;
    }

    const content = choice.message.content?.trim() || TEMPLATES.help();
    return { content, model, tokensUsed: totalTokens, toolCalls };
  }

  return {
    content: TEMPLATES.help(),
    model,
    tokensUsed: totalTokens,
    toolCalls,
  };
}
