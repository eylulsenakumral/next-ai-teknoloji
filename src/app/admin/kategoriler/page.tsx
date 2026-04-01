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
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  Plus, Pencil, Trash2, Search, RefreshCw, ChevronRight, ChevronDown,
  List, Network, Download, Upload, ChevronsUpDown, ChevronsDownUp,
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

type ViewMode = "tree" | "flat"

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
    { label: "Urunlu", value: withProducts, icon: Package, color: "text-rose-600" },
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

// ---------- Action buttons cell ----------
function ActionButtons({ cat, onAddChild, onEdit, onDelete }: {
  cat: FlatCategory
  onAddChild: (cat: FlatCategory) => void
  onEdit: (cat: FlatCategory) => void
  onDelete: (cat: FlatCategory) => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon-sm" onClick={() => onAddChild(cat)} aria-label="Alt kategori ekle" title="Alt kategori ekle">
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(cat)} aria-label="Duzenle">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost" size="icon-sm" onClick={() => onDelete(cat)} aria-label="Sil"
        className="text-destructive hover:text-destructive"
        disabled={cat._count.children > 0}
        title={cat._count.children > 0 ? "Alt kategoriler silinmeden silinemez" : "Sil"}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ---------- Main page ----------
export default function KategorilerPage() {
  const [categories, setCategories] = useState<FlatCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("tree")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Drag-and-drop reorder state
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
        console.error("Kategoriler yüklenemedi:", res.status, res.statusText)
        setCategories([])
      }
    } catch (err) {
      console.error("Kategoriler fetch hatası:", err)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Auto-expand root nodes on first load
  useEffect(() => {
    if (categories.length > 0 && expandedNodes.size === 0) {
      const roots = categories.filter((c) => c.parentId === null).map((c) => c.id)
      setExpandedNodes(new Set(roots))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length > 0])

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
      setDeleteError(json.error ?? "Silme islemi basarisiz.")
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
        toast({ title: "Disa aktarildi", description: "TSV dosyasi indirildi." })
      } else {
        toast({ title: "Hata", description: "Disa aktarma basarisiz.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Hata", description: "Disa aktarma basarisiz.", variant: "destructive" })
    }
  }

  // ---------- Bulk selection handlers ----------
  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(categories.map((c) => c.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  // ---------- Drag-and-drop handlers ----------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Find the active category to determine parent group
    const activeCat = categories.find((c) => c.id === active.id)
    if (!activeCat) return

    // Get siblings (same parent)
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

    // Update local state optimistically
    const updatedCategories = categories.map((cat) => {
      const idx = reordered.findIndex((r) => r.id === cat.id)
      if (idx !== -1) return { ...cat, sortOrder: idx }
      return cat
    })
    setCategories(updatedCategories)

    // Persist to server
    setReordering(true)
    try {
      const items = reordered.map((cat, i) => ({ id: cat.id, sortOrder: i }))
      const res = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        toast({ title: "Hata", description: "Siralama kaydedilemedi.", variant: "destructive" })
        fetchCategories()
      }
    } catch {
      toast({ title: "Hata", description: "Siralama kaydedilemedi.", variant: "destructive" })
      fetchCategories()
    }
    setReordering(false)
  }

  // ---------- Derived data ----------
  const { treeCategories, childrenMap } = useMemo(() => {
    const childMap = new Map<string, FlatCategory[]>()
    for (const cat of categories) {
      const key = cat.parentId ?? "__root__"
      const list = childMap.get(key) ?? []
      list.push(cat)
      childMap.set(key, list)
    }
    for (const list of childMap.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    }

    const sorted = viewMode === "flat"
      ? [...categories].sort((a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      : []

    return { treeCategories: viewMode === "flat" ? sorted : [], childrenMap: childMap }
  }, [categories, viewMode])

  // ---------- Tree view renderer ----------
  function renderTreeRows(parentId: string | null, depth: number): React.ReactNode[] {
    const key = parentId ?? "__root__"
    const children = childrenMap.get(key) ?? []
    const rows: React.ReactNode[] = []

    // Wrap siblings in DndContext + SortableContext for drag-and-drop
    const sortableIds = children.map((c) => c.id)

    for (const cat of children) {
      const hasChildren = (childrenMap.get(cat.id)?.length ?? 0) > 0
      const isExpanded = expandedNodes.has(cat.id)
      const isChecked = selectedIds.has(cat.id)

      rows.push(
        <TableRow key={cat.id} className={cn(depth > 0 && "bg-muted/20")}>
          <TableCell>
            <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 24}px` }}>
              <button
                {...(depth === 0 || parentId ? {} : {})}
                className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted transition-colors shrink-0 touch-none"
                aria-label="Surukle"
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
              </button>
              <Checkbox
                checked={isChecked}
                onCheckedChange={(val) => toggleSelect(cat.id, !!val)}
              />
              {hasChildren ? (
                <button
                  onClick={() => toggleNode(cat.id)}
                  className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                  aria-label={isExpanded ? "Daralt" : "Genislet"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <span className="w-5 shrink-0" />
              )}
              {isExpanded && hasChildren ? (
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{cat.name}</p>
                <code className="text-xs text-muted-foreground">{cat.slug}</code>
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Badge className={cn("text-[10px] h-4 px-1.5 font-mono", depthColors[cat.depth] ?? depthColors[4])}>
              {depthLabels[cat.depth] ?? `L${cat.depth}`}
            </Badge>
          </TableCell>
          <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
            {cat._count.children > 0 ? cat._count.children : <span className="text-muted-foreground/50">-</span>}
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
            <ActionButtons cat={cat} onAddChild={handleAddChild} onEdit={handleEdit} onDelete={handleDeleteRequest} />
          </TableCell>
        </TableRow>
      )

      if (hasChildren && isExpanded) {
        rows.push(...renderTreeRows(cat.id, depth + 1))
      }
    }

    return rows
  }

  // ---------- Flat view with DnD ----------
  function renderFlatView() {
    // Group categories by parent for sortable contexts
    const groupedByParent = new Map<string | null, FlatCategory[]>()
    for (const cat of treeCategories) {
      const key = cat.parentId
      const list = groupedByParent.get(key) ?? []
      list.push(cat)
      groupedByParent.set(key, list)
    }

    return treeCategories.map((cat) => {
      const isChecked = selectedIds.has(cat.id)
      return (
        <TableRow key={cat.id}>
          <TableCell>
            <div className="flex items-center gap-1.5">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <Checkbox
                checked={isChecked}
                onCheckedChange={(val) => toggleSelect(cat.id, !!val)}
              />
              <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{cat.name}</p>
                <code className="text-xs text-muted-foreground">{cat.slug}</code>
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Badge className={cn("text-[10px] h-4 px-1.5 font-mono", depthColors[cat.depth] ?? depthColors[4])}>
              {depthLabels[cat.depth] ?? `L${cat.depth}`}
            </Badge>
          </TableCell>
          <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
            {cat._count.children > 0 ? cat._count.children : <span className="text-muted-foreground/50">-</span>}
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
            <ActionButtons cat={cat} onAddChild={handleAddChild} onEdit={handleEdit} onDelete={handleDeleteRequest} />
          </TableCell>
        </TableRow>
      )
    })
  }

  // Get sibling IDs for current drag context
  const rootSiblingIds = useMemo(
    () => categories.filter((c) => c.parentId === null).map((c) => c.id),
    [categories]
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Yukleniyor..." : `${categories.length} kategori`}
            {reordering && " (Siralaniyor...)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} title="Ice Aktar">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Ice Aktar</span>
          </Button>
          <Button variant="outline" onClick={handleExport} title="Disa Aktar">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Disa Aktar</span>
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
                    {s === "all" ? "Tumu" : s === "active" ? "Aktif" : "Pasif"}
                  </button>
                ))}
              </div>

              {/* Gorunum toggle */}
              <div className="flex rounded-lg border border-input overflow-hidden">
                <button
                  onClick={() => setViewMode("flat")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "flat" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  )}
                  aria-label="Liste gorunumu"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("tree")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "tree" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  )}
                  aria-label="Agac gorunumu"
                >
                  <Network className="h-4 w-4" />
                </button>
              </div>

              {/* Expand/Collapse all (tree mode) */}
              {viewMode === "tree" && (
                <div className="flex rounded-lg border border-input overflow-hidden">
                  <button
                    onClick={expandAll}
                    className="p-1.5 transition-colors hover:bg-muted text-muted-foreground"
                    aria-label="Tumunu genislet"
                    title="Tumunu genislet"
                  >
                    <ChevronsUpDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={collapseAll}
                    className="p-1.5 transition-colors hover:bg-muted text-muted-foreground"
                    aria-label="Tumunu daralt"
                    title="Tumunu daralt"
                  >
                    <ChevronsDownUp className="h-4 w-4" />
                  </button>
                </div>
              )}

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
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={rootSiblingIds} strategy={verticalListSortingStrategy}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Seviye</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Alt</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Urun</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
                    <TableHead className="text-right pr-4">Islemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Yukleniyor...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Kategori bulunamadi.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && viewMode === "tree" && renderTreeRows(null, 0)}
                  {!loading && viewMode === "flat" && renderFlatView()}
                </TableBody>
              </Table>
            </SortableContext>
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
            : "Bu kategori kalici olarak silinecek. Bu islem geri alinamaz."
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
