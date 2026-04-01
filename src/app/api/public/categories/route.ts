import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  productCount: number
  children: CategoryTreeNode[]
}

type PrismaCategory = {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  _count: { products: number; children: number }
  children?: PrismaCategory[]
}

function mapCategory(cat: PrismaCategory): CategoryTreeNode {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId,
    depth: cat.depth,
    productCount: cat._count.products,
    children: (cat.children ?? []).map(mapCategory),
  }
}

/* ------------------------------------------------------------------ */
/*  Recursive include builder - 5 seviye                               */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPublicInclude(depth: number): any {
  const filter = { deletedAt: null, isActive: true }

  if (depth === 0) {
    return {
      _count: {
        select: { products: { where: filter } },
      },
    }
  }

  return {
    _count: {
      select: { products: { where: filter } },
    },
    children: {
      where: filter,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: buildPublicInclude(depth - 1),
    },
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/public/categories                                         */
/*  Query params:                                                      */
/*    - flat=true    -> Flat list with parentId, depth                 */
/*    - (default)    -> Nested tree (root categories with children)    */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const flat = searchParams.get("flat") === "true"

    // Flat list - sidebar filtreler ve arama icin
    if (flat) {
      const categories = await prisma.category.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          depth: true,
          _count: {
            select: {
              products: { where: { deletedAt: null, isActive: true } },
            },
          },
        },
      })

      const flatData = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        depth: cat.depth,
        productCount: cat._count.products,
      }))

      return NextResponse.json(
        { data: flatData },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      )
    }

    // Tree yapisi (default) - 5 seviye nested
    const categories = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: buildPublicInclude(4),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tree: CategoryTreeNode[] = (categories as any[]).map(mapCategory)

    return NextResponse.json(
      { data: tree },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    )
  } catch {
    return NextResponse.json(
      { error: "Kategori agaci yuklenemedi." },
      { status: 500 }
    )
  }
}
