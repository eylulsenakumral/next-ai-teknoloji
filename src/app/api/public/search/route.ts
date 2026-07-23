import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Otomatik tamamlama (autocomplete) uç noktası.
 * Ürün adı, SKU (ürün kodu), model kodu ve barkodda arama yapar.
 * Fiyat DÖNDÜRMEZ — public arama önerileri fiyat içermez.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        brand: { isActive: true },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { modelCode: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        sku: true,
        modelCode: true,
        brand: { select: { name: true } },
      },
      take: 8,
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
