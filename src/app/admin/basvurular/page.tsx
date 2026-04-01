"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApplicationReview } from "@/components/admin/application-review"
import { cn } from "@/lib/utils"

interface Application {
  id: string
  companyName: string
  contactName: string
  phone: string
  email: string
  city: string | null
  businessType: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO"
  createdAt: string
  reviewedAt: string | null
  customer: { dealerCode: string } | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekleyen",
  APPROVED: "Onaylı",
  REJECTED: "Reddedilmiş",
  NEEDS_INFO: "Bilgi Bekleniyor",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-3 h-3" />,
  APPROVED: <CheckCircle className="w-3 h-3" />,
  REJECTED: <XCircle className="w-3 h-3" />,
  NEEDS_INFO: <HelpCircle className="w-3 h-3" />,
}

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  NEEDS_INFO: "outline",
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "Tümü", value: "ALL" },
  { label: "Bekleyen", value: "PENDING" },
  { label: "Onaylı", value: "APPROVED" },
  { label: "Reddedilmiş", value: "REJECTED" },
  { label: "Bilgi Bekleniyor", value: "NEEDS_INFO" },
]

export default function BasvurularPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")
  const [page, setPage] = useState(1)

  const [reviewId, setReviewId] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search ? { search } : {}),
      ...(filterStatus !== "ALL" ? { status: filterStatus } : {}),
    })
    const res = await fetch(`/api/applications?${params}`)
    if (res.ok) {
      const json = await res.json()
      setApplications(json.data ?? [])
      setMeta(json.meta ?? null)
    }
    setLoading(false)
  }, [page, search, filterStatus])

  useEffect(() => {
    const timer = setTimeout(fetchApplications, 300)
    return () => clearTimeout(timer)
  }, [fetchApplications])

  function openReview(id: string) {
    setReviewId(id)
    setReviewOpen(true)
  }

  function handleReviewDone() {
    setReviewOpen(false)
    fetchApplications()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bayi Başvuruları</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {meta?.total ?? 0} başvuru
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
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
                placeholder="Firma, yetkili, e-posta ara..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          {/* Filtreler */}
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
                  <TableHead>Firma</TableHead>
                  <TableHead>Yetkili</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>İl</TableHead>
                  <TableHead>Başvuru Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      Başvuru bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{app.companyName}</TableCell>
                      <TableCell>{app.contactName}</TableCell>
                      <TableCell className="text-slate-600">{app.phone}</TableCell>
                      <TableCell>{app.city ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {new Date(app.createdAt).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANTS[app.status] ?? "secondary"}
                          className="gap-1"
                        >
                          {STATUS_ICONS[app.status]}
                          {STATUS_LABELS[app.status] ?? app.status}
                        </Badge>
                        {app.customer?.dealerCode && (
                          <span className="ml-2 text-xs text-green-600 font-mono">
                            {app.customer.dealerCode}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReview(app.id)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          İncele
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Sayfalama */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-slate-500">
                {meta.total} başvurudan {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} arası gösteriliyor
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

      {reviewId && (
        <ApplicationReview
          applicationId={reviewId}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onDone={handleReviewDone}
        />
      )}
    </div>
  )
}
