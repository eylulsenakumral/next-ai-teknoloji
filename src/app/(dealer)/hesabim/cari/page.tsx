"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  ReceiptText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Transaction {
  id: string
  type: string
  amount: number
  balanceAfter: number
  description: string | null
  referenceType: string | null
  referenceId: string | null
  createdAt: string
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
  currentBalance: number
  creditLimit: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INVOICE: "Fatura",
  PAYMENT: "Ödeme",
  REFUND: "İade",
  ADJUSTMENT: "Düzeltme",
  OPENING_BALANCE: "Açılış Bakiye",
}

const TRANSACTION_TYPE_OPTIONS = [
  { value: "", label: "Tüm türler" },
  { value: "INVOICE", label: "Fatura" },
  { value: "PAYMENT", label: "Ödeme" },
  { value: "REFUND", label: "İade" },
  { value: "ADJUSTMENT", label: "Düzeltme" },
  { value: "OPENING_BALANCE", label: "Açılış Bakiye" },
] as const

const TYPE_COLORS: Record<string, string> = {
  INVOICE: "bg-red-50 text-red-700 ring-red-600/10",
  PAYMENT: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  REFUND: "bg-blue-50 text-blue-700 ring-blue-600/10",
  ADJUSTMENT: "bg-gray-50 text-gray-700 ring-gray-600/10",
  OPENING_BALANCE: "bg-purple-50 text-purple-700 ring-purple-600/10",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BalanceCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentClass,
  valueClass,
}: {
  label: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  accentClass: string
  valueClass: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#767676]">{label}</p>
          <p className={cn("text-2xl sm:text-3xl font-bold tracking-tight", valueClass)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#767676]">{subtitle}</p>
          )}
        </div>
        <div className={cn("flex-shrink-0 rounded-xl p-2.5", accentClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-4 rounded-md bg-gray-100 animate-pulse"
                style={{ width: j === 2 ? "60%" : j === 0 ? "80px" : "70px" }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={5} className="text-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-gray-50 p-4">
            <ReceiptText className="h-8 w-8 text-[#767676]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#333333]">Hareket bulunamadı</p>
            <p className="text-xs text-[#767676] mt-0.5">
              Seçili filtrelere uygun işlem yok.
            </p>
          </div>
        </div>
      </td>
    </tr>
  )
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isNegative = tx.amount < 0

  return (
    <tr className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3.5 text-sm text-[#767676] whitespace-nowrap">
        {formatDate(tx.createdAt)}
      </td>
      <td className="px-4 py-3.5">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
            TYPE_COLORS[tx.type] ?? "bg-gray-50 text-gray-700 ring-gray-600/10"
          )}
        >
          {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-[#333333] max-w-xs truncate">
        {tx.description ?? "\u2014"}
      </td>
      <td className="px-4 py-3.5 text-right">
        <span
          className={cn(
            "inline-flex items-center gap-1 font-mono text-sm font-medium",
            isNegative ? "text-emerald-600" : "text-red-600"
          )}
        >
          {isNegative ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" />
          )}
          {formatUSD(Math.abs(tx.amount))}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <span
          className={cn(
            "font-mono text-sm",
            tx.balanceAfter < 0 ? "text-emerald-700" : "text-[#333333]"
          )}
        >
          {formatUSD(tx.balanceAfter)}
        </span>
      </td>
    </tr>
  )
}

function Pagination({
  meta,
  page,
  onPageChange,
}: {
  meta: Meta
  page: number
  onPageChange: (p: number) => void
}) {
  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1)

  // Show max 5 page numbers centered around current
  const getVisiblePages = (): number[] => {
    if (meta.totalPages <= 5) return pages
    const start = Math.max(1, Math.min(page - 2, meta.totalPages - 4))
    const end = Math.min(meta.totalPages, start + 4)
    return pages.slice(start - 1, end)
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-gray-100">
      <p className="text-sm text-[#767676]">
        Toplam <span className="font-medium text-[#333333]">{meta.total}</span> hareket
        {" "}&middot;{" "}
        Sayfa <span className="font-medium text-[#333333]">{meta.page}</span>/{meta.totalPages}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-[#333333] text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {visiblePages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="inline-flex items-center justify-center h-8 min-w-[2rem] rounded-lg border border-gray-200 bg-white text-[#333333] text-sm hover:bg-gray-50 transition-colors"
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className="px-1 text-[#767676] text-sm">...</span>
            )}
          </>
        )}

        {visiblePages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              "inline-flex items-center justify-center h-8 min-w-[2rem] rounded-lg text-sm font-medium transition-colors",
              p === page
                ? "bg-[#00179e] text-white border border-[#00179e]"
                : "border border-gray-200 bg-white text-[#333333] hover:bg-gray-50"
            )}
          >
            {p}
          </button>
        ))}

        {visiblePages[visiblePages.length - 1] < meta.totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < meta.totalPages - 1 && (
              <span className="px-1 text-[#767676] text-sm">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(meta.totalPages)}
              className="inline-flex items-center justify-center h-8 min-w-[2rem] rounded-lg border border-gray-200 bg-white text-[#333333] text-sm hover:bg-gray-50 transition-colors"
            >
              {meta.totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={page >= meta.totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-[#333333] text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CariPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    })
    const res = await fetch(`/api/account/transactions?${params}`)
    if (res.ok) {
      const json = await res.json()
      setTransactions(json.data ?? [])
      setMeta(json.meta ?? null)
    }
    setLoading(false)
  }, [page, typeFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const hasFilters = typeFilter !== "" || dateFrom !== "" || dateTo !== ""

  const clearFilters = () => {
    setTypeFilter("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const currentBalance = meta?.currentBalance ?? 0
  const creditLimit = meta?.creditLimit ?? 0
  const availableLimit = creditLimit - currentBalance

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
            Cari Hesabım
          </h1>
          <p className="text-sm text-[#767676] mt-0.5">
            Hesap hareketlerinizi ve bakiye bilgilerinizi takip edin.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransactions}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Yenile
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard
          label="Güncel Bakiye"
          value={formatUSD(Math.abs(currentBalance))}
          subtitle={currentBalance < 0 ? "Alacaklısınız" : "Borcunuz var"}
          icon={Wallet}
          accentClass={
            currentBalance < 0
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }
          valueClass={currentBalance < 0 ? "text-emerald-600" : "text-red-600"}
        />
        <BalanceCard
          label="Kredi Limiti"
          value={formatUSD(creditLimit)}
          icon={CreditCard}
          accentClass="bg-[#00179e]/10 text-[#00179e]"
          valueClass="text-[#00179e]"
        />
        <BalanceCard
          label="Kullanılabilir Limit"
          value={formatUSD(availableLimit)}
          subtitle={availableLimit < 0 ? "Limit aşıldı" : undefined}
          icon={Banknote}
          accentClass={
            availableLimit < 0
              ? "bg-red-50 text-red-600"
              : "bg-amber-50 text-amber-600"
          }
          valueClass={availableLimit < 0 ? "text-red-600" : "text-amber-600"}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#333333]">
            <Filter className="h-4 w-4 text-[#767676]" />
            <span>Filtreler</span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-3 flex-1">
            {/* Type filter - NATIVE select */}
            <div className="w-full sm:w-44">
              <label htmlFor="type-filter" className="sr-only">
                İşlem Türü
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-sm text-[#333333] outline-none focus:border-[#00179e] focus:ring-2 focus:ring-[#00179e]/20 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23767676%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8"
              >
                {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <label htmlFor="date-from" className="sr-only">
                  Başlangıç tarihi
                </label>
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-sm text-[#333333] outline-none focus:border-[#00179e] focus:ring-2 focus:ring-[#00179e]/20 transition-colors w-[140px]"
                />
              </div>
              <span className="text-[#767676] text-sm select-none">&ndash;</span>
              <div className="relative">
                <label htmlFor="date-to" className="sr-only">
                  Bitiş tarihi
                </label>
                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setPage(1)
                  }}
                  className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-sm text-[#333333] outline-none focus:border-[#00179e] focus:ring-2 focus:ring-[#00179e]/20 transition-colors w-[140px]"
                />
              </div>
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-sm text-[#767676] hover:text-[#333333] hover:bg-gray-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">
                  Tarih
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">
                  Tür
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676]">
                  Açıklama
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676] text-right">
                  Tutar
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#767676] text-right">
                  Bakiye
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : transactions.length === 0 ? (
                <EmptyState />
              ) : (
                transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <Pagination
            meta={meta}
            page={page}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
