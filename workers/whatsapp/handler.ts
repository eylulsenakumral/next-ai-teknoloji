// ============================================================================
// WhatsApp Message Handler — Parse, Route, Respond
// ============================================================================
import type { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { prisma } from "@/lib/db";
import type { MessageDirection, MessageType } from "@prisma/client";
import { generateAIResponse } from "./ai";
import { sendTextMessage } from "./client";
import { TEMPLATES } from "./templates";
import type { IncomingMessage, ConversationContext } from "./types";

// ---------------------------------------------------------------------------
// Parse incoming WAMessage into our internal format
// ---------------------------------------------------------------------------
function parseIncomingMessage(msg: WAMessage): IncomingMessage {
  const from = msg.key.remoteJid!;
  const pushName = msg.pushName ?? undefined;
  const id = msg.key.id!;
  const timestamp = Number(msg.messageTimestamp ?? Date.now() / 1000);
  const m = msg.message!;

  let type: IncomingMessage["type"] = "text";
  let body: string | undefined;

  if (m.conversation) {
    body = m.conversation;
  } else if (m.extendedTextMessage) {
    body = m.extendedTextMessage.text ?? undefined;
  } else if (m.imageMessage) {
    type = "image";
    body = m.imageMessage.caption ?? undefined;
  } else if (m.documentMessage) {
    type = "document";
    body = m.documentMessage.fileName ?? undefined;
  } else if (m.audioMessage) {
    type = "audio";
  } else if (m.videoMessage) {
    type = "video";
    body = m.videoMessage.caption ?? undefined;
  } else if (m.locationMessage) {
    type = "location";
  } else if (m.buttonsResponseMessage) {
    type = "button";
    body = m.buttonsResponseMessage.selectedDisplayText ?? undefined;
  } else if (m.listResponseMessage) {
    type = "button";
    body = m.listResponseMessage.title ?? undefined;
  }

  return { id, from, pushName, body, type, timestamp };
}

function extractPhone(jid: string): string {
  return jid.replace(/@s\.whatsapp\.net$/, "").replace(/@g\.us$/, "");
}

function mapMessageType(type: IncomingMessage["type"]): MessageType {
  const map: Record<IncomingMessage["type"], MessageType> = {
    text: "TEXT",
    image: "IMAGE",
    document: "DOCUMENT",
    audio: "AUDIO",
    video: "VIDEO",
    location: "LOCATION",
    button: "BUTTON",
  };
  return map[type] ?? "TEXT";
}

// ---------------------------------------------------------------------------
// Find or create conversation
// ---------------------------------------------------------------------------
async function findOrCreateConversation(
  phone: string,
  pushName?: string,
): Promise<{ conversationId: string; context: ConversationContext; isNew: boolean }> {
  const customer = await prisma.customer.findFirst({
    where: { whatsappPhone: phone },
    select: { id: true, companyName: true, dealerCode: true },
  });

  let conversation = await prisma.whatsAppConversation.findFirst({
    where: { phoneNumber: phone, status: "ACTIVE", deletedAt: null },
    orderBy: { lastMessageAt: "desc" },
  });

  if (conversation) {
    if (customer && !conversation.customerId) {
      conversation = await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { customerId: customer.id, customerName: customer.companyName },
      });
    }
    const rawCtx = conversation.context as Record<string, unknown> | null;
    const ctx: ConversationContext = {
      messageCount: (rawCtx?.messageCount as number) ?? 0,
      customerId: (rawCtx?.customerId as string) ?? customer?.id,
      customerName: (rawCtx?.customerName as string) ?? customer?.companyName ?? pushName ?? phone,
      dealerCode: (rawCtx?.dealerCode as string) ?? customer?.dealerCode,
    };
    return { conversationId: conversation.id, context: ctx, isNew: false };
  }

  const newConv = await prisma.whatsAppConversation.create({
    data: {
      phoneNumber: phone,
      customerId: customer?.id,
      customerName: customer?.companyName ?? pushName ?? phone,
      context: {
        customerId: customer?.id,
        customerName: customer?.companyName ?? pushName ?? phone,
        dealerCode: customer?.dealerCode,
        messageCount: 0,
      },
    },
  });

  return {
    conversationId: newConv.id,
    context: (newConv.context as unknown as ConversationContext) ?? { messageCount: 0 },
    isNew: true,
  };
}

// ---------------------------------------------------------------------------
// Save message to DB
// ---------------------------------------------------------------------------
async function saveMessage(data: {
  conversationId: string;
  direction: MessageDirection;
  messageType: MessageType;
  content: string | null;
  mediaUrl?: string | null;
  waMessageId?: string | null;
  aiGenerated?: boolean;
  aiModel?: string | null;
  aiTokensUsed?: number | null;
}) {
  return prisma.whatsAppMessage.create({ data });
}

// ---------------------------------------------------------------------------
// Update conversation context
// ---------------------------------------------------------------------------
async function updateConversationContext(conversationId: string, ctx: ConversationContext) {
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      context: JSON.parse(JSON.stringify(ctx)),
      lastMessageAt: new Date(),
      totalMessages: { increment: 1 },
    },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export async function handleIncomingMessage(sock: WASocket, msg: WAMessage): Promise<void> {
  const from = msg.key.remoteJid;
  if (!from) return;
  if (from.includes("@g.us")) return;
  if (from === "status@broadcast") return;
  if (msg.key.fromMe) return;

  const incoming = parseIncomingMessage(msg);
  const phone = extractPhone(incoming.from);
  const { conversationId, context, isNew } = await findOrCreateConversation(phone, incoming.pushName);

  // Save inbound message
  await saveMessage({
    conversationId,
    direction: "INBOUND",
    messageType: mapMessageType(incoming.type),
    content: incoming.body ?? null,
    waMessageId: incoming.id,
  });

  if (!incoming.body || !incoming.body.trim()) return;

  // First message → send welcome
  if (isNew && context.messageCount === 0) {
    const welcomeMsg = TEMPLATES.welcome(context.customerName ?? "Değerli Müşterimiz");
    await sendTextMessage(phone, welcomeMsg);
    await saveMessage({
      conversationId,
      direction: "OUTBOUND",
      messageType: "TEXT",
      content: welcomeMsg,
      aiGenerated: true,
      aiModel: "template",
      aiTokensUsed: 0,
    });
    context.messageCount++;
  }

  // Generate AI response
  const aiResponse = await generateAIResponse({
    userMessage: incoming.body,
    context,
    conversationId,
  });

  const sentWaId = await sendTextMessage(phone, aiResponse.content);

  await saveMessage({
    conversationId,
    direction: "OUTBOUND",
    messageType: "TEXT",
    content: aiResponse.content,
    waMessageId: sentWaId,
    aiGenerated: true,
    aiModel: aiResponse.model,
    aiTokensUsed: aiResponse.tokensUsed,
  });

  // Update context
  context.messageCount++;
  if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
    const lastTool = aiResponse.toolCalls[aiResponse.toolCalls.length - 1];
    if (
      lastTool.name === "search_products" ||
      lastTool.name === "check_stock" ||
      lastTool.name === "inquiry_price"
    ) {
      context.lastIntent = lastTool.name;
      const result = lastTool.result as Array<{ id: string; name: string }> | undefined;
      if (Array.isArray(result) && result.length > 0) {
        context.lastProducts = result.map((p) => ({ id: p.id, name: p.name }));
      }
    }
  }

  await updateConversationContext(conversationId, context);
}
