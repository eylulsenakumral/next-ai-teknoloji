import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format"

interface OrderSummaryProps {
  subtotal: number
  vatTotal: number
  discountTotal?: number
  shippingTotal?: number
  grandTotal: number
  currency?: string
  className?: string
  compact?: boolean
}

export function OrderSummary({
  subtotal,
  vatTotal,
  discountTotal = 0,
  shippingTotal = 0,
  grandTotal,
  className,
  compact = false,
}: OrderSummaryProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {!compact && (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ara Toplam (KDV hariç)</span>
            <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">İskonto</span>
              <span className="font-medium text-green-600 tabular-nums">
                -{formatCurrency(discountTotal)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">KDV Tutarı</span>
            <span className="font-medium tabular-nums">{formatCurrency(vatTotal)}</span>
          </div>

          {shippingTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kargo</span>
              <span className="font-medium tabular-nums">{formatCurrency(shippingTotal)}</span>
            </div>
          )}

          <Separator />
        </>
      )}

      <div className="flex justify-between">
        <span className="font-semibold">Genel Toplam</span>
        <span className="font-bold text-lg tabular-nums">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  )
}
