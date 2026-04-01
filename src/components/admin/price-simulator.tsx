"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator } from "lucide-react"

interface SimulationResult {
  saleExVat: number
  saleIncVat: number
  profit: number
  profitPercent: number
}

export function PriceSimulator() {
  const [purchasePrice, setPurchasePrice] = useState("")
  const [marginPct, setMarginPct] = useState("30")
  const [vatRate, setVatRate] = useState("20")
  const [result, setResult] = useState<SimulationResult | null>(null)

  const calculate = useCallback(() => {
    const purchase = parseFloat(purchasePrice)
    const margin = parseFloat(marginPct)
    const vat = parseFloat(vatRate)

    if (isNaN(purchase) || purchase <= 0) {
      setResult(null)
      return
    }
    if (isNaN(margin) || margin < 0) return
    if (isNaN(vat) || vat < 0) return

    const saleExVat = purchase * (1 + margin / 100)
    const saleIncVat = saleExVat * (1 + vat / 100)
    const profit = saleExVat - purchase
    const profitPercent = purchase > 0 ? (profit / purchase) * 100 : 0

    setResult({
      saleExVat: Math.round(saleExVat * 10000) / 10000,
      saleIncVat: Math.round(saleIncVat * 10000) / 10000,
      profit: Math.round(profit * 10000) / 10000,
      profitPercent: Math.round(profitPercent * 100) / 100,
    })
  }, [purchasePrice, marginPct, vatRate])

  useEffect(() => {
    calculate()
  }, [calculate])

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Fiyat Simülatörü
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="sim-purchase">Alış Fiyatı (KDV hariç)</Label>
            <div className="relative">
              <Input
                id="sim-purchase"
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                ₺
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-margin">Kar Marjı</Label>
            <div className="relative">
              <Input
                id="sim-margin"
                type="number"
                min="0"
                max="1000"
                step="0.5"
                value={marginPct}
                onChange={(e) => setMarginPct(e.target.value)}
                placeholder="30"
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                %
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-vat">KDV Oranı</Label>
            <div className="relative">
              <Input
                id="sim-vat"
                type="number"
                min="0"
                max="100"
                step="1"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                placeholder="20"
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>

        {result && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t">
            <ResultCard
              label="Satış (KDV hariç)"
              value={formatCurrency(result.saleExVat)}
              highlight={false}
            />
            <ResultCard
              label="Satış (KDV dahil)"
              value={formatCurrency(result.saleIncVat)}
              highlight
            />
            <ResultCard
              label="Kar Tutarı"
              value={formatCurrency(result.profit)}
              highlight={false}
            />
            <ResultCard
              label="Kar Oranı"
              value={`%${result.profitPercent.toFixed(2)}`}
              highlight={false}
            />
          </div>
        )}

        {!result && purchasePrice && (
          <p className="text-sm text-muted-foreground text-center pt-2 border-t">
            Geçerli bir alış fiyatı girin.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ResultCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight: boolean
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2.5 ${
        highlight
          ? "bg-primary/10 border border-primary/20"
          : "bg-muted/60 border border-transparent"
      }`}
    >
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
    </div>
  )
}
