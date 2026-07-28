import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/* ------------------------------------------------------------------ */
/*  GET /api/public/categories/[slug]                                  */
/*  Kategori detay: breadcrumb, alt kategoriler, ürün sayısı           */
/* ------------------------------------------------------------------ */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Kategoriyi bul
    const category = await prisma.category.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      include: {
        _count: {
          select: {
            products: { where: { deletedAt: null, isActive: true } },
            children: { where: { deletedAt: null, isActive: true } },
          },
        },
        children: {
          where: { deletedAt: null, isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            _count: {
              select: {
                products: { where: { deletedAt: null, isActive: true } },
                children: { where: { deletedAt: null, isActive: true } },
              },
            },
            children: {
              where: { deletedAt: null, isActive: true },
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
              include: {
                _count: {
                  select: {
                    products: { where: { deletedAt: null, isActive: true } },
                    children: { where: { deletedAt: null, isActive: true } },
                  },
                },
                children: {
                  where: { deletedAt: null, isActive: true },
                  orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                  include: {
                    _count: {
                      select: {
                        products: { where: { deletedAt: null, isActive: true } },
                        children: { where: { deletedAt: null, isActive: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Kategori bulunamadi." },
        { status: 404 }
      )
    }

    // Breadcrumb chain - parentId'yi takip ederek yukari cik
    const breadcrumb: Array<{ id: string; name: string; slug: string; depth: number }> = []
    let currentParentId: string | null = category.parentId

    while (currentParentId) {
      const parent = await prisma.category.findFirst({
        where: { id: currentParentId, deletedAt: null, isActive: true },
        select: { id: true, name: true, slug: true, parentId: true, depth: true },
      })
      if (!parent) break
      breadcrumb.unshift({
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        depth: parent.depth,
      })
      currentParentId = parent.parentId
    }

    // Tree mapper (recursive)
    type NodeWithCount = {
      id: string
      name: string
      slug: string
      parentId: string | null
      depth: number
      _count: { products: number; children: number }
      children?: NodeWithCount[]
    }

    type MappedNode = {
      id: string
      name: string
      slug: string
      parentId: string | null
      depth: number
      productCount: number
      childrenCount: number
      children: MappedNode[]
    }

    function mapNode(node: NodeWithCount): MappedNode {
      return {
        id: node.id,
        name: node.name,
        slug: node.slug,
        parentId: node.parentId,
        depth: node.depth,
        productCount: node._count.products,
        childrenCount: node._count.children,
        children: (node.children ?? []).map(mapNode),
      }
    }

    return NextResponse.json(
      {
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? null,
          imageUrl: category.imageUrl ?? null,
          depth: category.depth,
          parentId: category.parentId,
          productCount: category._count.products,
          breadcrumb,
          children: (category.children ?? []).map((c) =>
            mapNode(c as unknown as NodeWithCount)
          ),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    )
  } catch {
    return NextResponse.json(
      { error: "Kategori detayi yuklenemedi." },
      { status: 500 }
    )
  }
}
