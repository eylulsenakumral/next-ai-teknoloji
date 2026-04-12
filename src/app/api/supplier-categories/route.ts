import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// ============================================================================
// GET /api/supplier-categories
// SupplierProduct.rawData._supplierCategory alanından benzersiz tedarikçi
// kategorilerini çek, SupplierCategoryMap ile LEFT JOIN yap.
// Query params: supplierCode (opsiyonel filtre)
// ============================================================================

interface SupplierCategoryRow {
  supplier_code: string
  supplier_name: string | null
  supplier_cat_name: string
  product_count: bigint
  map_id: string | null
  mapped_category_id: string | null
  mapped_category_name: string | null
  mapped_category_path: string | null
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const sp = req.nextUrl.searchParams
  const supplierCode = sp.get("supplierCode") || ""

  const rows = await prisma.$queryRaw<SupplierCategoryRow[]>`
    SELECT
      s.code AS supplier_code,
      s.name AS supplier_name,
      sp.raw_data->>'_supplierCategory' AS supplier_cat_name,
      COUNT(*) AS product_count,
      scm.id AS map_id,
      scm.category_id AS mapped_category_id,
      c.name AS mapped_category_name,
      c.path AS mapped_category_path
    FROM supplier_products sp
    INNER JOIN suppliers s
      ON s.id = sp.supplier_id
    LEFT JOIN supplier_category_maps scm
      ON scm.supplier_code = s.code
      AND scm.supplier_cat_name = sp.raw_data->>'_supplierCategory'
    LEFT JOIN categories c
      ON c.id = scm.category_id
      AND c.deleted_at IS NULL
    WHERE sp.deleted_at IS NULL
      AND sp.raw_data->>'_supplierCategory' IS NOT NULL
      AND sp.raw_data->>'_supplierCategory' != ''
      ${supplierCode ? Prisma.sql`AND s.code = ${supplierCode}` : Prisma.empty}
    GROUP BY
      s.code,
      s.name,
      sp.raw_data->>'_supplierCategory',
      scm.id,
      scm.category_id,
      c.name,
      c.path
    ORDER BY s.code, product_count DESC
  `

  const data = rows.map((r) => ({
    supplierCode: r.supplier_code,
    supplierName: r.supplier_name ?? null,
    supplierCatName: r.supplier_cat_name,
    productCount: Number(r.product_count),
    mappedCategoryId: r.mapped_category_id ?? null,
    mappedCategoryName: r.mapped_category_name ?? null,
    mappedCategoryPath: r.mapped_category_path ?? null,
    mapId: r.map_id ?? null,
  }))

  return NextResponse.json({
    success: true,
    data,
    total: data.length,
  })
}
