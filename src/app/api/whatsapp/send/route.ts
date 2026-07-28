// ============================================================================
// POST /api/whatsapp/send — Admin message send
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getConnectionStatus, sendTextMessage } from "@/lib/whatsapp/client";
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers";

const SendSchema = z.object({
  phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
  message: z.string().min(1, "Mesaj boş olamaz"),
  conversationId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  const denied = requireAdminSession(session);
  if (denied) return denied;

  const status = getConnectionStatus();
  if (status !== "connected") {
    return NextResponse.json(
      { error: "WhatsApp bağlı değil. Önce bağlantı kurun." },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const parsed = SendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { phone, message, conversationId } = parsed.data;

    // Send message
    const waMessageId = await sendTextMessage(phone, message);

    // Save to DB
    let convId = conversationId;

    if (!convId) {
      // Find existing conversation
      const conv = await prisma.whatsAppConversation.findFirst({
        where: { phoneNumber: phone, status: "ACTIVE", deletedAt: null },
        select: { id: true },
      });
      convId = conv?.id;
    }

    if (convId) {
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: convId,
          direction: "OUTBOUND",
          messageType: "TEXT",
          content: message,
          waMessageId,
          aiGenerated: false,
          status: "SENT",
        },
      });

      await prisma.whatsAppConversation.update({
        where: { id: convId },
        data: { lastMessageAt: new Date(), totalMessages: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      waMessageId,
      conversationId: convId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Mesaj gönderilemedi" },
      { status: 500 },
    );
  }
}
