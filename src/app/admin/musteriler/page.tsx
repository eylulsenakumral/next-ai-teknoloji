"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  RefreshCw,
  Eye,
  PauseCircle,
  PlayCircle,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Customer {
  id: string
  dealerCode: string
  companyName: string
  tradeName: string | null
  contactName: string | null
  phone: string | null
  email: string | null
  city: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "BLACKLISTED"
  balance: number
  creditLimit: number
  discountRate: number
  createdAt: string
  lastLoginAt: string | null
  _count: { orders: number }
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "BLACKLISTED"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekleyen",
  APPROVED: "Aktif",
  REJECTED: "Reddedilmiş",
  SUSPENDED: "Askıda",
  BLACKLISTED: "Kara Liste",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  SUSPENDED: "outline",
  BLACKLISTED: "destructive",
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "Tümü", value: "ALL" },
  { label: "Aktif", value: "APPROVED" },
  { label: "Bekleyen", value: "PENDING" },
  { label: "Askıda", value: "SUSPENDED" },
  { label: "Reddedilmiş", value: "REJECTED" },
  { label: "Kara Liste", value: "BLACKLISTED" },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value)
}

export default function MusterilerPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")
  const [page, setPage] = useState(1)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search ? { search } : {}),
      ...(filterStatus !== "ALL" ? { status: filterStatus } : {}),
    })
    const res = await fetch("/api/customers?" + params.toString())
    if (res.ok) {
      const json = await res.json()
      setCustomers(json.data ?? [])
      setMeta(json.meta ?? null)
    }
    setLoading(false)
  }, [page, search, filterStatus])

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(timer)
  }, [fetchCustomers])

  async function toggleStatus(customer: Customer) {
    const newStatus = customer.status === "APPROVED" ? "SUSPENDED" : "APPROVED"
    setTogglingId(customer.id)
    try {
      const res = await fetch("/api/customers/" + customer.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchCustomers()
      }
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Müşteriler / Bayiler</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {meta?.total ?? 0} kayıt
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomers}
          disabled={loading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Yenile
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Bayi kodu, firma, yetkili, telefon, e-posta ara..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mt-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilterStatus(f.value)
                  setPage(1)
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  filterStatus === f.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bayi Kodu</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Yetkili</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Bakiye</TableHead>
                  <TableHead className="text-right">Kredi Limiti</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Son Giriş</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                      Müşteri bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => (
                    <TableRow key={c.id} className="hover:bg-black/[0.02]">
                      <TableCell className="font-mono text-sm font-medium">
                        {c.dealerCode}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.companyName}</p>
                          {c.tradeName && (
                            <p className="text-xs text-slate-400">{c.tradeName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {c.contactName ?? "-"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {c.phone ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono text-sm",
                            Number(c.balance) < 0 ? "text-red-600" : "text-slate-900"
                          )}
                        >
                          {formatCurrency(Number(c.balance))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-slate-600">
                          {formatCurrency(Number(c.creditLimit))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[c.status] ?? "secondary"}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {c.lastLoginAt
                          ? new Date(c.lastLoginAt).toLocaleDateString("tr-TR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5 relative z-10">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title="Detay"
                            onClick={() => router.push("/admin/musteriler/" + c.id)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title="Cari Hesap"
                            onClick={() => router.push("/admin/musteriler/" + c.id + "?tab=cari")}
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </Button>

                          {(c.status === "APPROVED" || c.status === "SUSPENDED") && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title={c.status === "APPROVED" ? "Askiya Al" : "Aktif Et"}
                              disabled={togglingId === c.id}
                              onClick={() => toggleStatus(c)}
                            >
                              {c.status === "APPROVED" ? (
                                <PauseCircle className="w-3.5 h-3.5 text-orange-500" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-slate-500">
                Toplam {meta.total} kayıt
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
