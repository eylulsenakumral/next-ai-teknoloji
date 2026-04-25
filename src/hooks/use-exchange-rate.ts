"use client"

import { useState, useEffect } from "react"

interface ExchangeRates {
  usd: number
  eur: number
  lastUpdated: string | null
  loading: boolean
}

export function useExchangeRate(): ExchangeRates {
  const [rates, setRates] = useState<ExchangeRates>({
    usd: 0,
    eur: 0,
    lastUpdated: null,
    loading: true,
  })

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/exchange-rate")
        const data = await res.json()
        if (data.usd) {
          setRates({
            usd: data.usd,
            eur: data.eur,
            lastUpdated: data.lastUpdated,
            loading: false,
          })
        }
      } catch {
        setRates((prev) => ({ ...prev, loading: false }))
      }
    }
    fetchRates()
  }, [])

  return rates
}
