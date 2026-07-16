import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cancelOrderSchema } from "@/lib/validators/order"
import { getOrderById, cancelOrder } from "@/services/order.service"

// GET /api/orders/[id] — Sipariş detay (Bayi kendi siparişini görebilir)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 })
  }

  if (session.user.role === "admin" || session.user.role === "super_admin") {
    return NextResponse.json({ error: "Bu endpoint bayilere özeldir." }, { status: 403 })
  }

  const { id } = await params

  try {
    const order = await getOrderById(id)

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
    }

    // Güvenlik: Bayi yalnızca kendi siparişini görebilir
    if (order.customer.id !== session.user.id) {
      return NextResponse.json({ error: "Bu siparişe erişim yetkiniz yok." }, { status: 403 })
    }

    // Bayiye kar/maliyet bilgisi gönderme — hem üst seviye hem her sipariş kalemi.
    // Kalem bazında purchasePrice (tedarik maliyeti) ve profitMarginPct (kâr marjı) sızmasını engeller.
    const {
      totalPurchaseCost: _,
      totalProfit: __,
      profitMarginPct: ___,
      items: rawItems,
      ...safeRest
    } = order
    const safeItems = (rawItems ?? []).map(
      ({ purchasePrice, profitMarginPct: _itemMargin, ...itemRest }) => itemRest
    )
    const safeOrder = { ...safeRest, items: safeItems }

    return NextResponse.json({ data: safeOrder })
  } catch (err) {
    console.error("[GET /api/orders/[id]]", err)
    return NextResponse.json({ error: "Sipariş yüklenemedi." }, { status: 500 })
  }
}

// DELETE /api/orders/[id] — Sipariş iptal (yalnızca PENDING)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 })
  }

  if (session.user.role === "admin" || session.user.role === "super_admin") {
    return NextResponse.json({ error: "Bu endpoint bayilere özeldir." }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const parsed = cancelOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    await cancelOrder(id, session.user.id, parsed.data.reason)
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sipariş iptal edilemedi."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
