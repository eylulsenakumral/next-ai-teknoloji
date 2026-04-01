import { prisma } from "@/lib/db"
import { getAdminSession } from "@/lib/auth-helpers"
import { redirect, notFound } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { name: true },
  })
  return {
    title: product ? `${product.name} — Düzenle` : "Ürün Düzenle",
  }
}

export default async function UrunDuzenlemePage({ params }: Props) {
  const session = await getAdminSession()
  if (!session?.user) {
    redirect("/admin/giris")
  }

  const { id } = await params

  const [product, brands, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplierProducts: {
          where: { deletedAt: null },
          include: {
            supplier: { select: { id: true, name: true, code: true } },
            priceHistory: {
              orderBy: { recordedAt: "desc" },
              take: 30,
              select: {
                id: true,
                oldPrice: true,
                newPrice: true,
                priceChangePct: true,
                recordedAt: true,
                currency: true,
              },
            },
          },
          orderBy: { purchasePrice: "asc" },
        },
      },
    }),
    prisma.brand.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ depth: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        depth: true,
        path: true,
        parent: { select: { id: true, name: true } },
      },
    }),
  ])

  if (!product) {
    notFound()
  }

  // Prisma Decimal tiplerini string/number'a dönüştür
  const supplierProducts = product.supplierProducts.map((sp) => ({
    id: sp.id,
    supplier: sp.supplier,
    purchasePrice: sp.purchasePrice ? sp.purchasePrice.toString() : null,
    stockQuantity: sp.stockQuantity,
    isAvailable: sp.isAvailable,
    currency: sp.currency,
    priceHistory: sp.priceHistory.map((ph) => ({
      id: ph.id,
      oldPrice: ph.oldPrice ? ph.oldPrice.toString() : null,
      newPrice: ph.newPrice.toString(),
      priceChangePct: ph.priceChangePct ? ph.priceChangePct.toString() : null,
      recordedAt: ph.recordedAt.toISOString(),
      currency: ph.currency,
    })),
  }))

  const initialData = {
    name: product.name,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    brandId: product.brandId ?? "",
    categoryId: product.categoryId ?? "",
    barcode: product.barcode ?? "",
    sku: product.sku ?? "",
    modelCode: product.modelCode ?? "",
    unit: product.unit,
    minOrderQuantity: product.minOrderQuantity,
    warrantyMonths: product.warrantyMonths ? String(product.warrantyMonths) : "",
    images: product.images,
    specs: (product.specs as Record<string, string> | null) ?? null,
    weight: product.weight ? product.weight.toString() : "",
    dimensions: (product.dimensions as { length: string; width: string; height: string; unit: string } | null) ?? { length: "", width: "", height: "", unit: "cm" },
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isOutlet: product.isOutlet,
    metadata: (product.metadata as Record<string, string> | null) ?? null,
    supplierProducts,
  }

  return (
    <ProductForm
      productId={product.id}
      initialData={initialData}
      brands={brands}
      categories={categories}
    />
  )
}
