import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ExpiryLevel = "expired" | "critical" | "warning" | "soon" | "active"

/**
 * Bitiş tarihinden kalan gün sayısını hesaplar.
 * garanti-sorgula.tsx'teki computeWarrantyStatus desenini takip eder.
 */
export function computeExpiryLevel(endDate: Date | string): {
  level: ExpiryLevel
  remainingDays: number
} {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const remainingDays = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  let level: ExpiryLevel
  if (remainingDays <= 0) level = "expired"
  else if (remainingDays <= 7) level = "critical" // kırmızı — 7 gün
  else if (remainingDays <= 14) level = "warning" // sarı — 14 gün
  else if (remainingDays <= 30) level = "soon" // yeşil — 30 gün
  else level = "active"

  return { level, remainingDays }
}

const LEVEL_CONFIG: Record<
  ExpiryLevel,
  { label: string; className: string }
> = {
  expired: {
    label: "Süresi Doldu",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
  },
  critical: {
    label: "Kritik",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
  },
  warning: {
    label: "Uyarı",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
  },
  soon: {
    label: "Yaklaşıyor",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  active: {
    label: "Aktif",
    className: "bg-muted text-muted-foreground border-border",
  },
}

interface SimExpiryBadgeProps {
  endDate: Date | string
  className?: string
}

export function SimExpiryBadge({ endDate, className }: SimExpiryBadgeProps) {
  const { level, remainingDays } = computeExpiryLevel(endDate)
  const config = LEVEL_CONFIG[level]

  const suffix =
    level === "expired"
      ? `(${Math.abs(remainingDays)} gün önce)`
      : level === "active"
        ? ""
        : `(${remainingDays} gün)`

  return (
    <Badge
      className={cn("font-medium border whitespace-nowrap", config.className, className)}
    >
      {config.label} {suffix && <span className="font-normal opacity-80">{suffix}</span>}
    </Badge>
  )
}
