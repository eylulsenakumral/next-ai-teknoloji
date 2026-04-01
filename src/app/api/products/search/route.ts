import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? "10")))

  if (q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { modelCode: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      barcode: true,
      sku: true,
      images: true,
      isActive: true,
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      supplierProducts: {
        where: { deletedAt: null, isAvailable: true },
        select: { purchasePrice: true, stockQuantity: true },
        orderBy: { purchasePrice: "asc" },
        take: 1,
      },
    },
    orderBy: { viewCount: "desc" },
  })

  return NextResponse.json({ data: products })
}
