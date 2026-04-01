// ============================================================================
// WhatsApp AI Engine — LLM + Tool Calling
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
  baseURL: process.env.WHATSAPP_AI_BASE_URL || "http://192.168.5.249:20128/v1",
  apiKey: whatsappAiApiKey,
});

const DEFAULT_MODEL = process.env.WHATSAPP_AI_MODEL || "YEDEK";

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
// System Prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt(context: ConversationContext): string {
  const customerInfo = context.customerName
    ? `Müşteri: ${context.customerName}${context.dealerCode ? ` (${context.dealerCode})` : ""}`
    : "Müşteri henüz tanınamadı (bayi kaydı yok).";

  return [
    "Sen NexaDepo'nun WhatsApp satış asistanısın. Türkçe, profesyonel ama samimi konuş.",
    "",
    "KURALLAR:",
    `- ${customerInfo}`,
    "- Alış fiyatlarını ASLA gösterme. Müşteriye sadece satış fiyatını göster.",
    "- Stok durumu, fiyat bilgisi ve ürün detayları verirken net ol.",
    "- Sipariş oluşturma talebi geldiğinde müşteriye onay sor.",
    '- Bilmediğin bir konuda "Bu konuda yetkililerimiz size yardımcı olabilir" de.',
    "- Kısa ve net cevaplar ver, uzun paragraflar yazma.",
    "- Emoji kullanabilirsin ama aşırıya kaçma.",
    "",
    "TOOL'LAR:",
    "- search_products: Ürün ara (isim, marka, kategori ile)",
    "- check_stock: Stok kontrolü yap",
    "- inquiry_price: Fiyat bilgisi ver (marj hesaplanmış satış fiyatı)",
    "- create_order: Sipariş oluştur (müşteri onayından sonra)",
    "- get_customer_info: Müşteri bilgilerini görüntüle",
    "",
    "ÖNCEKİ BAĞLAM:",
    context.lastIntent ? `Son intent: ${context.lastIntent}` : "İlk mesaj",
    context.lastProducts?.length
      ? `Son aranan ürünler: ${context.lastProducts.map((p) => p.name).join(", ")}`
      : "",
    context.pendingOrder
      ? `Bekleyen sipariş kalemleri: ${JSON.stringify(context.pendingOrder.items)}`
      : "",
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
