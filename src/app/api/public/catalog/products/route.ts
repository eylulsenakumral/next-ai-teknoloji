import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const session = await getServerSession(authOptions)
    const isAuthenticated = !!session?.user

    const brandSlug = searchParams.get("brandSlug") ?? ""
    const categorySlug = searchParams.get("categorySlug") ?? ""
    const search = searchParams.get("search") ?? ""
    const sortBy = searchParams.get("sortBy") ?? "newest"
    const inStock = searchParams.get("inStock") === "true"
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))

    const orderBy =
      sortBy === "name-asc"
        ? { name: "asc" as const }
        : sortBy === "name-desc"
          ? { name: "desc" as const }
          : { createdAt: "desc" as const }

    // Kategori filtresi: seçilen kategori + tüm alt kategorileri dahil et
    let categoryFilter: Record<string, unknown> = {}
    if (categorySlug) {
      const cat = await prisma.category.findFirst({
        where: { slug: categorySlug, deletedAt: null, isActive: true },
        select: { id: true },
      })
      if (cat) {
        const allCats = await prisma.category.findMany({
          where: { deletedAt: null, isActive: true },
          select: { id: true, parentId: true },
        })
        const descendantIds = new Set<string>([cat.id])
        function findDescendants(parentId: string) {
          for (const c of allCats) {
            if (c.parentId === parentId && !descendantIds.has(c.id)) {
              descendantIds.add(c.id)
              findDescendants(c.id)
            }
          }
        }
        findDescendants(cat.id)
        categoryFilter = { categoryId: { in: [...descendantIds] } }
      }
    }

    const where = {
      deletedAt: null,
      isActive: true,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      ...(brandSlug ? { brand: { slug: brandSlug } } : {}),
      ...categoryFilter,
      ...(inStock
        ? { supplierProducts: { some: { deletedAt: null, isAvailable: true, stockQuantity: { gt: 0 } } } }
        : {}),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          description: true,
          specs: true,
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          supplierProducts: {
            where: { deletedAt: null, isAvailable: true },
            select: {
              stockQuantity: true,
              purchasePrice: isAuthenticated,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    const data = products.map((p) => {
      const totalStock = p.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)

      // Get lowest price if authenticated
      const prices = isAuthenticated
        ? p.supplierProducts
            .map((sp) => sp.purchasePrice)
            .filter((price) => price !== null)
            .map((price) => Number(price))
        : []

      const lowestPrice = isAuthenticated && prices.length > 0 ? Math.min(...prices) : null

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        images: p.images,
        description: p.description,
        specifications: p.specs,
        brand: p.brand,
        category: p.category,
        stockStatus: totalStock > 0,
        price: lowestPrice,
        currency: "TRY",
      }
    })

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[public/catalog/products] GET error:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
