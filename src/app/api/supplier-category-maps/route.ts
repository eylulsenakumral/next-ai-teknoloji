import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// ============================================================================
// GET /api/supplier-category-maps
// Tüm eşleşmeleri listele (supplier ve category bilgileriyle birlikte)
// Query params: supplierCode (opsiyonel filtre), page, limit
// ============================================================================
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const sp = req.nextUrl.searchParams
  const supplierCode = sp.get("supplierCode") || ""
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "50", 10)))

  const where: Record<string, unknown> = {}
  if (supplierCode) {
    where.supplierCode = supplierCode
  }

  const [maps, total] = await Promise.all([
    prisma.supplierCategoryMap.findMany({
      where,
      orderBy: [{ supplierCode: "asc" }, { supplierCatName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, slug: true, path: true },
        },
      },
    }),
    prisma.supplierCategoryMap.count({ where }),
  ])

  // Supplier adlarını çek (code'a göre)
  const supplierCodes = [...new Set(maps.map((m) => m.supplierCode))]
  const suppliers = await prisma.supplier.findMany({
    where: { code: { in: supplierCodes }, deletedAt: null },
    select: { code: true, name: true },
  })
  const supplierByCode = Object.fromEntries(suppliers.map((s) => [s.code, s.name]))

  const data = maps.map((m) => ({
    ...m,
    supplierName: supplierByCode[m.supplierCode] ?? null,
  }))

  return NextResponse.json({
    success: true,
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

// ============================================================================
// POST /api/supplier-category-maps
// Yeni eşleşme oluştur (upsert) ve ilgili ürünleri güncelle
// Body: { supplierCode, supplierCatName, categoryId, supplierCatUrl? }
// ============================================================================
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = (await req.json()) as {
    supplierCode?: string
    supplierCatName?: string
    categoryId?: string | null
    supplierCatUrl?: string | null
  }

  if (!body.supplierCode?.trim()) {
    return NextResponse.json({ success: false, error: "supplierCode zorunludur." }, { status: 400 })
  }
  if (!body.supplierCatName?.trim()) {
    return NextResponse.json(
      { success: false, error: "supplierCatName zorunludur." },
      { status: 400 }
    )
  }

  const supplierCode = body.supplierCode.trim()
  const supplierCatName = body.supplierCatName.trim()
  const categoryId = body.categoryId ?? null
  const supplierCatUrl = body.supplierCatUrl ?? null

  // Upsert — @@unique([supplierCode, supplierCatName]) kullanılır
  const map = await prisma.supplierCategoryMap.upsert({
    where: {
      supplierCode_supplierCatName: { supplierCode, supplierCatName },
    },
    create: {
      supplierCode,
      supplierCatName,
      supplierCatUrl,
      categoryId,
      matchMethod: "MANUAL",
      confidence: 100,
    },
    update: {
      supplierCatUrl,
      categoryId,
      matchMethod: "MANUAL",
      confidence: 100,
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true, path: true },
      },
    },
  })

  // Supplier'ı bul (supplierId için)
  const supplier = await prisma.supplier.findFirst({
    where: { code: supplierCode, deletedAt: null },
    select: { id: true },
  })

  let updatedProductCount = 0

  if (supplier) {
    // Bu tedarikçi + kategori adıyla eşleşen SupplierProduct kayıtlarını güncelle
    // rawData._supplierCategory alanı supplierCatName'e eşit olanları bul
    const affected = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM supplier_products
      WHERE supplier_id = ${supplier.id}::uuid
        AND deleted_at IS NULL
        AND raw_data->>'_supplierCategory' = ${supplierCatName}
    `

    if (affected.length > 0) {
      const ids = affected.map((r) => r.id)

      if (categoryId) {
        // categoryId set et
        await prisma.$executeRaw`
          UPDATE supplier_products
          SET raw_data = jsonb_set(
            COALESCE(raw_data, '{}')::jsonb,
            '{_mappedCategoryId}',
            ${JSON.stringify(categoryId)}::jsonb
          ),
          updated_at = NOW()
          WHERE id = ANY(${ids}::uuid[])
        `
      } else {
        // categoryId null ise _mappedCategoryId alanını kaldır
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

  return NextResponse.json(
    { success: true, data: map, updatedProductCount },
    { status: 201 }
  )
}
