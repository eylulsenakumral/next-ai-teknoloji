import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { z } from "zod"

// ---------------------------------------------------------------------------
// GET /api/admin/campaigns
// Outlet veya Featured olan ürünleri listele
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")))
  const skip = (page - 1) * limit

  try {
    const where = {
      deletedAt: null,
      OR: [{ isOutlet: true }, { isFeatured: true }],
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          isFeatured: true,
          isOutlet: true,
          images: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          supplierProducts: {
            where: { deletedAt: null, isAvailable: true },
            select: { purchasePrice: true, stockQuantity: true },
            orderBy: { purchasePrice: "asc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("[GET /api/admin/campaigns]", err)
    return NextResponse.json({ error: "Kampanyalı ürünler yüklenemedi." }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/campaigns
// Ürünü kampanyaya ekle
// Body: { productId: string, type: "outlet" | "featured" }
// ---------------------------------------------------------------------------
const addSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["outlet", "featured"]),
})

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = addSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, type } = parsed.data

    const existing = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true, name: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(type === "outlet" ? { isOutlet: true } : { isFeatured: true }),
      },
      select: { id: true, name: true, isOutlet: true, isFeatured: true },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error("[POST /api/admin/campaigns]", err)
    return NextResponse.json({ error: "Ürün kampanyaya eklenemedi." }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/campaigns
// Ürünü kampanyadan çıkar
// Body: { productId: string, type?: "outlet" | "featured" | "all" }
// type belirtilmezse veya "all" ise her ikisi de false yapılır
// ---------------------------------------------------------------------------
const removeSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["outlet", "featured", "all"]).optional().default("all"),
})

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = removeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri.", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, type } = parsed.data

    const existing = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    const updateData =
      type === "outlet"
        ? { isOutlet: false }
        : type === "featured"
        ? { isFeatured: false }
        : { isOutlet: false, isFeatured: false }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: { id: true, name: true, isOutlet: true, isFeatured: true },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error("[DELETE /api/admin/campaigns]", err)
    return NextResponse.json({ error: "Ürün kampanyadan çıkarılamadı." }, { status: 500 })
  }
}
