import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import bcrypt from "bcryptjs"
import { randomInt } from "crypto"
import { z } from "zod"

// Bayi kodu üretimi: NAT-XXXX (4 haneli artan)
async function generateDealerCode(): Promise<string> {
  const last = await prisma.customer.findFirst({
    where: { dealerCode: { startsWith: "NAT-" } },
    orderBy: { dealerCode: "desc" },
    select: { dealerCode: true },
  })

  let nextNum = 1001
  if (last?.dealerCode) {
    const numPart = parseInt(last.dealerCode.replace("NAT-", ""), 10)
    if (!isNaN(numPart)) {
      nextNum = numPart + 1
    }
  }

  return `NAT-${nextNum.toString().padStart(4, "0")}`
}

// Güvenli geçici şifre üretimi
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "needs_info"]),
  adminNotes: z.string().max(2000).optional(),
})

// GET /api/applications/[id] — Başvuru detay (admin)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const application = await prisma.dealerApplication.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          dealerCode: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })

  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ data: application })
}

// POST /api/applications/[id] — Başvuru işlem (onayla / reddet)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const body = await req.json()
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz işlem.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { action, adminNotes } = parsed.data

  const application = await prisma.dealerApplication.findUnique({ where: { id } })
  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 })
  }

  if (application.status === "APPROVED") {
    return NextResponse.json(
      { error: "Bu başvuru zaten onaylanmış." },
      { status: 409 }
    )
  }

  const reviewedBy = session!.user.id
  const now = new Date()

  // ONAYLA
  if (action === "approve") {
    const dealerCode = await generateDealerCode()
    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const [customer] = await prisma.$transaction([
      prisma.customer.create({
        data: {
          dealerCode,
          passwordHash,
          companyName: application.companyName,
          contactName: application.contactName,
          phone: application.phone,
          email: application.email,
          taxOffice: application.taxOffice,
          taxNumber: application.taxNumber,
          address: application.address,
          city: application.city,
          taxCertificateUrl: application.taxCertificateUrl,
          status: "APPROVED",
          approvedAt: now,
          approvedBy: reviewedBy,
          balance: 0,
          creditLimit: 0,
          discountRate: 0,
        },
      }),
      prisma.dealerApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          adminNotes: adminNotes ?? null,
          reviewedAt: now,
          reviewedBy,
        },
      }),
    ])

    // Başvuruyu müşteriyle ilişkilendir
    await prisma.dealerApplication.update({
      where: { id },
      data: { customerId: customer.id },
    })

    // Not: E-posta/SMS entegrasyonu henüz yok — geçici şifre yanıtta admin'e döner,
    // admin tarafından manuel iletilir. Production log'larına düz metin şifre YAZMA.

    return NextResponse.json({
      success: true,
      message: "Başvuru onaylandı. Bayi hesabı oluşturuldu.",
      dealerCode,
      tempPassword,
      customerId: customer.id,
    })
  }

  // REDDET
  if (action === "reject") {
    await prisma.dealerApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminNotes: adminNotes ?? null,
        reviewedAt: now,
        reviewedBy,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Başvuru reddedildi.",
    })
  }

  // BİLGİ İSTE
  if (action === "needs_info") {
    await prisma.dealerApplication.update({
      where: { id },
      data: {
        status: "NEEDS_INFO",
        adminNotes: adminNotes ?? null,
        reviewedAt: now,
        reviewedBy,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Ek bilgi talebi başvuruya kaydedildi.",
    })
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 })
}
