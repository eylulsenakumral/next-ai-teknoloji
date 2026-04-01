import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { simulatePrice } from "@/services/pricing.service"
import { simulatePriceSchema } from "@/lib/validators/pricing"

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const parsed = simulatePriceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { purchasePrice, marginPct, vatRate } = parsed.data
  const result = simulatePrice(purchasePrice, marginPct, vatRate ?? 20)

  return NextResponse.json({
    data: {
      purchasePrice,
      marginPct,
      vatRate: vatRate ?? 20,
      saleExVat: result.saleExVat,
      saleIncVat: result.saleIncVat,
      profit: result.profit,
      profitPercent: purchasePrice > 0
        ? Math.round((result.profit / purchasePrice) * 10000) / 100
        : 0,
    },
  })
}
