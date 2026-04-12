import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

type Params = { params: Promise<{ id: string }> }

// ============================================================================
// PATCH /api/supplier-category-maps/[id]
// Eşleşmeyi güncelle (categoryId değişebilir → ürünleri de güncelle)
// ============================================================================
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.supplierCategoryMap.findUnique({
    where: { id },
  })
  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Eşleşme bulunamadı." },
      { status: 404 }
    )
  }

  const body = (await req.json()) as {
    categoryId?: string | null
    supplierCatUrl?: string | null
    isActive?: boolean
    matchMethod?: string | null
    confidence?: number | null
  }

  const updateData: Record<string, unknown> = {}
  if ("categoryId" in body) updateData.categoryId = body.categoryId ?? null
  if ("supplierCatUrl" in body) updateData.supplierCatUrl = body.supplierCatUrl ?? null
  if (typeof body.isActive === "boolean") updateData.isActive = body.isActive
  if ("matchMethod" in body) updateData.matchMethod = body.matchMethod ?? null
  if (typeof body.confidence === "number") updateData.confidence = body.confidence

  const updated = await prisma.supplierCategoryMap.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.supplierCategoryMap.update>[0]["data"],
    include: {
      category: {
        select: { id: true, name: true, slug: true, path: true },
      },
    },
  })

  let updatedProductCount = 0

  // categoryId değiştiyse ürünleri güncelle
  const categoryChanged = "categoryId" in body && body.categoryId !== existing.categoryId
  if (categoryChanged) {
    const newCategoryId = body.categoryId ?? null
    const { supplierCode, supplierCatName } = existing

    const supplier = await prisma.supplier.findFirst({
      where: { code: supplierCode, deletedAt: null },
      select: { id: true },
    })

    if (supplier) {
      const affected = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM supplier_products
        WHERE supplier_id = ${supplier.id}::uuid
          AND deleted_at IS NULL
          AND raw_data->>'_supplierCategory' = ${supplierCatName}
      `

      if (affected.length > 0) {
        const ids = affected.map((r) => r.id)

        if (newCategoryId) {
          await prisma.$executeRaw`
            UPDATE supplier_products
            SET raw_data = jsonb_set(
              COALESCE(raw_data, '{}')::jsonb,
              '{_mappedCategoryId}',
              ${JSON.stringify(newCategoryId)}::jsonb
            ),
            updated_at = NOW()
            WHERE id = ANY(${ids}::uuid[])
          `
        } else {
          await prisma.$executeRaw`
            UPDATE supplier_products
            SET raw_data = raw_data - '_mappedCategoryId',
            updated_at = NOW()
            WHERE id = ANY(${ids}::uuid[])
          `
        }

        updatedProductCount = affected.length
      }
    }
  }

  return NextResponse.json({ success: true, data: updated, updatedProductCount })
}

// ============================================================================
// DELETE /api/supplier-category-maps/[id]
// Eşleşmeyi sil (ürünlerin categoryId'si değişmez, sadece mapping silinir)
// ============================================================================
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.supplierCategoryMap.findUnique({
    where: { id },
  })
  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Eşleşme bulunamadı." },
      { status: 404 }
    )
  }

  await prisma.supplierCategoryMap.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
