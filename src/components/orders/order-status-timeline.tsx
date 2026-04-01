import { CheckCircle2, Circle, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"

type OrderStatusKey =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"

interface TimelineStep {
  status: OrderStatusKey
  label: string
  date?: string | null
}

const NORMAL_FLOW: OrderStatusKey[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
]

const STATUS_LABELS: Record<OrderStatusKey, string> = {
  PENDING: "Sipariş Alındı",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
  RETURNED: "İade Edildi",
}

interface OrderStatusTimelineProps {
  currentStatus: string
  createdAt: string
  shippedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  className?: string
}

export function OrderStatusTimeline({
  currentStatus,
  createdAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
  className,
}: OrderStatusTimelineProps) {
  const isCancelled = currentStatus === "CANCELLED" || currentStatus === "RETURNED"

  if (isCancelled) {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />
          </div>
          <div className="mt-1 h-8 w-0.5 bg-border" aria-hidden />
        </div>
        <div className="pb-6 pt-1">
          <p className="text-sm font-medium">Sipariş Alındı</p>
          <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <XCircle className="h-5 w-5 text-red-600" aria-hidden />
          </div>
        </div>
        <div className="pb-6 pt-1">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {currentStatus === "RETURNED" ? "İade Edildi" : "İptal Edildi"}
          </p>
          {cancelledAt && (
            <p className="text-xs text-muted-foreground">{formatDate(cancelledAt)}</p>
          )}
        </div>
      </div>
    )
  }

  const currentIndex = NORMAL_FLOW.indexOf(currentStatus as OrderStatusKey)

  const steps: TimelineStep[] = NORMAL_FLOW.map((status, idx) => ({
    status,
    label: STATUS_LABELS[status],
    date:
      idx === 0
        ? createdAt
        : status === "SHIPPED"
          ? shippedAt
          : status === "DELIVERED"
            ? deliveredAt
            : null,
  }))

  return (
    <ol className={cn("relative", className)} aria-label="Sipariş durumu">
      {steps.map((step, idx) => {
        const isDone = idx <= currentIndex
        const isCurrent = idx === currentIndex

        return (
          <li key={step.status} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                ) : (
                  <Circle className="h-4 w-4" aria-hidden />
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "mt-1 h-8 w-0.5 transition-colors",
                    idx < currentIndex ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden
                />
              )}
            </div>
            <div className="pb-6 pt-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  isCurrent && "text-primary",
                  !isDone && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              {step.date ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(step.date)}
                </p>
              ) : isCurrent ? (
                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" aria-hidden />
                  <span>İşlemde</span>
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
