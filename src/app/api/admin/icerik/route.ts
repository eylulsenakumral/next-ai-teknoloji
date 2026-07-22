import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"

type ContentType = "solutions" | "sectors" | "references" | "faqs" | "milestones" | "testimonials" | "blog" | "pageSections" | "heroSlides" | "siteTexts" | "brands" | "categories"

const VALID_TYPES: ContentType[] = ["solutions", "sectors", "references", "faqs", "milestones", "testimonials", "blog", "pageSections", "heroSlides", "siteTexts", "brands", "categories"]

function validateType(type: string): type is ContentType {
  return VALID_TYPES.includes(type as ContentType)
}

async function fetchAll(type: ContentType) {
  const opts = { where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" as const }, { createdAt: "desc" as const }] }
  switch (type) {
    case "solutions": return prisma.solution.findMany(opts)
    case "sectors": return prisma.sector.findMany(opts)
    case "references": return prisma.referenceProject.findMany(opts)
    case "faqs": return prisma.faq.findMany(opts)
    case "milestones": return prisma.milestone.findMany(opts)
    case "testimonials": return prisma.testimonial.findMany(opts)
    case "blog": return prisma.blogPost.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" as const }, { publishedAt: "desc" as const }] })
    case "pageSections": return prisma.pageSection.findMany({ where: { deletedAt: null }, orderBy: [{ page: "asc" as const }, { section: "asc" as const }, { sortOrder: "asc" as const }] })
    case "heroSlides": return prisma.heroSlide.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" as const }] })
    case "siteTexts": return prisma.siteText.findMany({ orderBy: [{ page: "asc" as const }, { section: "asc" as const }, { sortOrder: "asc" as const }] })
    case "brands": return prisma.brand.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" as const }, { name: "asc" as const }], select: { id: true, name: true, slug: true, logoUrl: true, websiteUrl: true, isActive: true, sortOrder: true, createdAt: true } })
    case "categories": return prisma.category.findMany({ where: { deletedAt: null, parentId: null }, orderBy: [{ sortOrder: "asc" as const }, { name: "asc" as const }], select: { id: true, name: true, slug: true, imageUrl: true, isActive: true, sortOrder: true, depth: true, createdAt: true } })
  }
}

async function createOne(type: ContentType, data: Record<string, unknown>) {
  switch (type) {
    case "solutions": return prisma.solution.create({ data: data as never })
    case "sectors": return prisma.sector.create({ data: data as never })
    case "references": return prisma.referenceProject.create({ data: data as never })
    case "faqs": return prisma.faq.create({ data: data as never })
    case "milestones": return prisma.milestone.create({ data: data as never })
    case "testimonials": return prisma.testimonial.create({ data: data as never })
    case "blog": return prisma.blogPost.create({ data: data as never })
    case "pageSections": return prisma.pageSection.create({ data: data as never })
    case "heroSlides": return prisma.heroSlide.create({ data: data as never })
    case "siteTexts": return prisma.siteText.create({ data: data as never })
    case "brands": {
      const { name, slug, logoUrl, websiteUrl, isActive, sortOrder } = data
      return prisma.brand.create({ data: { name: String(name ?? ""), slug: String(slug ?? String(name ?? "").toLowerCase().replace(/\s+/g, "-")), logoUrl: logoUrl as string|null, websiteUrl: websiteUrl as string|null, isActive: Boolean(isActive ?? true), sortOrder: Number(sortOrder ?? 0) } as never })
    }
  }
}

// GET /api/admin/icerik?type=solutions
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const type = req.nextUrl.searchParams.get("type")
  if (!type || !validateType(type)) {
    return NextResponse.json({ error: "Geçersiz içerik tipi." }, { status: 400 })
  }

  try {
    const items = await fetchAll(type)
    return NextResponse.json({ data: items })
  } catch (err) {
    console.error(`[GET /api/admin/icerik?type=${type}]`, err)
    return NextResponse.json({ error: "İçerik yüklenemedi." }, { status: 500 })
  }
}

// POST /api/admin/icerik?type=solutions
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const type = req.nextUrl.searchParams.get("type")
  if (!type || !validateType(type)) {
    return NextResponse.json({ error: "Geçersiz içerik tipi." }, { status: 400 })
  }

  try {
    const body = await req.json()
    const created = await createOne(type, body)
    return NextResponse.json({ data: created })
  } catch (err) {
    console.error(`[POST /api/admin/icerik?type=${type}]`, err)
    return NextResponse.json({ error: "İçerik oluşturulamadı." }, { status: 500 })
  }
}
