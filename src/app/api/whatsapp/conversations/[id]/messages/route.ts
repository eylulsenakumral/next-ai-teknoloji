// ============================================================================
// GET /api/whatsapp/conversations/[id]/messages — Message history
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  const denied = requireAdminSession(session);
  if (denied) return denied;

  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  // Verify conversation exists
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, companyName: true, dealerCode: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Konuşma bulunamadı" },
      { status: 404 },
    );
  }

  const [messages, total] = await Promise.all([
    prisma.whatsAppMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.whatsAppMessage.count({ where: { conversationId: id } }),
  ]);

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      phoneNumber: conversation.phoneNumber,
      customerName: conversation.customerName,
      customer: conversation.customer,
      status: conversation.status,
    },
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
