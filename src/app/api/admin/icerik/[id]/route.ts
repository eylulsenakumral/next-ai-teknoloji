import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"

type ContentType = "solutions" | "sectors" | "references" | "faqs" | "milestones" | "testimonials" | "blog" | "pageSections" | "heroSlides" | "siteTexts" | "brands" | "categories"

const VALID_TYPES: ContentType[] = ["solutions", "sectors", "references", "faqs", "milestones", "testimonials", "blog", "pageSections", "heroSlides", "siteTexts", "brands", "categories"]

function validateType(type: string): type is ContentType {
  return VALID_TYPES.includes(type as ContentType)
}

async function updateOne(type: ContentType, id: string, data: Record<string, unknown>) {
  switch (type) {
    case "solutions": return prisma.solution.update({ where: { id }, data: data as never })
    case "sectors": return prisma.sector.update({ where: { id }, data: data as never })
    case "references": return prisma.referenceProject.update({ where: { id }, data: data as never })
    case "faqs": return prisma.faq.update({ where: { id }, data: data as never })
    case "milestones": return prisma.milestone.update({ where: { id }, data: data as never })
    case "testimonials": return prisma.testimonial.update({ where: { id }, data: data as never })
    case "blog": return prisma.blogPost.update({ where: { id }, data: data as never })
    case "pageSections": return prisma.pageSection.update({ where: { id }, data: data as never })
    case "heroSlides": return prisma.heroSlide.update({ where: { id }, data: data as never })
    case "siteTexts": return prisma.siteText.update({ where: { id }, data: data as never })
    case "brands": {
      const updated = await prisma.brand.update({ where: { id }, data: data as never })
      // Cascade SADECE pasifleştirmede çalışır. Aktifleştirmede ürünlere
      // dokunulmaz — kullanıcının tek tek pasifleştirdiği ürünler korunur.
      if (data.isActive === false) {
        await prisma.product.updateMany({
          where: { brandId: id, deletedAt: null },
          data: { isActive: false },
        })
      }
      return updated
    }
    case "categories": {
      const updated = await prisma.category.update({ where: { id }, data: data as never })

      // Cascade SADECE pasifleştirmede çalışır: kategori kapatılınca tüm alt
      // kategoriler ve ürünler gizlenir. Aktifleştirmede ise SADECE kategorinin
      // kendisi açılır — ürünler/alt kategoriler kullanıcının bıraktığı gibi kalır
      // (tek tıkla yüzlerce ürünün geri açılması engellenir).
      if (data.isActive === false) {
        // Tüm descendant ID'leri topla (iterative — sınırsız derinlik)
        const allIds: string[] = [id]
        let currentIds = [id]
        while (currentIds.length > 0) {
          const children = await prisma.category.findMany({
            where: { parentId: { in: currentIds }, deletedAt: null },
            select: { id: true },
          })
          currentIds = children.map((c) => c.id)
          allIds.push(...currentIds)
        }

        // Tüm alt kategorileri pasifleştir
        await prisma.category.updateMany({
          where: { id: { in: allIds }, deletedAt: null },
          data: { isActive: false },
        })
        // Bu kategorilerdeki tüm ürünleri pasifleştir
        await prisma.product.updateMany({
          where: { categoryId: { in: allIds }, deletedAt: null },
          data: { isActive: false },
        })
      }
      return updated
    }
  }
}

async function softDelete(type: ContentType, id: string) {
  const data = { deletedAt: new Date(), isActive: false }
  switch (type) {
    case "solutions": return prisma.solution.update({ where: { id }, data: data as never })
    case "sectors": return prisma.sector.update({ where: { id }, data: data as never })
    case "references": return prisma.referenceProject.update({ where: { id }, data: data as never })
    case "faqs": return prisma.faq.update({ where: { id }, data: data as never })
    case "milestones": return prisma.milestone.update({ where: { id }, data: data as never })
    case "testimonials": return prisma.testimonial.update({ where: { id }, data: data as never })
    case "blog": return prisma.blogPost.update({ where: { id }, data: data as never })
    case "pageSections": return prisma.pageSection.update({ where: { id }, data: data as never })
    case "heroSlides": return prisma.heroSlide.update({ where: { id }, data: data as never })
    case "siteTexts": return prisma.siteText.update({ where: { id }, data: { deletedAt: new Date() } as never })
    case "brands": return prisma.brand.update({ where: { id }, data: data as never })
    case "categories": {
      // Tüm descendant ID'leri topla
      const allIds: string[] = [id]
      let currentIds = [id]
      while (currentIds.length > 0) {
        const children = await prisma.category.findMany({
          where: { parentId: { in: currentIds }, deletedAt: null },
          select: { id: true },
        })
        currentIds = children.map((c) => c.id)
        allIds.push(...currentIds)
      }
      // Tüm kategorileri sil + ürünleri pasifleştir
      await prisma.product.updateMany({
        where: { categoryId: { in: allIds }, deletedAt: null },
        data: { isActive: false },
      })
      await prisma.category.updateMany({
        where: { id: { in: allIds }, deletedAt: null },
        data: { deletedAt: new Date(), isActive: false },
      })
      return prisma.category.findUnique({ where: { id } })
    }
  }
}

// PUT /api/admin/icerik/[id]?type=solutions
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params
  const type = req.nextUrl.searchParams.get("type")
  if (!type || !validateType(type)) {
    return NextResponse.json({ error: "Geçersiz içerik tipi." }, { status: 400 })
  }

  try {
    const body = await req.json()
    const updated = await updateOne(type, id, body)
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error(`[PUT /api/admin/icerik/${id}?type=${type}]`, err)
    return NextResponse.json({ error: "İçerik güncellenemedi." }, { status: 500 })
  }
}

// DELETE /api/admin/icerik/[id]?type=solutions
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params
  const type = req.nextUrl.searchParams.get("type")
  if (!type || !validateType(type)) {
    return NextResponse.json({ error: "Geçersiz içerik tipi." }, { status: 400 })
  }

  try {
    await softDelete(type, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`[DELETE /api/admin/icerik/${id}?type=${type}]`, err)
    return NextResponse.json({ error: "İçerik silinemedi." }, { status: 500 })
  }
}
