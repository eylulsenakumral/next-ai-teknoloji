"use client"

import type { QuoteStatus } from "@prisma/client"

const config: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: { label: "Taslak", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  SENT: { label: "Gönderildi", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  ACCEPTED: { label: "Kabul", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  REJECTED: { label: "Red", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  EXPIRED: { label: "Süresi Doldu", className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  CONVERTED: { label: "Sipariş", className: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300" },
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
