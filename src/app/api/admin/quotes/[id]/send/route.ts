import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"

// POST /api/admin/quotes/[id]/send — Teklifi gönder (WhatsApp)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const { channel } = body as { channel?: string }

  if (channel !== "whatsapp") {
    return NextResponse.json({ error: "Desteklenmeyen kanal." }, { status: 400 })
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id, deletedAt: null },
      include: { customer: true },
    })

    if (!quote) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 })
    }

    const phone = quote.customer.whatsappPhone || quote.customer.phone
    if (!phone) {
      return NextResponse.json(
        { error: "Müşterinin WhatsApp/telefon numarası yok." },
        { status: 400 }
      )
    }

    // Generate PDF first
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const pdfRes = await fetch(`${baseUrl}/api/admin/quotes/${id}/pdf`, {
      method: "POST",
      headers: { Cookie: req.headers.get("cookie") ?? "" },
    })

    if (!pdfRes.ok) {
      return NextResponse.json({ error: "PDF oluşturulamadı." }, { status: 500 })
    }

    // Update status to SENT
    if (quote.status === "DRAFT") {
      await prisma.quote.update({
        where: { id },
        data: { status: "SENT" },
      })
    }

    // TODO: Send via WhatsApp using existing WhatsApp integration
    // This would use the Baileys/whatsapp-web.js integration
    // For now, store the PDF URL and mark as sent
    await prisma.quote.update({
      where: { id },
      data: {
        pdfUrl: `/api/admin/quotes/${id}/pdf`,
        status: "SENT",
      },
    })

    return NextResponse.json({
      data: {
        success: true,
        phone,
        message: "Teklif gönderildi olarak işaretlendi. WhatsApp entegrasyonu için PDF hazır.",
      },
    })
  } catch (err) {
    console.error("[POST /api/admin/quotes/[id]/send]", err)
    return NextResponse.json({ error: "Teklif gönderilemedi." }, { status: 500 })
  }
}
