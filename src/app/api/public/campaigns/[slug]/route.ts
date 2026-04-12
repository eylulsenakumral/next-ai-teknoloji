import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/* ------------------------------------------------------------------ */
/*  GET /api/public/campaigns/[slug]                                   */
/* ------------------------------------------------------------------ */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const now = new Date()

    const campaign = await prisma.campaignSet.findFirst({
      where: {
        slug,
        isActive: true,
        deletedAt: null,
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

    if (!campaign) {
      return NextResponse.json(
        { error: "Kampanya bulunamadi." },
        { status: 404 }
      )
    }

    // Compute stockStatus from supplierProducts
    const data = {
      ...campaign,
      products: campaign.products.map((cp) => {
        const { supplierProducts, ...rest } = cp.product as typeof cp.product & { supplierProducts: { stockQuantity: number }[] }
        const totalStock = supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)
        return { ...cp, product: { ...rest, stockStatus: totalStock > 0 } }
      }),
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (err) {
    console.error("GET /api/public/campaigns/[slug] error:", err)
    return NextResponse.json(
      { error: "Kampanya yuklenemedi." },
      { status: 500 }
    )
  }
}
