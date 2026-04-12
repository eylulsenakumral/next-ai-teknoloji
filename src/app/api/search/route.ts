import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        shortDescription: true,
        brand: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
      take: 20,
      orderBy: { viewCount: "desc" },
    })

    const results = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.images[0] ?? null,
      shortDescription: p.shortDescription ?? null,
      brandName: p.brand?.name ?? null,
      categoryName: p.category?.name ?? null,
      categorySlug: p.category?.slug ?? null,
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
