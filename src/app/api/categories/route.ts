import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createCategorySchema } from "@/lib/validators/category"
import { generateSlug } from "@/lib/utils/slug"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { withCache, invalidateCategoryCache, CacheKey, TTL } from "@/lib/cache"

export async function GET(req: NextRequest) {
  // Categories are public data, no auth required for GET
  const { searchParams } = new URL(req.url)
  const flat = searchParams.get("flat") === "true"
  const search = searchParams.get("search") ?? ""
  const isActiveParam = searchParams.get("isActive")
  const parentId = searchParams.get("parentId")

  // Admin session check — admin sees all, public only sees active
  const session = await getAdminSession()
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin"
  const isActiveFilter = isActiveParam !== null
    ? { isActive: isActiveParam === "true" }
    : isAdmin
      ? {}
      : { isActive: true }

  const where = {
    deletedAt: null,
    ...isActiveFilter,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(parentId === "null" ? { parentId: null } : parentId ? { parentId } : {}),
  }

  // Aktif filtresi — nested children/product count'lara da uygula
  const childWhere = { deletedAt: null, ...isActiveFilter }
  const productWhere = { deletedAt: null, ...(isAdmin ? {} : { isActive: true }) }

  if (flat) {
    const cacheKey = CacheKey.categoryList(
      new URLSearchParams(searchParams).toString() || "flat"
    )
    const result = await withCache(cacheKey, TTL.CATEGORY_LIST, async () => {
      const categories = await prisma.category.findMany({
        where,
        orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        include: {
          parent: { select: { id: true, name: true } },
          _count: {
            select: {
              children: { where: childWhere },
              products: { where: productWhere },
            },
          },
        },
      })
      return { data: categories }
    })
    return NextResponse.json(result)
  }

  // Tree yapısı
  const categories = await prisma.category.findMany({
    where: { ...where, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          children: { where: childWhere },
          products: { where: productWhere },
        },
      },
      children: {
        where: childWhere,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: {
            select: {
              children: { where: childWhere },
              products: { where: productWhere },
            },
          },
          children: {
            where: childWhere,
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
              _count: {
                select: {
                  children: { where: childWhere },
                  products: { where: productWhere },
                },
              },
              children: {
                where: childWhere,
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                include: {
                  _count: {
                    select: {
                      children: { where: childWhere },
                      products: { where: productWhere },
                    },
                  },
                  children: {
                    where: childWhere,
                    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                    include: {
                      _count: {
                        select: {
                          children: { where: childWhere },
                          products: { where: productWhere },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  return NextResponse.json({ data: categories })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, slug, parentId, description, imageUrl, isActive, sortOrder } = parsed.data

  let depth = 0
  let path = ""

  if (parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: parentId, deletedAt: null },
    })
    if (!parent) {
      return NextResponse.json({ error: "Üst kategori bulunamadı." }, { status: 400 })
    }
    depth = parent.depth + 1
    path = parent.path ? `${parent.path}/${generateSlug(name)}` : generateSlug(name)
  }

  const baseSlug = slug || generateSlug(name)
  let finalSlug = baseSlug
  let attempt = 0
  while (true) {
    const existing = await prisma.category.findFirst({
      where: { slug: finalSlug, deletedAt: null },
    })
    if (!existing) break
    attempt++
    finalSlug = `${baseSlug}-${attempt}`
  }

  if (!path) {
    path = finalSlug
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug: finalSlug,
      parentId: parentId ?? null,
      description: description || null,
      imageUrl: imageUrl || null,
      isActive,
      sortOrder,
      depth,
      path,
      createdBy: session!.user.id,
    },
    include: {
      parent: { select: { id: true, name: true } },
    },
  })

  await invalidateCategoryCache()

  return NextResponse.json({ data: category }, { status: 201 })
}
