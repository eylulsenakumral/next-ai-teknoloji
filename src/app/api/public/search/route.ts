import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")

  if (!query || query.trim().length === 0) {
    return NextResponse.json([])
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        manualPrice: true,
        images: true,
        slug: true,
      },
      take: 20,
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
