"use client"

import { useMemo } from "react"
import { TrendingDown, TrendingUp, Minus, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SupplierPriceRow {
  id: string
  supplier: { name: string; code: string }
  purchasePrice: string | null
  stockQuantity: number
  isAvailable: boolean
  currency: string
}

interface PriceHistory {
  id: string
  oldPrice: string | null
  newPrice: string
  priceChangePct: string | null
  recordedAt: string
  currency: string
}

interface PriceDisplayProps {
  supplierProducts: SupplierPriceRow[]
  marginPct?: number // global/override marj yüzdesi
  vatRate?: number   // KDV oranı
  className?: string
}

function formatPrice(price: string | number | null, currency = "TRY"): string {
  if (price === null || price === undefined) return "—"
  const num = typeof price === "string" ? parseFloat(price) : price
  if (isNaN(num)) return "—"
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

function calcSalePrice(purchasePrice: number, marginPct: number): number {
  return purchasePrice * (1 + marginPct / 100)
}

function calcWithVat(price: number, vatRate: number): number {
  return price * (1 + vatRate / 100)
}

export function PriceDisplay({ supplierProducts, marginPct = 20, vatRate = 20, className }: PriceDisplayProps) {
  const available = supplierProducts.filter((sp) => sp.isAvailable && sp.purchasePrice)

  const lowestPrice = useMemo(() => {
    if (available.length === 0) return null
    return available.reduce((min, sp) => {
      const price = parseFloat(sp.purchasePrice!)
      return price < min ? price : min
    }, Infinity)
  }, [available])

  const totalStock = useMemo(
    () => supplierProducts.reduce((sum, sp) => sum + sp.stockQuantity, 0),
    [supplierProducts]
  )

  if (supplierProducts.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Tedarikçi fiyatı bulunamadı.
      </div>
    )
  }

  const salePrice = lowestPrice ? calcSalePrice(lowestPrice, marginPct) : null
  const salePriceWithVat = salePrice ? calcWithVat(salePrice, vatRate) : null

  return (
    <div className={cn("space-y-4", className)}>
      {/* Özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border p-3 bg-card">
          <p className="text-xs text-muted-foreground mb-1">En Düşük Alış</p>
          <p className="font-semibold text-sm">
            {lowestPrice ? formatPrice(lowestPrice) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3 bg-card">
          <p className="text-xs text-muted-foreground mb-1">Satış (KDV Hariç)</p>
          <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
            {salePrice ? formatPrice(salePrice) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3 bg-card">
          <p className="text-xs text-muted-foreground mb-1">Satış (KDV Dahil %{vatRate})</p>
          <p className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
            {salePriceWithVat ? formatPrice(salePriceWithVat) : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3 bg-card">
          <p className="text-xs text-muted-foreground mb-1">Toplam Stok</p>
          <p className="font-semibold text-sm flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            {totalStock.toLocaleString("tr-TR")}
          </p>
        </div>
      </div>

      {/* Tedarikçi fiyat tablosu */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Tedarikçi Fiyatları
        </p>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tedarikçi</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Alış Fiyatı</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Stok</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {supplierProducts.map((sp) => (
                <tr key={sp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    <div>
                      <p className="font-medium">{sp.supplier.name}</p>
                      <p className="text-xs text-muted-foreground">{sp.supplier.code}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatPrice(sp.purchasePrice, sp.currency)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {sp.stockQuantity.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge
                      variant={sp.isAvailable && sp.stockQuantity > 0 ? "default" : "outline"}
                      className="text-xs"
                    >
                      {!sp.isAvailable ? "Pasif" : sp.stockQuantity === 0 ? "Stok Yok" : "Mevcut"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Uygulanan marj: %{marginPct} · KDV: %{vatRate}
        </p>
      </div>
    </div>
  )
}

// Fiyat geçmişi bileşeni
interface PriceHistoryDisplayProps {
  history: PriceHistory[]
  supplierName?: string
  className?: string
}

export function PriceHistoryDisplay({ history, supplierName, className }: PriceHistoryDisplayProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Fiyat geçmişi bulunamadı.</p>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {supplierName && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {supplierName} — Son {history.length} Kayıt
        </p>
      )}
      <div className="space-y-1.5">
        {history.map((h) => {
          const changePct = h.priceChangePct ? parseFloat(h.priceChangePct) : null
          const isUp = changePct !== null && changePct > 0
          const isDown = changePct !== null && changePct < 0

          return (
            <div
              key={h.id}
              className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                {isUp ? (
                  <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                ) : isDown ? (
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-muted-foreground text-xs">
                  {new Date(h.recordedAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-right">
                {h.oldPrice && (
                  <span className="text-muted-foreground line-through text-xs">
                    {formatPrice(h.oldPrice, h.currency)}
                  </span>
                )}
                <span className={cn("font-medium", isUp && "text-red-600", isDown && "text-emerald-600")}>
                  {formatPrice(h.newPrice, h.currency)}
                </span>
                {changePct !== null && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      isUp && "text-red-600 border-red-200",
                      isDown && "text-emerald-600 border-emerald-200"
                    )}
                  >
                    {isUp ? "+" : ""}{changePct.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
