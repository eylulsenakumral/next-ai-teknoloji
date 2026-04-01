"use client"

import { useState, useEffect } from "react"
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

  async function loadCategories() {
    const res = await fetch("/api/categories?flat=true&isActive=true")
    if (res.ok) {
      const json = await res.json()
      setCategories(json.data ?? [])
    }
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

  const selectableCategories = isEditing
    ? categories.filter((c) => c.id !== initialData?.id)
    : categories

  function getIndent(depth: number) {
    return "\u00A0".repeat(depth * 3)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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

          <div className="space-y-1.5">
            <Label htmlFor="cat-name">
              Kategori Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Örn: Bilgisayar & Sunucu"
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
              placeholder="bilgisayar-sunucu"
              aria-invalid={Boolean(errors.slug)}
            />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-parent">Üst Kategori</Label>
            <Select
              value={form.parentId ?? "none"}
              onValueChange={(val) =>
                setForm((p) => ({ ...p, parentId: val === "none" ? null : val }))
              }
            >
              <SelectTrigger id="cat-parent" className="w-full">
                <SelectValue placeholder="Kök kategori (yok)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Kök kategori</SelectItem>
                {selectableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {getIndent(c.depth)}{c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parentId && (
              <p className="text-xs text-destructive">{errors.parentId[0]}</p>
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
