import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createOrderSchema } from "@/lib/validators/order"
import { createOrder, getOrdersByCustomer } from "@/services/order.service"

// GET /api/orders — Bayinin kendi siparişleri
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 })
  }

  if (session.user.role === "admin" || session.user.role === "super_admin") {
    return NextResponse.json({ error: "Bu endpoint bayilere özeldir." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const status = searchParams.get("status") ?? undefined

  try {
    const result = await getOrdersByCustomer(session.user.id, page, limit, status)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[GET /api/orders]", err)
    return NextResponse.json({ error: "Siparişler yüklenemedi." }, { status: 500 })
  }
}

// POST /api/orders — Yeni sipariş oluştur
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 })
  }

  if (session.user.role === "admin" || session.user.role === "super_admin") {
    return NextResponse.json({ error: "Bu endpoint bayilere özeldir." }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz veri.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const result = await createOrder(session.user.id, parsed.data)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sipariş oluşturulamadı."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
