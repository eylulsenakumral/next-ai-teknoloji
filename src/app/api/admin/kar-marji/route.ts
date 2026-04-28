import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"

// GET /api/admin/kar-marji — Tedarikçi marj listesi
export async function GET() {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        marginRate: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      data: suppliers.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        isActive: s.isActive,
        marginRate: Number(s.marginRate),
      })),
    })
  } catch (err) {
    console.error("[GET /api/admin/kar-marji]", err)
    return NextResponse.json({ error: "Marj listesi yüklenemedi." }, { status: 500 })
  }
}

// PATCH /api/admin/kar-marji — Tedarikçi marjı güncelle
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const body = await req.json()
    const { supplierId, marginRate } = body

    if (!supplierId || typeof supplierId !== "string") {
      return NextResponse.json({ error: "supplierId gerekli." }, { status: 400 })
    }

    const parsed = Number(marginRate)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 200) {
      return NextResponse.json(
        { error: "marginRate 0-200 arasında bir sayı olmalı." },
        { status: 400 }
      )
    }

    const updated = await prisma.supplier.update({
      where: { id: supplierId },
      data: { marginRate: parsed },
      select: { id: true, code: true, name: true, marginRate: true },
    })

    return NextResponse.json({
      data: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        marginRate: Number(updated.marginRate),
      },
    })
  } catch (err) {
    console.error("[PATCH /api/admin/kar-marji]", err)
    return NextResponse.json({ error: "Marj güncellenemedi." }, { status: 500 })
  }
}
