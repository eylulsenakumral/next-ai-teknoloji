import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { updateCategorySchema } from "@/lib/validators/category"
import { generateSlug } from "@/lib/utils/slug"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { invalidateCategoryCache } from "@/lib/cache"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const category = await prisma.category.findFirst({
    where: { id, deletedAt: null },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      },
      _count: {
        select: {
          products: { where: { deletedAt: null } },
          children: { where: { deletedAt: null } },
        },
      },
    },
  })

  if (!category) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ data: category })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.category.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, slug, parentId, description, imageUrl, isActive, sortOrder } = parsed.data

  let depth = existing.depth
  let path = existing.path ?? ""
  let finalParentId = existing.parentId

  const parentChanged = parentId !== undefined && parentId !== existing.parentId

  if (parentChanged) {
    if (parentId) {
      // Döngüsel referans kontrolü
      const allChildren = await prisma.category.findMany({
        where: { deletedAt: null },
        select: { id: true, parentId: true },
      })
      const childIds = new Set<string>()
      function collectChildren(catId: string) {
        for (const c of allChildren) {
          if (c.parentId === catId) {
            childIds.add(c.id)
            collectChildren(c.id)
          }
        }
      }
      collectChildren(id)
      if (childIds.has(parentId)) {
        return NextResponse.json(
          { error: "Bir kategori kendi alt kategorisine taşınamaz." },
          { status: 400 }
        )
      }

      const parent = await prisma.category.findFirst({
        where: { id: parentId, deletedAt: null },
      })
      if (!parent) {
        return NextResponse.json({ error: "Üst kategori bulunamadı." }, { status: 400 })
      }
      depth = parent.depth + 1
      const nameSlug = name ? generateSlug(name) : existing.slug
      path = parent.path ? `${parent.path}/${nameSlug}` : nameSlug
      finalParentId = parentId
    } else {
      depth = 0
      const nameSlug = name ? generateSlug(name) : existing.slug
      path = nameSlug
      finalParentId = null
    }
  }

  let finalSlug = existing.slug
  if (name && name !== existing.name && !slug) {
    const baseSlug = generateSlug(name)
    finalSlug = baseSlug
    let attempt = 0
    while (true) {
      const conflict = await prisma.category.findFirst({
        where: { slug: finalSlug, deletedAt: null, id: { not: id } },
      })
      if (!conflict) break
      attempt++
      finalSlug = `${baseSlug}-${attempt}`
    }
  } else if (slug && slug !== existing.slug) {
    let attempt = 0
    finalSlug = slug
    while (true) {
      const conflict = await prisma.category.findFirst({
        where: { slug: finalSlug, deletedAt: null, id: { not: id } },
      })
      if (!conflict) break
      attempt++
      finalSlug = `${slug}-${attempt}`
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      slug: finalSlug,
      parentId: finalParentId,
      depth,
      path,
      ...(description !== undefined ? { description: description || null } : {}),
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      updatedBy: session!.user.id,
    },
    include: {
      parent: { select: { id: true, name: true } },
    },
  })

  await invalidateCategoryCache()

  return NextResponse.json({ data: category })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.category.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 })
  }

  const childCount = await prisma.category.count({
    where: { parentId: id, deletedAt: null },
  })
  if (childCount > 0) {
    return NextResponse.json(
      { error: `Bu kategorinin ${childCount} alt kategorisi var. Önce alt kategorileri silin.` },
      { status: 400 }
    )
  }

  await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: session!.user.id },
  })

  await invalidateCategoryCache()

  return NextResponse.json({ success: true })
}
