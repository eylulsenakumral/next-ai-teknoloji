import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const product = await prisma.product.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        description: true,
        specs: true,
        categoryId: true,
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        supplierProducts: {
          where: { deletedAt: null, isAvailable: true },
          select: { stockQuantity: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    const totalStock = product.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)

    const relatedProducts = product.categoryId
      ? await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: product.id },
            isActive: true,
            deletedAt: null,
          },
          take: 4,
          orderBy: { viewCount: "desc" },
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            brand: { select: { name: true, slug: true } },
            category: { select: { name: true, slug: true } },
            supplierProducts: {
              where: { deletedAt: null, isAvailable: true },
              select: { stockQuantity: true },
            },
          },
        })
      : []

    // View count artır (fire-and-forget)
    prisma.product
      .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => null)

    return NextResponse.json({
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        images: product.images,
        description: product.description,
        specifications: product.specs,
        brand: product.brand,
        category: product.category,
        stockStatus: totalStock > 0,
        relatedProducts: relatedProducts.map((rp) => {
          const stock = rp.supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0)
          return {
            id: rp.id,
            name: rp.name,
            slug: rp.slug,
            images: rp.images,
            brand: rp.brand,
            category: rp.category,
            stockStatus: stock > 0,
          }
        }),
      },
    })
  } catch (error) {
    console.error("[public/catalog/products/[slug]] GET error:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
