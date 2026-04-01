import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

type Params = { params: Promise<{ id: string }> }

// ============================================================================
// GET /api/suppliers/[id]/products
// Tedarikçi ürünlerini listele (filtre + sayfalama + özet)
// ============================================================================
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id: supplierId } = await params
  const sp = req.nextUrl.searchParams

  const page = Math.max(1, parseInt(sp.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "25", 10)))
  const q = sp.get("q")?.trim() || ""
  const categoryId = sp.get("categoryId") || ""
  const hasMatch = sp.get("hasMatch") // "true" | "false" | null

  // Supplier check
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, deletedAt: null },
    select: { id: true, name: true, code: true },
  })
  if (!supplier) {
    return NextResponse.json({ error: "Tedarikçi bulunamadı." }, { status: 404 })
  }

  // Build where clause
  const where: Record<string, unknown> = {
    supplierId,
    deletedAt: null,
  }

  if (q) {
    where.OR = [
      { externalName: { contains: q, mode: "insensitive" } },
      { externalBarcode: { contains: q, mode: "insensitive" } },
      { externalSku: { contains: q, mode: "insensitive" } },
    ]
  }

  if (hasMatch === "true") {
    where.productId = { not: null }
  } else if (hasMatch === "false") {
    where.productId = null
  }

  if (categoryId) {
    // Filter by _mappedCategoryId in rawData JSON
    where.rawData = { path: ["_mappedCategoryId"], equals: categoryId }
  }

  // Fetch products
  const [products, total] = await Promise.all([
    prisma.supplierProduct.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        externalId: true,
        externalName: true,
        externalBarcode: true,
        externalSku: true,
        externalUrl: true,
        purchasePrice: true,
        currency: true,
        vatRate: true,
        stockQuantity: true,
        isAvailable: true,
        rawData: true,
        lastScrapedAt: true,
        productId: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            categoryId: true,
            category: { select: { id: true, name: true, slug: true } },
            images: true,
          },
        },
      },
    }),
    prisma.supplierProduct.count({ where }),
  ])

  // Summary stats
  const [linked, mapped, categoryDist] = await Promise.all([
    prisma.supplierProduct.count({
      where: { supplierId, deletedAt: null, productId: { not: null } },
    }),
    prisma.supplierProduct.count({
      where: { supplierId, deletedAt: null, rawData: { path: ["_mappedCategoryId"], not: "null" } },
    }),
    prisma.$queryRaw<
      Array<{ categoryId: string | null; count: bigint }>
    >`
      SELECT raw_data->>'_mappedCategoryId' as "categoryId", COUNT(*)::int as count
      FROM supplier_products
      WHERE supplier_id = ${supplierId}::uuid AND deleted_at IS NULL
      GROUP BY raw_data->>'_mappedCategoryId'
      ORDER BY count DESC
    `,
  ])

  const totalAll = await prisma.supplierProduct.count({
    where: { supplierId, deletedAt: null },
  })

  return NextResponse.json({
    supplier,
    products,
    total,
    totalPages: Math.ceil(total / limit),
    summary: {
      total: totalAll,
      linked,
      mapped,
      categoryDistribution: categoryDist.map((c) => ({
        categoryId: c.categoryId,
        count: Number(c.count),
      })),
    },
  })
}
