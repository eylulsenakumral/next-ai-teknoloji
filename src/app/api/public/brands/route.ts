import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withCache, CacheKey, TTL } from "@/lib/cache"

export async function GET() {
  const brands = await withCache(
    CacheKey.brandList("public"),
    TTL.BRAND_LIST,
    () => prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })
  )
  return NextResponse.json({ data: brands })
}
