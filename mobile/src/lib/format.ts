export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(String(value))
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

export function formatPrice(amount: unknown, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(toNumber(amount))
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Bekliyor",
    CONFIRMED: "Onaylandı",
    PREPARING: "Hazırlanıyor",
    SHIPPED: "Kargoda",
    DELIVERED: "Teslim Edildi",
    CANCELLED: "İptal",
    APPROVED: "Onaylı",
    REJECTED: "Reddedildi",
    SUSPENDED: "Askıda",
  }
  return map[status] ?? status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "#f59e0b",
    CONFIRMED: "#3b82f6",
    PREPARING: "#8b5cf6",
    SHIPPED: "#06b6d4",
    DELIVERED: "#16a34a",
    CANCELLED: "#ef4444",
    APPROVED: "#16a34a",
    REJECTED: "#ef4444",
    SUSPENDED: "#f59e0b",
  }
  return map[status] ?? "#6b7280"
}
