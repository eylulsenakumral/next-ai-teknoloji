import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET /api/admin/cleanup-ergen — Ergen ürünlerini sil (Bearer token ile)
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== "Bearer cleanup-ergen-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ergen = await prisma.supplier.findFirst({ where: { code: { equals: "ergen", mode: "insensitive" } } })
  if (!ergen) return NextResponse.json({ error: "Ergen supplier bulunamadı" }, { status: 404 })

  const result = await prisma.supplierProduct.updateMany({
    where: { supplierId: ergen.id, deletedAt: null },
    data: { deletedAt: new Date(), isAvailable: false },
  })

  return NextResponse.json({ deleted: result.count })
}
