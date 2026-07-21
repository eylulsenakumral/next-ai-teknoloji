import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { invalidateCategoryCache } from "@/lib/cache"

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const { ids, action } = body as { ids: string[]; action: "activate" | "deactivate" | "delete" }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "En az bir kategori secilmeli." }, { status: 400 })
  }

  if (!["activate", "deactivate", "delete"].includes(action)) {
    return NextResponse.json({ error: "Gecersiz islem." }, { status: 400 })
  }

  // Verify categories exist
  const existing = await prisma.category.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, _count: { select: { children: { where: { deletedAt: null } } } } },
  })

  const foundIds = new Set(existing.map((c) => c.id))
  const notFound = ids.filter((id) => !foundIds.has(id))
  if (notFound.length > 0) {
    return NextResponse.json(
      { error: `${notFound.length} kategori bulunamadi.` },
      { status: 404 }
    )
  }

  if (action === "delete") {
    // Silme isleminde alt kategorisi olanlar kontrol edilsin
    const withChildren = existing.filter((c) => c._count.children > 0)
    if (withChildren.length > 0) {
      return NextResponse.json(
        { error: `${withChildren.length} kategorinin alt kategorileri var. Once alt kategorileri silin.` },
        { status: 400 }
      )
    }

    await prisma.category.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date(), updatedBy: session!.user.id },
    })
  } else {
    const isActive = action === "activate"
    await prisma.category.updateMany({
      where: { id: { in: ids } },
      data: { isActive, updatedBy: session!.user.id },
    })
  }

  const actionLabels = {
    activate: "aktif yapildi",
    deactivate: "pasif yapildi",
    delete: "silindi",
  }

  await invalidateCategoryCache()

  return NextResponse.json({
    success: true,
    message: `${ids.length} kategori ${actionLabels[action]}.`,
  })
}
