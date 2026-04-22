import { NextResponse } from "next/server"

let cachedRates: { usd: number; eur: number; lastUpdated: number } | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

function parseCurrency(xml: string, code: string): number | null {
  const regex = new RegExp(
    `CurrencyCode="${code}"[\\s\\S]*?<ForexSelling>([\\d.,]+)<\\/ForexSelling>`
  )
  const match = xml.match(regex)
  if (!match) return null
  return parseFloat(match[1].replace(",", "."))
}

export async function GET() {
  const now = Date.now()

  if (cachedRates && now - cachedRates.lastUpdated < CACHE_DURATION) {
    return NextResponse.json({
      usd: cachedRates.usd,
      eur: cachedRates.eur,
      lastUpdated: new Date(cachedRates.lastUpdated).toISOString(),
    })
  }

  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 3600 },
    })
    const xml = await res.text()

    const usd = parseCurrency(xml, "USD")
    const eur = parseCurrency(xml, "EUR")

    if (usd && eur) {
      cachedRates = { usd, eur, lastUpdated: now }

      return NextResponse.json({
        usd,
        eur,
        lastUpdated: new Date(now).toISOString(),
      })
    }

    throw new Error("TCMB parse failed")
  } catch {
    if (cachedRates) {
      return NextResponse.json({
        usd: cachedRates.usd,
        eur: cachedRates.eur,
        lastUpdated: new Date(cachedRates.lastUpdated).toISOString(),
      })
    }
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 }
    )
  }
}
