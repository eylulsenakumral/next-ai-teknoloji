"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toaster"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { BrandForm } from "@/components/admin/brand-form"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { cn } from "@/lib/utils"

interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  websiteUrl: string | null
  description: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  _count: { products: number }
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

type FilterStatus = "all" | "active" | "inactive"

export default function MarklarPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Form dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editBrand, setEditBrand] = useState<Brand | null>(null)

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchBrands = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search ? { search } : {}),
      ...(filterStatus !== "all" ? { isActive: filterStatus === "active" ? "true" : "false" } : {}),
    })
    const res = await fetch(`/api/brands?${params}`)
    if (res.ok) {
      const json = await res.json()
      setBrands(json.data ?? [])
      setMeta(json.meta ?? null)
    }
    setLoading(false)
  }, [page, search, filterStatus])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  // Search debounce
  useEffect(() => {
    setPage(1)
  }, [search, filterStatus])

  function handleEdit(brand: Brand) {
    setEditBrand(brand)
    setFormOpen(true)
  }

  async function handleToggleActive(brand: Brand) {
    const newVal = !brand.isActive
    setBrands((prev) => prev.map((b) => (b.id === brand.id ? { ...b, isActive: newVal } : b)))
    try {
      const res = await fetch(`/api/admin/icerik/${brand.id}?type=brands`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newVal }),
      })
      if (!res.ok) throw new Error()
      toast({ title: newVal ? "Aktifleştirildi" : "Pasifleştirildi" })
    } catch {
      setBrands((prev) => prev.map((b) => (b.id === brand.id ? { ...b, isActive: brand.isActive } : b)))
      toast({ title: "Hata", description: "Durum güncellenemedi.", variant: "destructive" })
    }
  }

  function handleDeleteRequest(brand: Brand) {
    setDeleteTarget(brand)
    setConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/brands/${deleteTarget.id}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) {
      setConfirmOpen(false)
      setDeleteTarget(null)
      fetchBrands()
    }
  }

  async function handleBulkDelete() {
    setDeleting(true)
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/brands/${id}`, { method: "DELETE" })
      )
    )
    setDeleting(false)
    setSelectedIds(new Set())
    setBulkDeleteConfirmOpen(false)
    fetchBrands()
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === brands.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(brands.map((b) => b.id)))
    }
  }

  const allSelected = brands.length > 0 && selectedIds.size === brands.length
  const someSelected = selectedIds.size > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Markalar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta ? `${meta.total} marka kayıtlı` : "Marka yönetimi"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditBrand(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Yeni Marka
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Arama */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Marka ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2 items-center">
              {/* Filtre */}
              <div className="flex rounded-lg border border-input overflow-hidden text-sm">
                {(["all", "active", "inactive"] as FilterStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "px-3 py-1.5 font-medium transition-colors",
                      filterStatus === s
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {s === "all" ? "Tümü" : s === "active" ? "Aktif" : "Pasif"}
                  </button>
                ))}
              </div>

              <Button variant="ghost" size="icon" onClick={fetchBrands} aria-label="Yenile">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {someSelected && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} seçildi
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Seçilenleri Sil
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-4">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Tümünü seç"
                  />
                </TableHead>
                <TableHead>Marka</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Ürün</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead className="text-right pr-4">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!loading && brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Marka bulunamadı.
                  </TableCell>
                </TableRow>
              )}
              {!loading && brands.map((brand) => (
                <TableRow
                  key={brand.id}
                  data-state={selectedIds.has(brand.id) ? "selected" : undefined}
                >
                  <TableCell className="px-4">
                    <Checkbox
                      checked={selectedIds.has(brand.id)}
                      onCheckedChange={() => toggleSelect(brand.id)}
                      aria-label={`${brand.name} seç`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="w-8 h-8 rounded object-contain border border-border bg-muted"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded border border-border bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {brand.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{brand.name}</p>
                        {brand.websiteUrl && (
                          <a
                            href={brand.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:underline truncate max-w-40 block"
                          >
                            {brand.websiteUrl.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{brand.slug}</code>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
                    {brand._count.products}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={brand.isActive}
                      onCheckedChange={() => handleToggleActive(brand)}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(brand)}
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteRequest(brand)}
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
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total}
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

      {/* Marka Form Dialog */}
      <BrandForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editBrand ? {
          id: editBrand.id,
          name: editBrand.name,
          slug: editBrand.slug,
          logoUrl: editBrand.logoUrl ?? "",
          description: editBrand.description ?? "",
          websiteUrl: editBrand.websiteUrl ?? "",
          isActive: editBrand.isActive,
          sortOrder: editBrand.sortOrder,
        } : undefined}
        onSuccess={fetchBrands}
      />

      {/* Silme Onay */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`"${deleteTarget?.name}" silinsin mi?`}
        description="Bu marka kalıcı olarak silinecek. Bağlı ürünler etkilenmeyecek."
        confirmLabel="Sil"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

      {/* Toplu Silme Onay */}
      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title={`${selectedIds.size} marka silinsin mi?`}
        description="Seçilen markalar kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Tümünü Sil"
        onConfirm={handleBulkDelete}
        loading={deleting}
      />
    </div>
  )
}
