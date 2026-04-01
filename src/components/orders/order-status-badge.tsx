import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type OrderStatusKey =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"

const STATUS_CONFIG: Record<
  OrderStatusKey,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Beklemede",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  CONFIRMED: {
    label: "Onaylandı",
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
  },
  PREPARING: {
    label: "Hazırlanıyor",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400",
  },
  SHIPPED: {
    label: "Kargoya Verildi",
    className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
  },
  DELIVERED: {
    label: "Teslim Edildi",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400",
  },
  CANCELLED: {
    label: "İptal Edildi",
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400",
  },
  RETURNED: {
    label: "İade Edildi",
    className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
  },
}

interface OrderStatusBadgeProps {
  status: string
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status as OrderStatusKey] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  }

  return (
    <Badge
      className={cn(
        "font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

export const ORDER_STATUS_LABELS: Record<OrderStatusKey, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])
) as Record<OrderStatusKey, string>
