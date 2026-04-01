import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { updateBrandSchema } from "@/lib/validators/brand"
import { generateSlug } from "@/lib/utils/slug"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { invalidateBrandCache } from "@/lib/cache"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const brand = await prisma.brand.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  })

  if (!brand) {
    return NextResponse.json({ error: "Marka bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ data: brand })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.brand.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Marka bulunamadı." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateBrandSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, slug, logoUrl, description, websiteUrl, isActive, sortOrder } = parsed.data

  let finalSlug = existing.slug
  if (name && name !== existing.name && !slug) {
    const baseSlug = generateSlug(name)
    finalSlug = baseSlug
    let attempt = 0
    while (true) {
      const conflict = await prisma.brand.findFirst({
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
      const conflict = await prisma.brand.findFirst({
        where: { slug: finalSlug, deletedAt: null, id: { not: id } },
      })
      if (!conflict) break
      attempt++
      finalSlug = `${slug}-${attempt}`
    }
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      slug: finalSlug,
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(websiteUrl !== undefined ? { websiteUrl: websiteUrl || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      updatedBy: session!.user.id,
    },
  })

  await invalidateBrandCache()

  return NextResponse.json({ data: brand })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  const existing = await prisma.brand.findFirst({ where: { id, deletedAt: null } })
  if (!existing) {
    return NextResponse.json({ error: "Marka bulunamadı." }, { status: 404 })
  }

  await prisma.brand.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: session!.user.id },
  })

  await invalidateBrandCache()

  return NextResponse.json({ success: true })
}
