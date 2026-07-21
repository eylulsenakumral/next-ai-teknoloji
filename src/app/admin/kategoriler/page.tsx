"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus, Pencil, Trash2, Search, RefreshCw, ChevronRight, ChevronDown,
  Download, Upload, ChevronsUpDown, ChevronsDownUp,
  FolderOpen, Folder, Package, Layers, Eye, EyeOff, GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CategoryForm } from "@/components/admin/category-form"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { BulkActionBar } from "@/components/admin/kategoriler/bulk-action-bar"
import { ImportModal } from "@/components/admin/kategoriler/import-modal"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

// ---------- Types ----------
interface CategoryCount {
  children: number
  products: number
}

interface FlatCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  path: string | null
  isActive: boolean
  sortOrder: number
  description: string | null
  imageUrl: string | null
  _count: CategoryCount
  parent?: { id: string; name: string } | null
}

// ---------- Constants ----------
const depthColors: Record<number, string> = {
  0: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  1: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  2: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  3: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  4: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
}

const depthLabels: Record<number, string> = {
  0: "Ana",
  1: "L1",
  2: "L2",
  3: "L3",
  4: "L4",
}

// ---------- Sortable Tree Row ----------
function SortableTreeRow({
  cat,
  depth,
  hasChildren,
  isExpanded,
  isChecked,
  onToggle,
  onCheck,
  onAddChild,
  onEdit,
  onDelete,
}: {
  cat: FlatCategory
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  isChecked: boolean
  onToggle: () => void
  onCheck: (id: string, checked: boolean) => void
  onAddChild: (cat: FlatCategory) => void
  onEdit: (cat: FlatCategory) => void
  onDelete: (cat: FlatCategory) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={cn("transition-colors", depth === 0 && "bg-muted/40 font-semibold", depth === 1 && "bg-muted/15", depth === 2 && "bg-muted/5")}>
      <TableCell>
        <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 36}px` }}>
          {/* Tree connector lines */}
          {depth > 0 && (
            <span className="shrink-0 text-muted-foreground/40 font-mono text-xs select-none mr-0.5">
              {"└─"}
            </span>
          )}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted transition-colors shrink-0 touch-none"
            aria-label="Sürükle"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
          </button>
          <Checkbox
            checked={isChecked}
            onCheckedChange={(val) => onCheck(cat.id, !!val)}
          />
          {hasChildren ? (
            <button
              onClick={onToggle}
              className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
              aria-label={isExpanded ? "Daralt" : "Genişlet"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          {isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <p className={cn("text-sm truncate", depth === 0 ? "font-bold" : "font-medium")}>{cat.name}</p>
            {depth === 0 && <code className="text-xs text-muted-foreground">{cat.slug}</code>}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge className={cn("text-[10px] h-4 px-1.5 font-mono", depthColors[cat.depth] ?? depthColors[4])}>
          {depthLabels[cat.depth] ?? `L${cat.depth}`}
        </Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
        {cat._count.children > 0 ? (
          <Badge variant="outline" className="text-[10px]">{cat._count.children}</Badge>
        ) : (
          <span className="text-muted-foreground/50">-</span>
        )}
      </TableCell>
      <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
        {cat._count.products > 0 ? cat._count.products : <span className="text-muted-foreground/50">-</span>}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={cat.isActive ? "default" : "outline"}>
          {cat.isActive ? "Aktif" : "Pasif"}
        </Badge>
      </TableCell>
      <TableCell className="text-right pr-4">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onAddChild(cat)} title="Alt kategori ekle">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(cat)} title="Düzenle">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon-sm" onClick={() => onDelete(cat)}
            className="text-destructive hover:text-destructive"
            disabled={cat._count.children > 0}
            title={cat._count.children > 0 ? "Alt kategoriler silinmeden silinemez" : "Sil"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ---------- Stats component ----------
function StatsCards({ categories }: { categories: FlatCategory[] }) {
  const total = categories.length
  const active = categories.filter((c) => c.isActive).length
  const inactive = total - active
  const withProducts = categories.filter((c) => c._count.products > 0).length
  const depth0 = categories.filter((c) => c.depth === 0).length

  const stats = [
    { label: "Toplam Kategori", value: total, icon: Layers, color: "text-blue-600" },
    { label: "Aktif", value: active, icon: Eye, color: "text-emerald-600" },
    { label: "Pasif", value: inactive, icon: EyeOff, color: "text-amber-600" },
    { label: "Ana Kategori", value: depth0, icon: Folder, color: "text-purple-600" },
    { label: "Ürünü Olan", value: withProducts, icon: Package, color: "text-rose-600" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <Card key={s.label} size="sm">
          <CardContent className="flex items-center gap-3">
            <s.icon className={cn("h-5 w-5 shrink-0", s.color)} />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground truncate">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------- Main page ----------
export default function KategorilerPage() {
  const [categories, setCategories] = useState<FlatCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  // Form
  const [formOpen, setFormOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<FlatCategory | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null)

  // Confirm
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FlatCategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string>("")

  // Import
  const [importOpen, setImportOpen] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        flat: "true",
        ...(search ? { search } : {}),
        ...(filterStatus !== "all" ? { isActive: filterStatus === "active" ? "true" : "false" } : {}),
      })
      const res = await fetch(`/api/categories?${params}`)
      if (res.ok) {
        const json = await res.json()
        setCategories(json.data ?? [])
      } else {
        setCategories([])
      }
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Auto-expand ALL nodes whenever categories change
  useEffect(() => {
    if (categories.length > 0) {
      setExpandedNodes(new Set(categories.map((c) => c.id)))
    }
  }, [categories])

  // ---------- Navigation helpers ----------
  function toggleNode(id: string) {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() { setExpandedNodes(new Set(categories.map((c) => c.id))) }
  function collapseAll() { setExpandedNodes(new Set()) }

  // ---------- CRUD handlers ----------
  function handleEdit(cat: FlatCategory) {
    setEditCategory(cat)
    setDefaultParentId(null)
    setFormOpen(true)
  }

  function handleAddChild(cat: FlatCategory) {
    setEditCategory(null)
    setDefaultParentId(cat.id)
    setFormOpen(true)
  }

  function handleNew() {
    setEditCategory(null)
    setDefaultParentId(null)
    setFormOpen(true)
  }

  function handleDeleteRequest(cat: FlatCategory) {
    setDeleteTarget(cat)
    setDeleteError("")
    setConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError("")
    const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" })
    const json = await res.json()
    setDeleting(false)
    if (res.ok) {
      setConfirmOpen(false)
      setDeleteTarget(null)
      toast({ title: "Silindi", description: `"${deleteTarget.name}" kategorisi silindi.` })
      fetchCategories()
    } else {
      setDeleteError(json.error ?? "Silme işlemi başarısız.")
    }
  }

  async function handleExport() {
    try {
      const res = await fetch("/api/categories/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `kategoriler-${new Date().toISOString().slice(0, 10)}.tsv`
        a.click()
        URL.revokeObjectURL(url)
        toast({ title: "Dışa aktarıldı", description: "TSV dosyası indirildi." })
      } else {
        toast({ title: "Hata", description: "Dışa aktarma başarısız.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Hata", description: "Dışa aktarma başarısız.", variant: "destructive" })
    }
  }

  // ---------- Bulk selection ----------
  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  function selectAll() { setSelectedIds(new Set(categories.map((c) => c.id))) }
  function clearSelection() { setSelectedIds(new Set()) }

  // ---------- Drag-and-drop ----------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeCat = categories.find((c) => c.id === active.id)
    if (!activeCat) return

    // Get siblings (same parent) for reorder
    const siblings = categories
      .filter((c) => c.parentId === activeCat.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

    const oldIndex = siblings.findIndex((c) => c.id === active.id)
    const newIndex = siblings.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Reorder locally
    const reordered = [...siblings]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    // Optimistic update
    const updatedCategories = categories.map((cat) => {
      const idx = reordered.findIndex((r) => r.id === cat.id)
      if (idx !== -1) return { ...cat, sortOrder: idx }
      return cat
    })
    setCategories(updatedCategories)

    // Persist
    setReordering(true)
    try {
      const items = reordered.map((cat, i) => ({ id: cat.id, sortOrder: i }))
      const res = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        toast({ title: "Hata", description: "Sıralama kaydedilemedi.", variant: "destructive" })
        fetchCategories()
      }
    } catch {
      toast({ title: "Hata", description: "Sıralama kaydedilemedi.", variant: "destructive" })
      fetchCategories()
    }
    setReordering(false)
  }

  // ---------- Derived data ----------
  const childrenMap = useMemo(() => {
    const map = new Map<string, FlatCategory[]>()
    for (const cat of categories) {
      const key = cat.parentId ?? "__root__"
      const list = map.get(key) ?? []
      list.push(cat)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    }
    return map
  }, [categories])

  // ---------- Tree rendering ----------
  function renderTreeRows(parentId: string | null, depth: number): React.ReactNode[] {
    const key = parentId ?? "__root__"
    const children = childrenMap.get(key) ?? []
    if (children.length === 0) return []

    const rows: React.ReactNode[] = []

    for (const cat of children) {
      const hasChildren = (childrenMap.get(cat.id)?.length ?? 0) > 0
      const isExpanded = expandedNodes.has(cat.id)

      rows.push(
        <SortableTreeRow
          key={cat.id}
          cat={cat}
          depth={depth}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          isChecked={selectedIds.has(cat.id)}
          onToggle={() => toggleNode(cat.id)}
          onCheck={toggleSelect}
          onAddChild={handleAddChild}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )

      // Render children inline (expanded)
      if (hasChildren && isExpanded) {
        rows.push(...renderTreeRows(cat.id, depth + 1))
      }
    }

    return rows
  }


  const activeCategory = activeId ? categories.find((c) => c.id === activeId) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Yükleniyor..." : `${categories.length} kategori`}
            {reordering && " (Sıralanıyor...)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} title="İçe Aktar">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">İçe Aktar</span>
          </Button>
          <Button variant="outline" onClick={handleExport} title="Dışa Aktar">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Dışa Aktar</span>
          </Button>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" />
            Yeni Kategori
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && <StatsCards categories={categories} />}

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Kategori ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {/* Durum filtresi */}
              <div className="flex rounded-lg border border-input overflow-hidden text-sm">
                {(["all", "active", "inactive"] as const).map((s) => (
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

              {/* Expand/Collapse all */}
              <div className="flex rounded-lg border border-input overflow-hidden">
                <button
                  onClick={expandAll}
                  className="p-1.5 transition-colors hover:bg-muted text-muted-foreground"
                  title="Tümünü genişlet"
                >
                  <ChevronsUpDown className="h-4 w-4" />
                </button>
                <button
                  onClick={collapseAll}
                  className="p-1.5 transition-colors hover:bg-muted text-muted-foreground"
                  title="Tümünü daralt"
                >
                  <ChevronsDownUp className="h-4 w-4" />
                </button>
              </div>

              <Button variant="ghost" size="icon" onClick={fetchCategories} aria-label="Yenile">
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Seviye</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Alt</TableHead>
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
                {!loading && categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Kategori bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && (
                  <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {renderTreeRows(null, 0)}
                  </SortableContext>
                )}
              </TableBody>
            </Table>
            <DragOverlay>
              {activeCategory && (
                <div className="bg-background border rounded-md px-3 py-2 shadow-lg flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <Folder className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">{activeCategory.name}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={Array.from(selectedIds)}
        totalCount={categories.length}
        onClear={clearSelection}
        onSelectAll={selectAll}
        onSuccess={() => { fetchCategories(); clearSelection() }}
      />

      {/* Kategori Form */}
      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editCategory ? {
          id: editCategory.id,
          name: editCategory.name,
          slug: editCategory.slug,
          parentId: editCategory.parentId,
          description: editCategory.description ?? "",
          imageUrl: editCategory.imageUrl ?? "",
          isActive: editCategory.isActive,
          sortOrder: editCategory.sortOrder,
        } : undefined}
        defaultParentId={defaultParentId}
        onSuccess={fetchCategories}
      />

      {/* Silme Onay */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setDeleteError("")
        }}
        title={`"${deleteTarget?.name}" silinsin mi?`}
        description={
          deleteError
            ? deleteError
            : "Bu kategori kalıcı olarak silinecek. Bu işlem geri alınamaz."
        }
        confirmLabel="Sil"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

      {/* Import Modal */}
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchCategories}
      />
    </div>
  )
}
