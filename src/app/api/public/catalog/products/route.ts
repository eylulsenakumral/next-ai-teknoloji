import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

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

    const where = {
      deletedAt: null,
      isActive: true,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      ...(brandSlug ? { brand: { slug: brandSlug } } : {}),
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
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
            select: { stockQuantity: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    const data = products.map((p) => {
      const totalStock = p.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)
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
