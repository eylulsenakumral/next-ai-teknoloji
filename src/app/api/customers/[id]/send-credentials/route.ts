import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { sendSMS } from "@/services/netgsm.service"

// POST /api/customers/[id]/send-credentials
// Müşteriye bayi kodu ve şifresini SMS ile gönderir
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  let body: { password?: string } = {}
  try {
    body = (await req.json()) as { password?: string }
  } catch {
    // opsiyonel
  }

  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    select: {
      dealerCode: true,
      companyName: true,
      phone: true,
      whatsappPhone: true,
    },
  })

  if (!customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 })
  }

  // Telefon numarası kontrolü
  const phone = customer.phone || customer.whatsappPhone
  if (!phone) {
    return NextResponse.json(
      { error: "Müşterinin telefon numarası kayıtlı değil." },
      { status: 400 }
    )
  }

  // Şifre: form'dan gelen yeni şifre veya rastgele üret
  const password = body.password?.trim()
  if (!password) {
    return NextResponse.json(
      { error: "Gönderilecek şifre belirtilmedi. Önce yeni şifre alanını doldurun." },
      { status: 400 }
    )
  }

  // SMS mesajı (max 160 karakter, Türkçe karakter yok)
  const message = `Next AI Teknoloji B2B giris bilgileriniz - Bayi Kodu: ${customer.dealerCode} Sifre: ${password} Giris: next-ai.com.tr`

  const result = await sendSMS(phone, message)

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: `SMS ${phone} numarasına gönderildi.`,
      jobId: result.jobId,
    })
  }

  return NextResponse.json(
    { success: false, error: result.message },
    { status: 400 }
  )
}
