import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { getDealerSession, requireDealerSession } from "@/lib/dealer-auth"
import { campaignSetFilterSchema } from "@/lib/validators/campaign-set"

// ---------------------------------------------------------------------------
// GET /api/dealer/campaign-sets
// Aktif kampanya setleri (onaylı bayilere özel)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getDealerSession()
  const authError = requireDealerSession(session)
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

  const { page, limit, type, search } = parsed.data
  const skip = (page - 1) * limit
  const now = new Date()

  try {
    const where: Prisma.CampaignSetWhereInput = {
      deletedAt: null,
      isActive: true,
      AND: [
        {
          OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        },
        {
          OR: [{ validUntil: null }, { validUntil: { gte: now } }],
        },
        ...(type !== undefined ? [{ type }] : []),
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { slug: { contains: search, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
      ],
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
          validFrom: true,
          validUntil: true,
          imageUrl: true,
          description: true,
          sortOrder: true,
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
    console.error("[GET /api/dealer/campaign-sets]", err)
    return NextResponse.json(
      { error: "Kampanya setleri yüklenemedi." },
      { status: 500 }
    )
  }
}
