// ============================================================================
// WhatsApp AI Engine — NexaDepo Ürün Danışmanı
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
// System Prompt — ÜRÜN DANIŞMANI
// ---------------------------------------------------------------------------
function buildSystemPrompt(context: ConversationContext): string {
  const isVerified = context.isVerified ?? false;
  const customerInfo = context.customerName
    ? `Müşteri: ${context.customerName}${context.dealerCode ? ` (${context.dealerCode})` : ""}${isVerified ? " [BAYİ]" : ""}`
    : "Yeni müşteri.";

  const priceInfo = isVerified
    ? "→ BAYİ FİYATI göster (alış + kar marjı)"
    : "→ SON KULLANICI FİYATI göster (manualPrice). Fiyat gösterirken sonuna kısa bir not ekle: 'Bayi fiyatlarımız için DOĞRULA [bayi_kodu] yazabilirsiniz.'";

  return [
    "Sen NexaDepo'nun Profesyonel Ürün Danışmanısın.",
    "",
    "👤 KİMLİK:",
    "- Türkçe, profesyonel ve samimi konuş",
    "- Müşteriye \"siz\" diye hitap et",
    "- Emoji kullan (ama aşırıya kaçma)",
    "",
    "🎯 GÖREVİN:",
    "1. Müşterinin ihtiyacını anla",
    "2. Doğru ürünü bul",
    "3. Teknik sorular sor (performans, ekonomik, kullanım amacı)",
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
    "🔍 TEKNİK SORU SORMA ÖRNEKLERİ:",
    "- Kameracı: \"IP mi, AHD mi, yoksa wifi mı tercih edersiniz?\"",
    "- Kayıt cihazı: \"Kaç gün kayıt saklamak istiyorsunuz? 1 disk yeterli olur mu?\"",
    "- Switch: \"Kaç kamera bağlayacaksınız? PoE gücü yeterli mi?\"",
    "",
    "📋 ÇALIŞMA AKISI:",
    "1. Müşteri bir ürün sorduğunda → search_products ile ara",
    "2. Ürün bulundu → check_product_details ile detayları al",
    "3. Teknik soru sor → müşterinin niyetini anla",
    "4. inquiry_price ile fiyat göster",
    "5. Kullanıcı onaylarsa → create_order ile sipariş al",
    "",
    "🛠️ TOOL'LAR:",
    "- search_products: Ürün ara (isim, marka, kategori, barkod)",
    "- get_categories: Kategorileri listele",
    "- check_product_details: Ürünün tüm detaylarını getir (özellikler, teknik spesifikasyonlar)",
    "- check_stock: Stok durumu sorgula",
    "- inquiry_price: Fiyat bilgisi ver",
    "- create_order: Sipariş oluştur",
    "- get_customer_info: Müşteri bilgilerini göster",
    "",
    `📌 MÜŞTERİ BİLGİSİ: ${customerInfo}`,
    "",
    "⚡ KURAL: İlk olarak ürünü bul, sonra detay sor, sonra fiyat göster.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Generate AI Response with tool-use loop
// ---------------------------------------------------------------------------
export async function generateAIResponse(params: {
  userMessage: string;
  context: ConversationContext;
  conversationId: string;
}): Promise<AIResponse> {
  const { userMessage, context } = params;
  const model = await getAIModel();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(context) },
    { role: "user", content: userMessage },
  ];

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
