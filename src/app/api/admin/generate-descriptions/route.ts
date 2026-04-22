import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

const Z_AI_API_KEY = process.env.Z_AI_API_KEY
const Z_AI_API_URL = process.env.Z_AI_API_URL || "https://api.z.ai/api/coding/paas/v4/chat/completions"
const Z_AI_MODEL = process.env.Z_AI_MODEL || "glm-4.5-air"

async function generateDescription(product: {
  name: string
  brand: string | null
  category: string | null
  specs: unknown
  sku: string | null
  barcode: string | null
  modelCode: string | null
}): Promise<string> {
  const specsText = product.specs
    ? typeof product.specs === "string"
      ? product.specs
      : JSON.stringify(product.specs, null, 2)
    : ""

  const prompt = `Türkçe olarak, aşağıdaki ürün için profesyonel bir e-ticaret ürün açıklaması yaz.
Ürünün teknik özelliklerini, kullanım alanlarını ve avantajlarını içeren 3-5 paragraflık bir açıklama yaz.
Doğrudan açıklama metnini yaz, başlık veya giriş yapma.

Ürün Adı: ${product.name}
${product.brand ? `Marka: ${product.brand}` : ""}
${product.category ? `Kategori: ${product.category}` : ""}
${product.modelCode ? `Model Kodu: ${product.modelCode}` : ""}
${product.sku ? `SKU: ${product.sku}` : ""}
${specsText ? `Teknik Özellikler: ${specsText}` : ""}`

  const res = await fetch(Z_AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Z_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: Z_AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API error: ${res.status} - ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ""
}

// POST /api/admin/generate-descriptions
// Body: { limit?: number, productId?: string }
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const body = await req.json()
    const { limit = 10, productId } = body

    if (!Z_AI_API_KEY) {
      return NextResponse.json({ error: "AI API anahtarı yapılandırılmamış." }, { status: 500 })
    }

    // Açıklaması olmayan ürünleri bul
    const where = productId
      ? { id: productId, deletedAt: null }
      : {
          deletedAt: null,
          isActive: true,
          OR: [{ description: null }, { description: "" }],
        }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        modelCode: true,
        specs: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    })

    if (products.length === 0) {
      return NextResponse.json({ message: "Açıklama gerektiren ürün bulunamadı.", updated: 0 })
    }

    const results: { id: string; name: string; status: "ok" | "error"; error?: string }[] = []

    for (const p of products) {
      try {
        const description = await generateDescription({
          name: p.name,
          brand: p.brand?.name ?? null,
          category: p.category?.name ?? null,
          specs: p.specs,
          sku: p.sku,
          barcode: p.barcode,
          modelCode: p.modelCode,
        })

        if (description) {
          await prisma.product.update({
            where: { id: p.id },
            data: { description },
          })
          results.push({ id: p.id, name: p.name, status: "ok" })
        } else {
          results.push({ id: p.id, name: p.name, status: "error", error: "Boş yanıt" })
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Bilinmeyen hata"
        results.push({ id: p.id, name: p.name, status: "error", error: errorMsg })
      }
    }

    const ok = results.filter((r) => r.status === "ok").length
    const errors = results.filter((r) => r.status === "error").length

    return NextResponse.json({
      message: `${ok} ürün açıklaması oluşturuldu${errors > 0 ? `, ${errors} hata` : ""}.`,
      updated: ok,
      errors,
      results,
    })
  } catch (error) {
    console.error("[generate-descriptions] POST error:", error)
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 })
  }
}
