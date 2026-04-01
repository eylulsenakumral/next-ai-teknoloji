import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const { items } = body as { items: { id: string; sortOrder: number }[] }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Siralama verisi bos." }, { status: 400 })
  }

  // Verify all categories exist and belong to same parent
  const categories = await prisma.category.findMany({
    where: { id: { in: items.map((i) => i.id) }, deletedAt: null },
    select: { id: true, parentId: true },
  })

  if (categories.length !== items.length) {
    return NextResponse.json(
      { error: "Bazi kategoriler bulunamadi." },
      { status: 404 }
    )
  }

  // Verify all have same parent
  const parentIds = new Set(categories.map((c) => c.parentId))
  if (parentIds.size > 1) {
    return NextResponse.json(
      { error: "Sadece ayni seviyedeki kategoriler siralanabilir." },
      { status: 400 }
    )
  }

  // Update sortOrder for each item in a transaction
  await prisma.$transaction(
    items.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, updatedBy: session!.user.id },
      })
    )
  )

  return NextResponse.json({ success: true, message: `${items.length} kategori yeniden siralandi.` })
}
