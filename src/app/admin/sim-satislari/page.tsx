"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SimSaleForm } from "@/components/admin/sim-sale-form"
import { SimExpiryBadge } from "@/components/admin/sim-expiry-badge"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { formatDate } from "@/lib/utils/format"
import { SIM_PACKAGE_LABELS } from "@/lib/validators/sim-sale"
import { cn } from "@/lib/utils"

interface SimSale {
  id: string
  buyerName: string
  contactPhone: string
  simPhoneNumber: string | null
  tcNumber: string | null
  idPhotoUrl: string | null
  package: "GB5" | "GB8" | "GB15"
  purchaseDate: string
  endDate: string
  customer: { companyName: string; dealerCode: string } | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function SimSatislariPage() {
  const [sales, setSales] = useState<SimSale[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editSale, setEditSale] = useState<SimSale | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SimSale | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search ? { search } : {}),
    })
    const res = await fetch(`/api/admin/sim-sales?${params}`)
    if (res.ok) {
      const json = await res.json()
      setSales(json.data ?? [])
      setMeta(json.meta ?? null)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  useEffect(() => {
    setPage(1)
  }, [search])

  function handleEdit(sale: SimSale) {
    setEditSale(sale)
    setFormOpen(true)
  }

  function handleDeleteRequest(sale: SimSale) {
    setDeleteTarget(sale)
    setConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/admin/sim-sales/${deleteTarget.id}`, {
      method: "DELETE",
    })
    setDeleting(false)
    if (res.ok) {
      setConfirmOpen(false)
      setDeleteTarget(null)
      fetchSales()
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">SIM Satışları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta ? `${meta.total} SIM kaydı` : "Turkcell SIM satış takibi"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditSale(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Yeni SIM Satışı
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Ad veya telefon ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchSales}
              aria-label="Yenile"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>İletişim No</TableHead>
                <TableHead className="hidden lg:table-cell">Hat No / TC</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead className="hidden sm:table-cell">Satın Alma</TableHead>
                <TableHead className="hidden md:table-cell">Bitiş</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right pr-4">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!loading && sales.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    SIM kaydı bulunamadı.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {sale.idPhotoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sale.idPhotoUrl}
                            alt={sale.buyerName}
                            className="w-9 h-9 rounded-lg object-cover border border-border bg-muted shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{sale.buyerName}</p>
                          {sale.customer && (
                            <p className="text-xs text-muted-foreground">
                              Bayi: {sale.customer.companyName}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{sale.contactPhone}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {sale.simPhoneNumber && (
                        <p>{sale.simPhoneNumber}</p>
                      )}
                      {sale.tcNumber && (
                        <p className="text-xs">TC: {sale.tcNumber}</p>
                      )}
                      {!sale.simPhoneNumber && !sale.tcNumber && (
                        <span className="text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {SIM_PACKAGE_LABELS[sale.package] ?? sale.package}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(sale.purchaseDate)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(sale.endDate)}
                    </TableCell>
                    <TableCell>
                      <SimExpiryBadge endDate={sale.endDate} />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(sale)}
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteRequest(sale)}
                          aria-label="Sil"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                {(meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)} / {meta.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SIM Form Dialog */}
      <SimSaleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={
          editSale
            ? {
                id: editSale.id,
                buyerName: editSale.buyerName,
                contactPhone: editSale.contactPhone,
                simPhoneNumber: editSale.simPhoneNumber ?? "",
                tcNumber: editSale.tcNumber ?? "",
                idPhotoUrl: editSale.idPhotoUrl ?? "",
                package: editSale.package,
                purchaseDate: editSale.purchaseDate.slice(0, 10),
              }
            : undefined
        }
        onSuccess={fetchSales}
      />

      {/* Silme Onay */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`"${deleteTarget?.buyerName}" silinsin mi?`}
        description="Bu SIM kaydı silinecek. Bu işlem geri alınamaz."
        confirmLabel="Sil"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  )
}
