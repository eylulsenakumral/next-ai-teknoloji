import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { changePasswordSchema } from "@/lib/validators/customer"

async function getDealerSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "dealer") {
    return null
  }
  return session
}

const updateProfileSchema = z.object({
  contactName: z.string().min(2, "Yetkili adı en az 2 karakter").max(255).optional(),
  contactTitle: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  phone2: z.string().max(50).optional().or(z.literal("")),
  whatsappPhone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(2000).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(10).optional().or(z.literal("")),
})

// GET /api/account/profile — Bayi: Kendi profil bilgileri
export async function GET() {
  const session = await getDealerSession()
  if (!session) {
    return NextResponse.json(
      { error: "Oturum açmanız gerekiyor." },
      { status: 401 }
    )
  }

  const customer = await prisma.customer.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: {
      id: true,
      dealerCode: true,
      companyName: true,
      tradeName: true,
      contactName: true,
      contactTitle: true,
      phone: true,
      phone2: true,
      email: true,
      taxOffice: true,
      taxNumber: true,
      address: true,
      city: true,
      district: true,
      postalCode: true,
      whatsappPhone: true,
      status: true,
      balance: true,
      creditLimit: true,
      discountRate: true,
      createdAt: true,
      lastLoginAt: true,
      approvedAt: true,
    },
  })

  if (!customer) {
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ data: customer })
}

// PUT /api/account/profile — Bayi: Profil güncelle veya şifre değiştir
export async function PUT(req: NextRequest) {
  const session = await getDealerSession()
  if (!session) {
    return NextResponse.json(
      { error: "Oturum açmanız gerekiyor." },
      { status: 401 }
    )
  }

  const body = await req.json()

  // Şifre değiştirme talebi mi?
  if (body.currentPassword !== undefined) {
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.findFirst({
      where: { id: session.user.id, deletedAt: null },
      select: { id: true, passwordHash: true },
    })

    if (!customer) {
      return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 })
    }

    const isValid = await bcrypt.compare(parsed.data.currentPassword, customer.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "Mevcut şifreniz hatalı." },
        { status: 400 }
      )
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
    await prisma.customer.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ message: "Şifreniz başarıyla güncellendi." })
  }

  // Profil güncelleme
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const customer = await prisma.customer.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true,
      contactName: true,
      phone: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ data: customer, message: "Profiliniz güncellendi." })
}
