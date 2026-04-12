import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { CampaignSetType } from "@prisma/client"

/* ------------------------------------------------------------------ */
/*  GET /api/public/campaigns                                           */
/*  Query params:                                                       */
/*    - type=FEATURED|OUTLET|BUNDLE                                     */
/*    - limit=N (default 20)                                            */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const typeParam = searchParams.get("type")
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100)
    const now = new Date()

    const type = typeParam && Object.values(CampaignSetType).includes(typeParam as CampaignSetType)
      ? (typeParam as CampaignSetType)
      : undefined

    const campaigns = await prisma.campaignSet.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(type ? { type } : {}),
        AND: [
          {
            OR: [
              { validFrom: null },
              { validFrom: { lte: now } },
            ],
          },
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                description: true,
                brand: { select: { name: true, slug: true } },
                category: { select: { name: true, slug: true } },
                supplierProducts: {
                  where: { deletedAt: null, isAvailable: true },
                  select: { stockQuantity: true },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    // Compute stockStatus from supplierProducts
    const data = campaigns.map((c) => ({
      ...c,
      products: c.products.map((cp) => {
        const { supplierProducts, ...rest } = cp.product as typeof cp.product & { supplierProducts: { stockQuantity: number }[] }
        const totalStock = supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)
        return { ...cp, product: { ...rest, stockStatus: totalStock > 0 } }
      }),
    }))

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (err) {
    console.error("GET /api/public/campaigns error:", err)
    return NextResponse.json(
      { error: "Kampanyalar yuklenemedi." },
      { status: 500 }
    )
  }
}
