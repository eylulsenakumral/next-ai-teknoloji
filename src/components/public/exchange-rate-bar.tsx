"use client"

import { useEffect, useState } from "react"

interface Rates {
  usd: number
  eur: number
  lastUpdated: string
}

export function ExchangeRateDisplay() {
  const [rates, setRates] = useState<Rates | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((res) => res.json())
      .then((data) => {
        if (data.usd) setRates(data)
      })
      .catch(() => {
        /* silently fail */
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <span className="animate-pulse text-white/60 text-[11px]">
        Kurlar yükleniyor...
      </span>
    )
  }

  if (!rates) return null

  return (
    <div className="hidden sm:flex items-center gap-3 text-[11px]">
      <span className="flex items-center gap-1">
        <span className="font-medium">$</span>
        <span>1 USD =</span>
        <span className="font-semibold">
          {rates.usd.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          {"\u20BA"}
        </span>
      </span>
      <span className="text-white/40">|</span>
      <span className="flex items-center gap-1">
        <span className="font-medium">{"\u20AC"}</span>
        <span>1 EUR =</span>
        <span className="font-semibold">
          {rates.eur.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          {"\u20BA"}
        </span>
      </span>
    </div>
  )
}
