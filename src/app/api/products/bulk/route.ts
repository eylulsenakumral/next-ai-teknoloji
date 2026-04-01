import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { bulkUpdateSchema } from "@/lib/validators/product"
import { generateSlug } from "@/lib/utils/slug"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const parsed = bulkUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { ids, action, value } = parsed.data
  const userId = session!.user.id

  // Mevcut ürünleri kontrol et
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, name: true, slug: true },
  })

  if (products.length === 0) {
    return NextResponse.json({ error: "Hiçbir ürün bulunamadı." }, { status: 404 })
  }

  const foundIds = products.map((p) => p.id)

  switch (action) {
    case "activate": {
      await prisma.product.updateMany({
        where: { id: { in: foundIds } },
        data: { isActive: true, updatedBy: userId },
      })
      return NextResponse.json({
        success: true,
        message: `${foundIds.length} ürün aktif edildi.`,
        affected: foundIds.length,
      })
    }

    case "deactivate": {
      await prisma.product.updateMany({
        where: { id: { in: foundIds } },
        data: { isActive: false, updatedBy: userId },
      })
      return NextResponse.json({
        success: true,
        message: `${foundIds.length} ürün pasife alındı.`,
        affected: foundIds.length,
      })
    }

    case "delete": {
      await prisma.product.updateMany({
        where: { id: { in: foundIds } },
        data: { deletedAt: new Date(), updatedBy: userId },
      })
      return NextResponse.json({
        success: true,
        message: `${foundIds.length} ürün silindi.`,
        affected: foundIds.length,
      })
    }

    case "update_margin": {
      if (value === undefined || value < 0 || value > 10000) {
        return NextResponse.json(
          { error: "Geçerli bir marj değeri girin (0-10000)." },
          { status: 400 }
        )
      }


      // Mevcut PRODUCT marjlarını kontrol et: varsa güncelle, yoksa oluştur
      for (const productId of foundIds) {
        const existing = await prisma.profitMargin.findFirst({
          where: { scope: "PRODUCT", scopeId: productId, deletedAt: null },
        })
        if (existing) {
          await prisma.profitMargin.update({
            where: { id: existing.id },
            data: { marginPct: value, updatedBy: userId },
          })
        } else {
          await prisma.profitMargin.create({
            data: {
              scope: "PRODUCT",
              scopeId: productId,
              marginPct: value,
              isActive: true,
              priority: 10,
              createdBy: userId,
            },
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `${foundIds.length} ürüne %${value} marj uygulandı.`,
        affected: foundIds.length,
      })
    }

    case "duplicate": {
      const duplicated: string[] = []

      for (const product of products) {
        const baseSlug = `${product.slug}-kopya`
        let finalSlug = baseSlug
        let attempt = 0
        while (true) {
          const conflict = await prisma.product.findFirst({
            where: { slug: finalSlug, deletedAt: null },
          })
          if (!conflict) break
          attempt++
          finalSlug = `${baseSlug}-${attempt}`
        }

        // Orijinal ürünü tam olarak çek
        const original = await prisma.product.findFirst({
          where: { id: product.id },
        })

        if (!original) continue

        const copy = await prisma.product.create({
          data: {
            name: `${original.name} (Kopya)`,
            slug: finalSlug,
            brandId: original.brandId,
            categoryId: original.categoryId,
            barcode: null, // barkod tekil olmalı
            sku: null,
            modelCode: original.modelCode,
            description: original.description,
            shortDescription: original.shortDescription,
            specs: original.specs ?? undefined,
            images: original.images,
            weight: original.weight,
            dimensions: original.dimensions ?? undefined,
            warrantyMonths: original.warrantyMonths,
            isActive: false, // kopya pasif başlasın
            isFeatured: false,
            isNew: false,
            isOutlet: original.isOutlet,
            minOrderQuantity: original.minOrderQuantity,
            unit: original.unit,
            metadata: original.metadata ?? undefined,
            createdBy: userId,
          },
        })
        duplicated.push(copy.id)
      }

      return NextResponse.json({
        success: true,
        message: `${duplicated.length} ürün kopyalandı.`,
        affected: duplicated.length,
        createdIds: duplicated,
      })
    }

    default:
      return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 })
  }
}
