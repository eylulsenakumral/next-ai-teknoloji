// ============================================================================
// GET /api/whatsapp/conversations — List conversations
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  const denied = requireAdminSession(session);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const status = searchParams.get("status") ?? "ACTIVE";
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {
    status,
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { phoneNumber: { contains: search } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customer: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [conversations, total] = await Promise.all([
    prisma.whatsAppConversation.findMany({
      where,
      include: {
        messages: {
          select: { id: true, content: true, direction: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        customer: {
          select: { id: true, companyName: true, dealerCode: true },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.whatsAppConversation.count({ where }),
  ]);

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      phoneNumber: c.phoneNumber,
      customerName: c.customerName,
      customerId: c.customerId,
      customer: c.customer,
      status: c.status,
      lastMessage: c.messages[0]?.content ?? null,
      lastMessageAt: c.lastMessageAt,
      totalMessages: c.totalMessages,
      createdAt: c.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
