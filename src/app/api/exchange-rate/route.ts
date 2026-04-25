import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml"
const AUTO_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

function parseCurrency(xml: string, code: string): number | null {
  const regex = new RegExp(
    `CurrencyCode="${code}"[\\s\\S]*?<ForexSelling>([\\d.,]+)<\\/ForexSelling>`
  )
  const match = xml.match(regex)
  if (!match) return null
  return parseFloat(match[1].replace(",", "."))
}

async function fetchFromTCMB(): Promise<{ usd: number; eur: number }> {
  const res = await fetch(TCMB_URL, { cache: "no-store" })
  const xml = await res.text()
  const usd = parseCurrency(xml, "USD")
  const eur = parseCurrency(xml, "EUR")
  if (!usd || !eur) throw new Error("TCMB parse failed")
  return { usd, eur }
}

export async function GET() {
  try {
    // Settings'ten kur bilgilerini oku
    const keys = ["exchange_mode", "exchange_usd", "exchange_eur", "exchange_last_updated"]
    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
    const map: Record<string, unknown> = {}
    for (const row of rows) map[row.key] = row.value

    const mode = (map.exchange_mode as string) || "AUTO"
    const usd = map.exchange_usd as number | undefined
    const eur = map.exchange_eur as number | undefined
    const lastUpdatedStr = map.exchange_last_updated as string | undefined

    // DB'de kur var mı kontrol et
    const hasRates = usd && eur && usd > 0 && eur > 0

    if (mode === "MANUAL" && hasRates) {
      // Manuel mod: direkt döndür
      return NextResponse.json({ usd, eur, lastUpdated: lastUpdatedStr || null })
    }

    // AUTO mod veya kur yoksa
    if (hasRates && lastUpdatedStr) {
      const lastUpdated = new Date(lastUpdatedStr).getTime()
      const elapsed = Date.now() - lastUpdated

      // Henüz süre dolmamışsa cacheden döndür
      if (elapsed < AUTO_INTERVAL_MS) {
        return NextResponse.json({ usd, eur, lastUpdated: lastUpdatedStr })
      }
    }

    // TCMB'den çek ve kaydet
    try {
      const rates = await fetchFromTCMB()
      const now = new Date().toISOString()

      await Promise.all([
        prisma.setting.upsert({
          where: { key: "exchange_usd" },
          update: { value: rates.usd },
          create: { key: "exchange_usd", value: rates.usd, group: "EXCHANGE" },
        }),
        prisma.setting.upsert({
          where: { key: "exchange_eur" },
          update: { value: rates.eur },
          create: { key: "exchange_eur", value: rates.eur, group: "EXCHANGE" },
        }),
        prisma.setting.upsert({
          where: { key: "exchange_last_updated" },
          update: { value: now },
          create: { key: "exchange_last_updated", value: now, group: "EXCHANGE" },
        }),
      ])

      return NextResponse.json({ usd: rates.usd, eur: rates.eur, lastUpdated: now })
    } catch {
      // TCMB başarısız — DB'deki eski kur varsa onu döndür
      if (hasRates) {
        return NextResponse.json({ usd, eur, lastUpdated: lastUpdatedStr || null })
      }
      throw new Error("No rates available")
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 }
    )
  }
}
