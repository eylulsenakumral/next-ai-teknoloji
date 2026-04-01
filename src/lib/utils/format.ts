export function formatCurrency(amount: number, currency = "USD"): string {
  const locale = currency === "TRY" ? "tr-TR" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value)
}
