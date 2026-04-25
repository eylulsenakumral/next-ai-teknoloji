import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withCache, CacheKey, TTL } from "@/lib/cache"

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
  imageUrl: string | null
  children: CategoryTreeNode[]
}

type PrismaCategory = {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  imageUrl: string | null
  _count: { products: number; children: number }
  children?: PrismaCategory[]
}

function mapCategory(cat: PrismaCategory): CategoryTreeNode {
  const children = (cat.children ?? []).map(mapCategory)
  const childrenProductCount = children.reduce((sum, c) => sum + c.productCount, 0)
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId,
    depth: cat.depth,
    productCount: cat._count.products + childrenProductCount,
    imageUrl: cat.imageUrl,
    children,
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
/* ------------------------------------------------------------------ */

const EXCLUDED_FROM_SEARCH = [
  "Tüm Ürünler",
  "Bilgisayar Bileşenleri",
  "Güvenlik & CCTV Ürünleri",
  "Güvenlik Ürünleri",
  "Kablo & Çevirici",
  "Kesintisiz Güç Kaynakları",
  "Kişisel Bilgisayarlar",
  "Kurumsal Ürünler",
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const flat = searchParams.get("flat") === "true"

    // Flat list - sidebar filtreler ve arama icin (Redis cache)
    if (flat) {
      const flatData = await withCache(
        CacheKey.categoryList("flat"),
        TTL.CATEGORY_LIST,
        async () => {
          const categories = await prisma.category.findMany({
            where: {
              deletedAt: null,
              isActive: true,
              name: { notIn: EXCLUDED_FROM_SEARCH },
            },
            orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              depth: true,
              imageUrl: true,
              _count: {
                select: {
                  products: { where: { deletedAt: null, isActive: true } },
                },
              },
            },
          })

          return categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            parentId: cat.parentId,
            depth: cat.depth,
            productCount: cat._count.products,
            imageUrl: cat.imageUrl,
          }))
        }
      )

      return NextResponse.json(
        { data: flatData },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
      )
    }

    // Tree yapisi (default) - 5 seviye nested (Redis cache)
    const tree = await withCache(
      CacheKey.categoryTree(),
      TTL.CATEGORY_TREE,
      async () => {
        const categories = await prisma.category.findMany({
          where: { deletedAt: null, isActive: true, parentId: null },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: buildPublicInclude(4),
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (categories as any[]).map(mapCategory)
      }
    )

    return NextResponse.json(
      { data: tree },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    )
  } catch {
    return NextResponse.json(
      { error: "Kategori agaci yuklenemedi." },
      { status: 500 }
    )
  }
}
