import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format"

const USD_TO_TRY_FALLBACK = Number(process.env.NEXT_PUBLIC_USD_TRY || 38.5)

interface OrderSummaryProps {
  subtotal: number
  vatTotal: number
  discountTotal?: number
  shippingTotal?: number
  grandTotal: number
  currency?: string
  className?: string
  compact?: boolean
  showTryEquivalent?: boolean
  usdTry?: number
}

export function OrderSummary({
  subtotal,
  vatTotal,
  discountTotal = 0,
  shippingTotal = 0,
  grandTotal,
  currency = "USD",
  className,
  compact = false,
  showTryEquivalent = false,
  usdTry,
}: OrderSummaryProps) {
  const rate = usdTry ?? USD_TO_TRY_FALLBACK
  const isUsd = currency === "USD" && showTryEquivalent && rate > 0

  return (
    <div className={cn("space-y-2", className)}>
      {!compact && (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ara Toplam (KDV hariç)</span>
            <span className="font-medium tabular-nums">{formatCurrency(subtotal, currency)}</span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">İskonto</span>
              <span className="font-medium text-green-600 tabular-nums">
                -{formatCurrency(discountTotal, currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">KDV Tutarı</span>
            <span className="font-medium tabular-nums">{formatCurrency(vatTotal, currency)}</span>
          </div>

          {shippingTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kargo</span>
              <span className="font-medium tabular-nums">{formatCurrency(shippingTotal, currency)}</span>
            </div>
          )}

          <Separator />
        </>
      )}

      <div className="flex justify-between">
        <span className="font-semibold">Genel Toplam</span>
        <span className="font-bold text-lg tabular-nums">{formatCurrency(grandTotal, currency)}</span>
      </div>

      {isUsd && (
        <div className="flex justify-between text-sm rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <span className="text-amber-800 font-medium">TL Karşılığı (1 USD = {rate} TL)</span>
          <span className="text-amber-900 font-bold tabular-nums">{formatCurrency(grandTotal * rate, "TRY")}</span>
        </div>
      )}
    </div>
  )
}
