import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getDealerSession, requireDealerSession } from "@/lib/dealer-auth"

export async function GET(req: NextRequest) {
  const session = await getDealerSession()
  const authError = requireDealerSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { barcode: { startsWith: q } },
        { sku: { startsWith: q, mode: "insensitive" } },
        { modelCode: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
    orderBy: { viewCount: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      barcode: true,
      sku: true,
      images: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
  })

  return NextResponse.json({
    results: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      barcode: p.barcode,
      sku: p.sku,
      image: p.images[0] ?? null,
      brand: p.brand?.name ?? null,
      category: p.category?.name ?? null,
    })),
  })
}
