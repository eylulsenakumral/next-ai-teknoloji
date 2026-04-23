import { NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"

// GET /api/admin/cleanup-ergen — Ergen ürünlerini sil
export async function GET() {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const ergen = await prisma.supplier.findFirst({ where: { code: { equals: "ergen", mode: "insensitive" } } })
  if (!ergen) return NextResponse.json({ error: "Ergen supplier bulunamadı" }, { status: 404 })

  const result = await prisma.supplierProduct.updateMany({
    where: { supplierId: ergen.id, deletedAt: null },
    data: { deletedAt: new Date(), isAvailable: false },
  })

  return NextResponse.json({ deleted: result.count })
}
