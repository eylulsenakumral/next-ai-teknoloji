import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { hash } from "bcryptjs"
import { randomBytes } from "crypto"

// GET /api/customers — Admin: Müşteri listesi
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const sortBy = searchParams.get("sortBy") ?? "createdAt"
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc"

  const allowedSortFields = ["createdAt", "companyName", "dealerCode", "balance", "status"]
  const safeSort = allowedSortFields.includes(sortBy) ? sortBy : "createdAt"

  const validStatuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "BLACKLISTED"]

  const where = {
    deletedAt: null,
    ...(status && validStatuses.includes(status)
      ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "BLACKLISTED" }
      : {}),
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" as const } },
            { dealerCode: { contains: search, mode: "insensitive" as const } },
            { contactName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { taxNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [safeSort]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        dealerCode: true,
        companyName: true,
        tradeName: true,
        contactName: true,
        phone: true,
        email: true,
        city: true,
        status: true,
        balance: true,
        creditLimit: true,
        discountRate: true,
        createdAt: true,
        lastLoginAt: true,
        lastOrderAt: true,
        approvedAt: true,
        _count: {
          select: {
            orders: { where: { deletedAt: null } },
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ])

  return NextResponse.json({
    data: customers,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

// POST /api/customers — Hızlı müşteri oluştur (teklif formu için)
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const { companyName, dealerCode, status } = body as {
    companyName?: string
    dealerCode?: string
    status?: string
  }

  if (!companyName) {
    return NextResponse.json({ error: "Firma adı gereklidir." }, { status: 400 })
  }

  const code = dealerCode || `BAYI-${Date.now().toString(36).toUpperCase()}`
  const passwordHash = await hash(randomBytes(12).toString("hex"), 10)

  try {
    const customer = await prisma.customer.create({
      data: {
        companyName,
        dealerCode: code,
        passwordHash,
        status: (status as "APPROVED") || "PENDING",
        ...(status === "APPROVED" ? { approvedAt: new Date() } : {}),
      },
      select: {
        id: true,
        companyName: true,
        dealerCode: true,
        phone: true,
        email: true,
      },
    })

    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/customers]", err)
    return NextResponse.json({ error: "Müşteri oluşturulamadı." }, { status: 500 })
  }
}
