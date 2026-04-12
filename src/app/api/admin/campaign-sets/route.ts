import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { generateSlug } from "@/lib/utils/slug"
import {
  createCampaignSetSchema,
  campaignSetFilterSchema,
} from "@/lib/validators/campaign-set"

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base
  let counter = 1
  while (true) {
    const existing = await prisma.campaignSet.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    })
    if (!existing) return slug
    slug = `${base}-${counter++}`
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/campaign-sets
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const parsed = campaignSetFilterSchema.safeParse(
    Object.fromEntries(searchParams.entries())
  )
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz filtre parametreleri.", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { page, limit, type, isActive, search } = parsed.data
  const skip = (page - 1) * limit

  try {
    const where = {
      deletedAt: null,
      ...(type !== undefined ? { type } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [sets, total] = await Promise.all([
      prisma.campaignSet.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          discountPct: true,
          price: true,
          isActive: true,
          sortOrder: true,
          validFrom: true,
          validUntil: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { products: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.campaignSet.count({ where }),
    ])

    return NextResponse.json({
      data: sets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("[GET /api/admin/campaign-sets]", err)
    return NextResponse.json(
      { error: "Kampanya setleri yüklenemedi." },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/campaign-sets
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = createCampaignSetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const slug = await ensureUniqueSlug(generateSlug(data.name))

    const set = await prisma.campaignSet.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        type: data.type,
        discountPct: data.discountPct != null ? String(data.discountPct) : null,
        price: data.price != null ? String(data.price) : null,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        minPurchaseAmount:
          data.minPurchaseAmount != null ? String(data.minPurchaseAmount) : null,
        maxUsageCount: data.maxUsageCount ?? null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        metadata:
          data.metadata === null || data.metadata === undefined
            ? Prisma.JsonNull
            : (data.metadata as Prisma.InputJsonValue),
        createdBy: session!.user.id,
        updatedBy: session!.user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: set }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/admin/campaign-sets]", err)
    return NextResponse.json(
      { error: "Kampanya seti oluşturulamadı." },
      { status: 500 }
    )
  }
}
