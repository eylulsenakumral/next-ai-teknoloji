import { prisma } from "@/lib/db"

// ---------------------------------------------------------------------------
// TCMB Döviz Kuru (USD/TRY) — merkezi kaynak.
// order.service ve diğer servisler burayı kullanır. Sabit fallback YOK.
// ---------------------------------------------------------------------------

let cachedRate: { usdTry: number; lastUpdated: number } | null = null
const RATE_CACHE_MS = 60 * 60 * 1000 // 1 saat

/**
 * USD/TRY kurunu döndürür. Çözüm sırası:
 *   1. Bellek cache'i (1 saat taze) — TCMB'den son başarıyla çekilen kur.
 *   2. TCMB canlı çekme → cache'e yaz.
 *   3. TCMB başarısızsa: stale bellek cache'i (son başarılı kur, varsa).
 *   4. DB Setting "exchange_usd" (admin paneli / /api/exchange-rate tarafından yazılan kalıcı kur).
 *   5. Hiçbiri yoksa throw — asla sabit (38) fallback dönülmez.
 */
export async function getUsdTryRate(): Promise<number> {
  const now = Date.now()
  if (cachedRate && now - cachedRate.lastUpdated < RATE_CACHE_MS) {
    return cachedRate.usdTry
  }

  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 3600 },
    })
    const xml = await res.text()
    const match = xml.match(
      /CurrencyCode="USD"[\s\S]*?<ForexSelling>([\d.,]+)<\/ForexSelling>/
    )
    if (match) {
      const rate = parseFloat(match[1].replace(",", "."))
      if (!Number.isNaN(rate) && rate > 0) {
        cachedRate = { usdTry: rate, lastUpdated: now }
        return rate
      }
    }
  } catch (err) {
    console.error("[TCMB] Kur çekilemedi:", err)
  }

  // 1) Stale bellek cache'i — son başarılı kur
  if (cachedRate) return cachedRate.usdTry

  // 2) DB Setting — admin paneli veya /api/exchange-rate tarafından yazılır
  try {
    const row = await prisma.setting.findUnique({
      where: { key: "exchange_usd" },
      select: { value: true },
    })
    const raw = row?.value
    const dbRate = typeof raw === "number" ? raw : Number(raw)
    if (!Number.isNaN(dbRate) && dbRate > 0) {
      return dbRate
    }
  } catch (err) {
    console.error("[Exchange] DB kur okunamadı:", err)
  }

  throw new Error("USD/TRY kur bulunamadı")
}
