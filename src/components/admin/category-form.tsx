"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generateSlug } from "@/lib/utils/slug"
import type { CreateCategoryInput } from "@/lib/validators/category"

interface FlatCategory {
  id: string
  name: string
  depth: number
  parentId: string | null
}

interface CategoryFormData {
  name: string
  slug: string
  parentId: string | null
  description: string
  imageUrl: string
  isActive: boolean
  sortOrder: number
}

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<CategoryFormData> & { id?: string }
  defaultParentId?: string | null
  onSuccess: () => void
}

const defaultForm: CategoryFormData = {
  name: "",
  slug: "",
  parentId: null,
  description: "",
  imageUrl: "",
  isActive: true,
  sortOrder: 0,
}

interface FieldErrors {
  name?: string[]
  slug?: string[]
  parentId?: string[]
  description?: string[]
  imageUrl?: string[]
}

const MAX_DEPTH = 4

const levelLabels: Record<number, string> = {
  0: "L0 - Ana Kategori",
  1: "L1",
  2: "L2",
  3: "L3",
  4: "L4",
}

export function CategoryForm({
  open,
  onOpenChange,
  initialData,
  defaultParentId,
  onSuccess,
}: CategoryFormProps) {
  const [form, setForm] = useState<CategoryFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string>("")
  const [categories, setCategories] = useState<FlatCategory[]>([])
  const isEditing = Boolean(initialData?.id)

  // Cascading selections — one per depth level
  // selections[0] = selected L0 id, selections[1] = selected L1 id, etc.
  const [selections, setSelections] = useState<(string | null)[]>([null, null, null, null, null])

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name ?? "",
        slug: initialData?.slug ?? "",
        parentId: initialData?.parentId ?? defaultParentId ?? null,
        description: initialData?.description ?? "",
        imageUrl: initialData?.imageUrl ?? "",
        isActive: initialData?.isActive ?? true,
        sortOrder: initialData?.sortOrder ?? 0,
      })
      setErrors({})
      setServerError("")
      loadCategories()
    }
  }, [open, initialData, defaultParentId])

  // When categories load or parentId changes, rebuild selections chain
  useEffect(() => {
    if (categories.length === 0) return

    const targetId = form.parentId
    if (!targetId) {
      setSelections([null, null, null, null, null])
      return
    }

    // Build ancestor chain from targetId up to root
    const chain: string[] = []
    let current = categories.find((c) => c.id === targetId)
    while (current) {
      chain.unshift(current.id)
      current = current.parentId
        ? categories.find((c) => c.id === current!.parentId)
        : undefined
    }

    const newSelections: (string | null)[] = [null, null, null, null, null]
    chain.forEach((id, idx) => {
      if (idx < MAX_DEPTH) newSelections[idx] = id
    })
    setSelections(newSelections)
  }, [categories, form.parentId])

  async function loadCategories() {
    const res = await fetch("/api/categories?flat=true&isActive=true")
    if (res.ok) {
      const json = await res.json()
      setCategories(json.data ?? [])
    }
  }

  // Derive options for each depth level based on current selections
  const levelOptions = useMemo(() => {
    const opts: FlatCategory[][] = []

    // L0: root categories (no parent)
    opts[0] = categories.filter((c) => c.depth === 0 && !c.parentId)

    // L1-L4: children of previous selection
    for (let d = 1; d <= MAX_DEPTH; d++) {
      const parentId = selections[d - 1]
      if (parentId) {
        opts[d] = categories.filter((c) => c.parentId === parentId)
      } else {
        opts[d] = []
      }
    }

    return opts
  }, [categories, selections])

  // The deepest non-null selection is the actual parentId
  // If nothing selected, parentId = null (root)
  useEffect(() => {
    let parentId: string | null = null
    for (let d = MAX_DEPTH; d >= 0; d--) {
      if (selections[d]) {
        parentId = selections[d]
        break
      }
    }
    // Only update if different to avoid loops
    if (form.parentId !== parentId) {
      setForm((prev) => ({ ...prev, parentId }))
    }
  }, [selections])

  function handleLevelSelect(depth: number, value: string | null) {
    setSelections((prev) => {
      const next = [...prev]
      next[depth] = value

      // Clear all deeper selections
      for (let d = depth + 1; d <= MAX_DEPTH; d++) {
        next[d] = null
      }
      return next
    })
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setServerError("")

    const payload: CreateCategoryInput = {
      name: form.name,
      slug: form.slug || undefined,
      parentId: form.parentId || null,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    }

    const url = isEditing ? `/api/categories/${initialData!.id}` : "/api/categories"
    const method = isEditing ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (json.details) {
        setErrors(json.details as FieldErrors)
      } else {
        setServerError(json.error ?? "Bir hata oluştu.")
      }
      return
    }

    onSuccess()
    onOpenChange(false)
  }

  // Determine the target depth for the new category
  const targetDepth = useMemo(() => {
    for (let d = MAX_DEPTH; d >= 0; d--) {
      if (selections[d]) return d + 1
    }
    return 0
  }, [selections])

  // Filter out self when editing (prevent circular)
  const selectableCategories = isEditing
    ? categories.filter((c) => c.id !== initialData?.id)
    : categories

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Cascading Category Selection */}
          <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
            <Label className="text-sm font-semibold">Kategori Konumu</Label>
            <p className="text-xs text-muted-foreground">
              Ağaç yapısında konum seçin. Yeni kategori, en derin seçimin altına eklenecek.
            </p>

            {/* L0 - Root */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{levelLabels[0]}</Label>
              <Select
                value={selections[0] ?? "__none__"}
                onValueChange={(val) => handleLevelSelect(0, val === "__none__" ? null : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Kök kategori seç —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Yok (kök kategori) —</SelectItem>
                  {selectableCategories
                    .filter((c) => c.depth === 0 && !c.parentId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* L1 - L4: Only show if parent level is selected */}
            {[1, 2, 3, 4].map((depth) => {
              const parentSelected = selections[depth - 1]
              const options = levelOptions[depth]?.filter((c) =>
                selectableCategories.some((s) => s.id === c.id)
              ) ?? []

              // Don't render if parent not selected or no options
              if (!parentSelected || options.length === 0) return null

              return (
                <div key={depth} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{levelLabels[depth]}</Label>
                  <Select
                    value={selections[depth] ?? "__none__"}
                    onValueChange={(val) => handleLevelSelect(depth, val === "__none__" ? null : val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`— ${levelLabels[depth]} seç —`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Yok —</SelectItem>
                      {options.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}

            {/* Target depth indicator */}
            <div className="flex items-center gap-2 pt-1">
              <Badge level={targetDepth} />
              <span className="text-xs text-muted-foreground">
                Yeni kategori{" "}
                <strong>
                  {targetDepth === 0
                    ? "kök seviyede"
                    : `${levelLabels[targetDepth]} seviyesinde`}
                </strong>{" "}
                oluşturulacak
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-name">
              Kategori Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Örn: 2MP IP Kamera"
              aria-invalid={Boolean(errors.name)}
              required
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="2mp-ip-kamera"
              aria-invalid={Boolean(errors.slug)}
            />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-image">Görsel URL</Label>
            <Input
              id="cat-image"
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://..."
              aria-invalid={Boolean(errors.imageUrl)}
            />
            {errors.imageUrl && (
              <p className="text-xs text-destructive">{errors.imageUrl[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-description">Açıklama</Label>
            <textarea
              id="cat-description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Kategori açıklaması..."
              rows={3}
              className="h-auto w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="cat-active"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
            />
            <Label htmlFor="cat-active">Aktif</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Badge({ level }: { level: number }) {
  const colors: Record<number, string> = {
    0: "bg-blue-100 text-blue-800",
    1: "bg-emerald-100 text-emerald-800",
    2: "bg-amber-100 text-amber-800",
    3: "bg-purple-100 text-purple-800",
    4: "bg-rose-100 text-rose-800",
  }

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${colors[level] ?? colors[4]}`}>
      L{level}
    </span>
  )
}
