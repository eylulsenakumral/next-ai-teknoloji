import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withCache, CacheKey, TTL } from "@/lib/cache"

// Recursive include builder - 5 seviye derinlik
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildNestedInclude(depth: number, activeOnly = false): any {
  const filter = activeOnly
    ? { deletedAt: null, isActive: true }
    : { deletedAt: null }

  if (depth === 0) {
    return {
      _count: {
        select: {
          children: { where: filter },
          products: { where: filter },
        },
      },
    }
  }

  return {
    _count: {
      select: {
        children: { where: filter },
        products: { where: filter },
      },
    },
    children: {
      where: filter,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: buildNestedInclude(depth - 1, activeOnly),
    },
  }
}

export async function GET() {
  const result = await withCache(CacheKey.categoryTree(), TTL.CATEGORY_TREE, async () => {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: buildNestedInclude(4, true),
    })
    return { data: categories.filter((cat) => cat.parentId === null) }
  })

  return NextResponse.json(result)
}
