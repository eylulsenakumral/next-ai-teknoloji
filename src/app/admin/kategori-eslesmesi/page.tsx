"use client"

import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { RefreshCw, Save, Search, CheckCircle2, Clock, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

// ---------- Types ----------
interface SupplierCategory {
  supplierCode: string
  supplierName: string | null
  supplierCatName: string
  productCount: number
  mappedCategoryId: string | null
  mappedCategoryName: string | null
  mappedCategoryPath: string | null
  mapId: string | null
}

interface SystemCategory {
  id: string
  name: string
  path: string | null
  depth: number
}

// Row-level pending state: categoryId user seçti ama henüz kaydetmedi
type PendingMap = Record<string, string | null> // key = `${supplierCode}::${supplierCatName}`

// ---------- Helpers ----------
function rowKey(row: SupplierCategory) {
  return `${row.supplierCode}::${row.supplierCatName}`
}

function buildCategoryLabel(cat: SystemCategory): string {
  if (cat.path) return cat.path.replace(/\//g, " > ")
  return cat.name
}

function indentLabel(cat: SystemCategory): string {
  const prefix = "  ".repeat(cat.depth)
  return `${prefix}${cat.name}`
}

// Tedarikçi kodu → renkli badge
const SUPPLIER_COLORS: Record<string, string> = {
  INDEXGRUP: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  NETEX: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  OKISAN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  B2BDEPO: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
}

function SupplierBadge({ code, name }: { code: string; name: string | null }) {
  const color =
    SUPPLIER_COLORS[code.toUpperCase()] ??
    "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
  return (
    <Badge className={cn("font-medium text-xs", color)}>
      {name ?? code}
    </Badge>
  )
}

// ---------- Category Combobox ----------
interface CategoryComboboxProps {
  categories: SystemCategory[]
  value: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
}

function CategoryCombobox({ categories, value, onChange, disabled }: CategoryComboboxProps) {
  console.log("[DEBUG-COMBOBOX] Categories prop:", categories.length, "items")
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selected = categories.find((c) => c.id === value) ?? null

  const filtered = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.path ?? "").toLowerCase().includes(q)
    )
  }, [categories, search])

  // Calculate dropdown position when opened
  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const dropdownHeight = 300 // approximate max height
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Default position: below the trigger
      let top = rect.bottom + window.scrollY + 4
      let left = rect.left + window.scrollX
      const width = Math.max(rect.width, 288) // w-72 = 288px minimum
      
      // Check if dropdown would go below viewport
      if (top + dropdownHeight - window.scrollY > viewportHeight) {
        // Position above instead
        top = rect.top + window.scrollY - dropdownHeight - 4
      }
      
      // Check if dropdown would go off right edge
      if (left + width > viewportWidth) {
        left = viewportWidth - width - 16
      }
      
      // Check if dropdown would go off left edge
      if (left < 16) {
        left = 16
      }
      
      setPosition({ top, left, width })
    } else {
      setPosition(null)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      console.log("[DEBUG-COMBOBOX] Dropdown açıldı, filtered:", filtered.length, "items")
    }
  }, [open, filtered])

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      // Check if click is outside trigger AND outside dropdown
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function handleSelect(id: string | null) {
    onChange(id)
    setOpen(false)
    setSearch("")
  }

  return (
    <div className="relative w-full max-w-[280px]">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn("truncate text-left", !selected && "text-muted-foreground")}>
          {selected ? buildCategoryLabel(selected) : "Kategori seç..."}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  handleSelect(null)
                }
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && position && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] rounded-md border bg-popover text-popover-foreground shadow-md"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            maxHeight: '300px'
          }}
        >
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                autoFocus
                placeholder="Kategori ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-muted-foreground italic",
                value === null && "bg-muted"
              )}
            >
              — Seçimi kaldır
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Sonuç bulunamadı.</p>
            )}
            {filtered.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelect(cat.id)}
                className={cn(
                  "block w-full text-left px-3 py-1.5 text-sm hover:bg-muted truncate",
                  value === cat.id && "bg-muted font-medium"
                )}
                title={buildCategoryLabel(cat)}
              >
                {indentLabel(cat)}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}



// ---------- Skeleton rows ----------
function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-12" /></TableCell>
          <TableCell><Skeleton className="h-7 w-56" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ---------- Main page ----------
export default function KategoriEslesmesiPage() {
  const [rows, setRows] = useState<SupplierCategory[]>([])
  const [categories, setCategories] = useState<SystemCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

  // Filters
  const [filterSupplier, setFilterSupplier] = useState<string>("__all__")
  const [filterUnmapped, setFilterUnmapped] = useState(false)
  const [search, setSearch] = useState("")

  // Pending selections (unsaved changes per row)
  const [pending, setPending] = useState<PendingMap>({})

  // ---------- Load data ----------
  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(
        filterSupplier !== "__all__" ? { supplierCode: filterSupplier } : {}
      )
      const res = await fetch(`/api/supplier-categories?${params}`, { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        setRows(json.data ?? [])
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [filterSupplier])

  useEffect(() => {
    console.log("[DEBUG] Kategorileri fetch etmeye başlıyor...")
    fetch("/api/categories?flat=true", { credentials: 'include' })
      .then(async (r) => {
        console.log("[DEBUG] API Response status:", r.status)
        if (!r.ok) {
          const json = await r.json()
          console.log("[DEBUG] Error response:", json)
          throw new Error(json.error || "Kategoriler yüklenemedi")
        }
        return r.json()
      })
      .then((json) => {
        console.log("[DEBUG] Kategoriler geldi, sayı:", json.data?.length ?? 0)
        console.log("[DEBUG] İlk 3 kategori:", json.data?.slice(0, 3))
        setCategories(json.data ?? [])
      })
      .catch((err) => {
        console.error("[DEBUG] Kategoriler yüklenirken hata:", err)
        setCategories([])
      })
  }, [])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  // Reset pending when rows reload
  useEffect(() => {
    setPending({})
  }, [rows])

  // ---------- Derived data ----------
  const suppliers = useMemo(() => {
    const seen = new Map<string, string | null>()
    for (const r of rows) {
      if (!seen.has(r.supplierCode)) seen.set(r.supplierCode, r.supplierName)
    }
    return Array.from(seen.entries()).map(([code, name]) => ({ code, name }))
  }, [rows])

  const filtered = useMemo(() => {
    let result = rows
    if (filterUnmapped) {
      result = result.filter((r) => {
        const key = rowKey(r)
        const effectiveCatId = key in pending ? pending[key] : r.mappedCategoryId
        return !effectiveCatId
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.supplierCatName.toLowerCase().includes(q) ||
          (r.supplierName ?? r.supplierCode).toLowerCase().includes(q) ||
          (r.mappedCategoryName ?? "").toLowerCase().includes(q)
      )
    }
    return result
  }, [rows, filterUnmapped, search, pending])

  // Rows with pending changes (dirty)
  const dirtyKeys = useMemo(() => {
    return new Set(
      Object.entries(pending)
        .filter(([key, newCatId]) => {
          const row = rows.find((r) => rowKey(r) === key)
          if (!row) return false
          return newCatId !== row.mappedCategoryId
        })
        .map(([key]) => key)
    )
  }, [pending, rows])

  // ---------- Handlers ----------
  function handleCategoryChange(row: SupplierCategory, categoryId: string | null) {
    const key = rowKey(row)
    setPending((prev) => ({ ...prev, [key]: categoryId }))
  }

  function getEffectiveCategoryId(row: SupplierCategory): string | null {
    const key = rowKey(row)
    return key in pending ? pending[key] : row.mappedCategoryId
  }

  async function saveRow(row: SupplierCategory) {
    const key = rowKey(row)
    const categoryId = key in pending ? pending[key] : row.mappedCategoryId

    setSavingKeys((prev) => new Set(prev).add(key))
    try {
      let res: Response
      if (row.mapId) {
        // PATCH existing
        res = await fetch(`/api/supplier-category-maps/${row.mapId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ categoryId }),
        })
      } else {
        // POST new
        res = await fetch("/api/supplier-category-maps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({
            supplierCode: row.supplierCode,
            supplierCatName: row.supplierCatName,
            categoryId,
          }),
        })
      }

      const json = await res.json()
      if (res.ok) {
        const updatedCount: number = json.updatedProductCount ?? 0
        toast({
          title: "Kaydedildi",
          description: updatedCount > 0
            ? `Eşleşme kaydedildi. ${updatedCount} ürün güncellendi.`
            : "Eşleşme kaydedildi.",
        })
        // Update rows in place (no full reload)
        const catId = categoryId
        const cat = catId ? categories.find((c) => c.id === catId) ?? null : null
        setRows((prev) =>
          prev.map((r) => {
            if (rowKey(r) !== key) return r
            return {
              ...r,
              mappedCategoryId: catId,
              mappedCategoryName: cat?.name ?? null,
              mappedCategoryPath: cat?.path ?? null,
              mapId: json.data?.id ?? r.mapId,
            }
          })
        )
        // Clear pending for this row
        setPending((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      } else {
        toast({
          title: "Hata",
          description: json.error ?? "Kaydetme başarısız.",
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: "Hata", description: "Kaydetme başarısız.", variant: "destructive" })
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  async function saveAll() {
    const toSave = filtered.filter((r) => dirtyKeys.has(rowKey(r)))
    if (toSave.length === 0) return
    // Fire all saves in parallel
    await Promise.all(toSave.map((r) => saveRow(r)))
  }

  // ---------- Stats ----------
  const totalMapped = rows.filter((r) => r.mappedCategoryId).length
  const totalUnmapped = rows.length - totalMapped

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kategori Eşleşmesi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Yükleniyor..."
              : `${rows.length} tedarikçi kategorisi · ${totalMapped} eşleştirildi · ${totalUnmapped} bekliyor`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchRows}
            disabled={loading}
            aria-label="Yenile"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>
          {dirtyKeys.size > 0 && (
            <Button onClick={saveAll} disabled={savingKeys.size > 0}>
              <Save className="h-4 w-4" />
              Tümünü Kaydet ({dirtyKeys.size})
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              {/* Supplier filter */}
              <Select
                value={filterSupplier}
                onValueChange={(val) => setFilterSupplier(val ?? "__all__")}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tüm tedarikçiler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tüm tedarikçiler</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name ?? s.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Unmapped only */}
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <Checkbox
                  checked={filterUnmapped}
                  onCheckedChange={(val) => setFilterUnmapped(!!val)}
                  id="filter-unmapped"
                />
                <span>Sadece eşleştirilmemişler</span>
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entegrasyon</TableHead>
                <TableHead>Tedarikçi Kategori Adı</TableHead>
                <TableHead className="text-center">Ürün</TableHead>
                <TableHead>Sistem Kategorisi</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead className="text-right pr-4">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <SkeletonRows count={8} />}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {rows.length === 0 ? "Tedarikçi kategorisi bulunamadı." : "Filtrelerle eşleşen kategori yok."}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                filtered.map((row) => {
                  const key = rowKey(row)
                  const effectiveCatId = getEffectiveCategoryId(row)
                  const isDirty = dirtyKeys.has(key)
                  const isSaving = savingKeys.has(key)
                  const isMapped = !!effectiveCatId

                  return (
                    <TableRow
                      key={key}
                      className={cn(isDirty && "bg-amber-50/50 dark:bg-amber-950/10")}
                    >
                      {/* Entegrasyon */}
                      <TableCell>
                        <SupplierBadge code={row.supplierCode} name={row.supplierName} />
                      </TableCell>

                      {/* Tedarikçi Kategori Adı */}
                      <TableCell className="max-w-[200px]">
                        <span className="text-sm" title={row.supplierCatName}>
                          {row.supplierCatName}
                        </span>
                      </TableCell>

                      {/* Ürün Sayısı */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs tabular-nums">
                          {row.productCount}
                        </Badge>
                      </TableCell>

                      {/* Sistem Kategorisi — Combobox */}
                      <TableCell>
                        <CategoryCombobox
                          categories={categories}
                          value={effectiveCatId}
                          onChange={(id) => handleCategoryChange(row, id)}
                          disabled={isSaving}
                        />
                      </TableCell>

                      {/* Durum */}
                      <TableCell className="text-center">
                        {isMapped ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Eşleştirildi
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
                            <Clock className="h-3 w-3" />
                            Bekliyor
                          </Badge>
                        )}
                      </TableCell>

                      {/* Kaydet */}
                      <TableCell className="text-right pr-4">
                        <Button
                          size="sm"
                          variant={isDirty ? "default" : "outline"}
                          disabled={!isDirty || isSaving}
                          onClick={() => saveRow(row)}
                        >
                          {isSaving ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Kaydet
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
