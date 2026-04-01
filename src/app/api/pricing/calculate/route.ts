import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { calculateProductPrice, simulatePrice } from "@/services/pricing.service"
import { z } from "zod"

const bodySchema = z.union([
  z.object({
    productId: z.string().uuid("Geçerli bir ürün ID'si girin"),
  }),
  z.object({
    purchasePrice: z.number().positive("Alış fiyatı 0'dan büyük olmalı"),
    marginPct: z.number().min(0).max(1000),
    vatRate: z.number().min(0).max(100).default(20),
  }),
])

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  if ("productId" in data && data.productId) {
    const result = await calculateProductPrice(data.productId)
    if (!result) {
      return NextResponse.json(
        { error: "Ürün bulunamadı veya stok/fiyat bilgisi yok." },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: result })
  }

  if ("purchasePrice" in data) {
    const { purchasePrice, marginPct, vatRate } = data
    const result = simulatePrice(purchasePrice, marginPct, vatRate ?? 20)
    return NextResponse.json({
      data: {
        purchasePrice,
        marginPct,
        vatRate: vatRate ?? 20,
        ...result,
      },
    })
  }

  return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
}
