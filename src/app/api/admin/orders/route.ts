import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { getAllOrders, getTodayOrderStats } from "@/services/order.service"

// GET /api/admin/orders — Tüm siparişler
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
  const status = searchParams.get("status") ?? undefined
  const customerId = searchParams.get("customerId") ?? undefined
  const search = searchParams.get("search") ?? undefined
  const dateFrom = searchParams.get("dateFrom") ?? undefined
  const dateTo = searchParams.get("dateTo") ?? undefined
  const includeStats = searchParams.get("stats") === "1"

  try {
    const [result, stats] = await Promise.all([
      getAllOrders({ page, limit, status, customerId, search, dateFrom, dateTo }),
      includeStats ? getTodayOrderStats() : Promise.resolve(null),
    ])

    return NextResponse.json({
      ...result,
      ...(stats ? { stats } : {}),
    })
  } catch (err) {
    console.error("[GET /api/admin/orders]", err)
    return NextResponse.json({ error: "Siparişler yüklenemedi." }, { status: 500 })
  }
}
