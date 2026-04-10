import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * GET /api/admin/scrapers/categories
 *
 * Tum sitelerin kategorilerini ve eslesme durumunu getirir.
 * Query params:
 *   - supplierCode: belirli bir site (ergen, bayikanali, b2bdepo, tesan, edenge, inox)
 *   - unmatched: "true" ise sadece eslesmemis kategorileri getir
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierCode = searchParams.get("supplierCode")
    const onlyUnmatched = searchParams.get("unmatched") === "true"

    // Bizim kategorileri cache'le (hierarchy ile)
    const ourCategories = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        depth: true,
        parentId: true,
        path: true,
      },
      orderBy: [{ depth: "asc" }, { sortOrder: "asc" }],
    })

    // Supplier category map'leri getir
    const whereClause: Record<string, unknown> = {}
    if (supplierCode) {
      whereClause.supplierCode = supplierCode
    }
    if (onlyUnmatched) {
      whereClause.categoryId = null
    }

    const supplierMaps = await prisma.supplierCategoryMap.findMany({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true, slug: true, path: true },
        },
      },
      orderBy: [{ supplierCode: "asc" }, { supplierCatName: "asc" }],
    })

    // Site bazli grupla
    const bySupplier: Record<
      string,
      {
        supplierCode: string
        total: number
        matched: number
        unmatched: number
        categories: Array<{
          id: string
          supplierCatName: string
          supplierCatUrl: string | null
          categoryId: string | null
          categoryName: string | null
          categorySlug: string | null
          categoryPath: string | null
          confidence: number
          matchMethod: string | null
        }>
      }
    > = {}

    for (const map of supplierMaps) {
      const code = map.supplierCode
      if (!bySupplier[code]) {
        bySupplier[code] = {
          supplierCode: code,
          total: 0,
          matched: 0,
          unmatched: 0,
          categories: [],
        }
      }

      const group = bySupplier[code]
      group.total += 1

      if (map.categoryId && map.category) {
        group.matched += 1
      } else {
        group.unmatched += 1
      }

      group.categories.push({
        id: map.id,
        supplierCatName: map.supplierCatName,
        supplierCatUrl: map.supplierCatUrl,
        categoryId: map.categoryId,
        categoryName: map.category?.name ?? null,
        categorySlug: map.category?.slug ?? null,
        categoryPath: map.category?.path ?? null,
        confidence: map.confidence,
        matchMethod: map.matchMethod,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ourCategoryCount: ourCategories.length,
        ourCategories: ourCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          depth: c.depth,
          parentId: c.parentId,
          path: c.path,
        })),
        suppliers: Object.values(bySupplier),
        totalMapped: supplierMaps.filter((m) => m.categoryId).length,
        totalUnmapped: supplierMaps.filter((m) => !m.categoryId).length,
      },
    })
  } catch (error) {
    console.error("[categories-route] Error:", error)
    return NextResponse.json(
      { success: false, error: "Kategoriler yuklenirken hata olustu" },
      { status: 500 },
    )
  }
}
