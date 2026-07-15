import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getDealerSession, requireDealerSession } from "@/lib/dealer-auth"
import { calculateProductPrice } from "@/lib/pricing"

const SUPPLIER_DEPO_MAP: Record<string, string> = {
  b2bdepo: "Mersin Depo",
  bizimhesap: "Çorlu Depo",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getDealerSession()
  const authError = requireDealerSession(session)
  if (authError) return authError

  const { slug } = await params

  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          websiteUrl: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: {
                select: { id: true, name: true, slug: true, parentId: true },
              },
            },
          },
        },
      },
      supplierProducts: {
        where: { deletedAt: null, isAvailable: true },
        orderBy: { purchasePrice: "asc" },
        select: {
          purchasePrice: true,
          vatRate: true,
          stockQuantity: true,
          isAvailable: true,
          currency: true,
          supplier: { select: { name: true, code: true, marginRate: true } },
        },
      },
    },
  })

  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
  }

  // Gerçek fiyat hesaplaması
  const pricing = await calculateProductPrice(
    product.id,
    product.brandId,
    product.categoryId
  )

  // Stok
  const totalStock = product.supplierProducts.reduce(
    (sum, sp) => sum + sp.stockQuantity,
    0
  )

  // Benzer ürünler (aynı kategoriden, bu ürün hariç)
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
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          supplierProducts: {
            where: { deletedAt: null, isAvailable: true },
            select: {
              purchasePrice: true,
              vatRate: true,
              stockQuantity: true,
              supplier: { select: { marginRate: true } },
            },
            orderBy: { purchasePrice: "asc" },
            take: 1,
          },
        },
      })
    : []

  const relatedWithPricing = relatedProducts.map((rp) => {
    const sp = rp.supplierProducts[0]
    let relPricing = null
    if (sp?.purchasePrice) {
      const purchasePrice = Number(sp.purchasePrice)
      const vatRate = Number(sp.vatRate ?? 20)
      const multiplier = 1 + Number(sp.supplier?.marginRate ?? 30) / 100
      const salePriceExVat = purchasePrice * multiplier
      const salePriceIncVat = salePriceExVat * (1 + vatRate / 100)
      relPricing = {
        salePriceExVat: Math.round(salePriceExVat * 100) / 100,
        salePriceIncVat: Math.round(salePriceIncVat * 100) / 100,
        vatRate,
      }
    }
    const stock = rp.supplierProducts.reduce(
      (sum, s) => sum + s.stockQuantity,
      0
    )
    return {
      id: rp.id,
      name: rp.name,
      slug: rp.slug,
      images: rp.images,
      brand: rp.brand,
      pricing: relPricing,
      stock: { quantity: stock, isAvailable: stock > 0 },
    }
  })

  // View count artır (fire-and-forget)
  prisma.product
    .update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => null)

  return NextResponse.json({
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      barcode: product.barcode,
      sku: product.sku,
      modelCode: product.modelCode,
      description: product.description,
      shortDescription: product.shortDescription,
      specs: product.specs,
      images: product.images,
      warrantyMonths: product.warrantyMonths,
      minOrderQuantity: product.minOrderQuantity,
      unit: product.unit,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      isOutlet: product.isOutlet,
      brand: product.brand,
      category: product.category,
      pricing,
      stock: {
        quantity: totalStock,
        isAvailable: totalStock > 0,
      },
      suppliers: product.supplierProducts
        .filter((sp) => sp.stockQuantity > 0)
        .map((sp) => {
          const code = (sp.supplier?.code ?? "").toLowerCase()
          return {
            depoName: SUPPLIER_DEPO_MAP[code] ?? sp.supplier?.name ?? code,
            stockQuantity: sp.stockQuantity,
          }
        }),
    },
    relatedProducts: relatedWithPricing,
  })
}

// ============================================================================
// PUT /api/catalog/products/[slug]
// Bayi tarafından marka/kategori güncelleme (slug veya id ile)
// ============================================================================

const dealerUpdateSchema = z.object({
  brandId: z.string().uuid("Geçersiz marka ID").optional().nullable(),
  categoryId: z.string().uuid("Geçersiz kategori ID").optional().nullable(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getDealerSession()
  const authError = requireDealerSession(session)
  if (authError) return authError

  const { slug } = await params

  // slug veya id ile ürün bul
  const existing = await prisma.product.findFirst({
    where: {
      deletedAt: null,
      OR: [{ slug }, { id: slug }],
    },
  })

  if (!existing) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
  }

  const body = await req.json()
  const parsed = dealerUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const updateData: Record<string, unknown> = {}
  if (data.brandId !== undefined) updateData.brandId = data.brandId ?? null
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId ?? null

  const product = await prisma.product.update({
    where: { id: existing.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: updateData as any,
    include: {
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ data: product })
}
