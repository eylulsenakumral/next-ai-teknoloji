import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { updateOrderStatusSchema } from "@/lib/validators/order"
import { getOrderById, updateOrderStatus } from "@/services/order.service"
import type { OrderStatus } from "@prisma/client"

// GET /api/admin/orders/[id] — Sipariş detay (admin — kar/zarar dahil)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  try {
    const order = await getOrderById(id, true)

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
    }

    return NextResponse.json({ data: order })
  } catch (err) {
    console.error("[GET /api/admin/orders/[id]]", err)
    return NextResponse.json({ error: "Sipariş yüklenemedi." }, { status: 500 })
  }
}

// PUT /api/admin/orders/[id] — Durum güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const parsed = updateOrderStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    await updateOrderStatus(
      id,
      parsed.data.status as OrderStatus,
      parsed.data.adminNotes ?? undefined,
      parsed.data.shippingTrackingNumber ?? undefined,
      parsed.data.shippingCarrier ?? undefined
    )
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sipariş güncellenemedi."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
