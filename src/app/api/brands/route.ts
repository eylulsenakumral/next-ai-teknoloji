import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createBrandSchema } from "@/lib/validators/brand"
import { generateSlug } from "@/lib/utils/slug"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { withCache, invalidateBrandCache, CacheKey, TTL } from "@/lib/cache"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const search = searchParams.get("search") ?? ""
  const isActiveParam = searchParams.get("isActive")
  const sortBy = searchParams.get("sortBy") ?? "sortOrder"
  const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc"

  const where = {
    deletedAt: null,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(isActiveParam !== null ? { isActive: isActiveParam === "true" } : {}),
  }

  const cacheKey = CacheKey.brandList(
    new URLSearchParams(searchParams).toString() || "default"
  )

  const result = await withCache(cacheKey, TTL.BRAND_LIST, async () => {
    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      }),
      prisma.brand.count({ where }),
    ])
    return {
      data: brands,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const parsed = createBrandSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, slug, logoUrl, description, websiteUrl, isActive, sortOrder } = parsed.data

  const baseSlug = slug || generateSlug(name)
  let finalSlug = baseSlug
  let attempt = 0
  while (true) {
    const existing = await prisma.brand.findFirst({
      where: { slug: finalSlug, deletedAt: null },
    })
    if (!existing) break
    attempt++
    finalSlug = `${baseSlug}-${attempt}`
  }

  const brand = await prisma.brand.create({
    data: {
      name,
      slug: finalSlug,
      logoUrl: logoUrl || null,
      description: description || null,
      websiteUrl: websiteUrl || null,
      isActive,
      sortOrder,
      createdBy: session!.user.id,
    },
  })

  await invalidateBrandCache()

  return NextResponse.json({ data: brand }, { status: 201 })
}
