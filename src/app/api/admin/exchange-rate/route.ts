import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { Prisma } from "@prisma/client"

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml"

function parseCurrency(xml: string, code: string): number | null {
  const regex = new RegExp(
    `CurrencyCode="${code}"[\\s\\S]*?<ForexSelling>([\\d.,]+)<\\/ForexSelling>`
  )
  const match = xml.match(regex)
  if (!match) return null
  return parseFloat(match[1].replace(",", "."))
}

async function fetchFromTCMB() {
  const res = await fetch(TCMB_URL, { cache: "no-store" })
  const xml = await res.text()
  const usd = parseCurrency(xml, "USD")
  const eur = parseCurrency(xml, "EUR")
  if (!usd || !eur) throw new Error("TCMB parse failed")
  return { usd, eur }
}

async function getExchangeSettings() {
  const keys = ["exchange_mode", "exchange_usd", "exchange_eur", "exchange_last_updated"]
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
  const map: Record<string, unknown> = {}
  for (const row of rows) map[row.key] = row.value
  return {
    mode: (map.exchange_mode as string) || "AUTO",
    usd: (map.exchange_usd as number) || 0,
    eur: (map.exchange_eur as number) || 0,
    lastUpdated: (map.exchange_last_updated as string) || null,
  }
}

async function saveRates(usd: number, eur: number, sessionUserId: string) {
  const now = new Date().toISOString()
  const entries: Record<string, { value: Prisma.InputJsonValue; group: string }> = {
    exchange_usd: { value: usd, group: "EXCHANGE" },
    exchange_eur: { value: eur, group: "EXCHANGE" },
    exchange_last_updated: { value: now, group: "EXCHANGE" },
  }
  await Promise.all(
    Object.entries(entries).map(([key, meta]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: meta.value, updatedBy: sessionUserId },
        create: { key, value: meta.value, group: meta.group, updatedBy: sessionUserId },
      })
    )
  )
  return now
}

// GET — Mevcut kur bilgilerini döndür
export async function GET() {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const settings = await getExchangeSettings()
  return NextResponse.json({ data: settings })
}

// PUT — Manuel kur güncelleme veya mod değiştirme
export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const body = await req.json()
  const { mode, usd, eur } = body as { mode?: string; usd?: number; eur?: number }

  const updates: Record<string, { value: Prisma.InputJsonValue; group: string }> = {}

  if (mode && (mode === "AUTO" || mode === "MANUAL")) {
    updates.exchange_mode = { value: mode, group: "EXCHANGE" }
  }

  if (typeof usd === "number" && typeof eur === "number" && usd > 0 && eur > 0) {
    updates.exchange_usd = { value: usd, group: "EXCHANGE" }
    updates.exchange_eur = { value: eur, group: "EXCHANGE" }
    updates.exchange_last_updated = { value: new Date().toISOString(), group: "EXCHANGE" }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Güncellenecek veri yok." }, { status: 400 })
  }

  await Promise.all(
    Object.entries(updates).map(([key, meta]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: meta.value, updatedBy: session!.user.id },
        create: { key, value: meta.value, group: meta.group, updatedBy: session!.user.id },
      })
    )
  )

  const settings = await getExchangeSettings()
  return NextResponse.json({ data: settings })
}

// POST — TCMB'den zorla çek
export async function POST() {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const { usd, eur } = await fetchFromTCMB()
    const now = await saveRates(usd, eur, session!.user.id)
    return NextResponse.json({
      data: { usd, eur, lastUpdated: now, mode: "AUTO" },
      message: "TCMB'den kur başarıyla güncellendi.",
    })
  } catch {
    return NextResponse.json(
      { error: "TCMB'den kur alınamadı. Lütfen daha sonra tekrar deneyin." },
      { status: 502 }
    )
  }
}
