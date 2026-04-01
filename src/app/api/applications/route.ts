import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { dealerApplicationSchema } from "@/lib/validators/customer"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// POST /api/applications — Public: Yeni bayi başvurusu
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // kvkkConsent frontend'de zorunlu ama DB'de yok, sadece validate ediyoruz
    const parsed = dealerApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz form verisi.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      companyName,
      contactName,
      phone,
      email,
      taxOffice,
      taxNumber,
      address,
      city,
      taxCertificateUrl,
      businessType,
      referenceInfo,
    } = parsed.data

    // Aynı e-posta ile aktif bekleyen başvuru var mı?
    const existingPending = await prisma.dealerApplication.findFirst({
      where: {
        email: email.toLowerCase(),
        status: { in: ["PENDING", "NEEDS_INFO"] },
      },
    })

    if (existingPending) {
      return NextResponse.json(
        {
          error:
            "Bu e-posta adresiyle zaten bekleyen bir başvurunuz bulunmaktadır. Lütfen inceleme sürecini bekleyin.",
        },
        { status: 409 }
      )
    }

    const application = await prisma.dealerApplication.create({
      data: {
        companyName,
        contactName,
        phone,
        email: email.toLowerCase(),
        taxOffice: taxOffice || null,
        taxNumber: taxNumber || null,
        address: address || null,
        city: city || null,
        taxCertificateUrl: taxCertificateUrl || null,
        businessType: businessType || null,
        referenceInfo: referenceInfo || null,
        status: "PENDING",
      },
    })

    console.log(
      `[BAŞVURU] Yeni bayi başvurusu: ${application.companyName} <${application.email}> — ID: ${application.id}`
    )

    return NextResponse.json(
      {
        success: true,
        message:
          "Başvurunuz alındı. Ekibimiz en kısa sürede değerlendirip size dönüş yapacaktır.",
        applicationId: application.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[applications/POST]", error)
    return NextResponse.json(
      { error: "Başvuru kaydedilirken hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    )
  }
}

// GET /api/applications — Admin: Başvuru listesi
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const status = searchParams.get("status") ?? ""
  const search = searchParams.get("search") ?? ""

  const where = {
    ...(status && ["PENDING", "APPROVED", "REJECTED", "NEEDS_INFO"].includes(status)
      ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO" }
      : {}),
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            { contactName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [applications, total] = await Promise.all([
    prisma.dealerApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: { id: true, dealerCode: true, status: true },
        },
      },
    }),
    prisma.dealerApplication.count({ where }),
  ])

  return NextResponse.json({
    data: applications,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}
