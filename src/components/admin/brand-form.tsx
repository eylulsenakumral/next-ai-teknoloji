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
import { generateSlug } from "@/lib/utils/slug"
import type { CreateBrandInput } from "@/lib/validators/brand"

interface BrandFormData {
  name: string
  slug: string
  logoUrl: string
  description: string
  websiteUrl: string
  isActive: boolean
  sortOrder: number
}

interface BrandFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<BrandFormData> & { id?: string }
  onSuccess: () => void
}

const defaultForm: BrandFormData = {
  name: "",
  slug: "",
  logoUrl: "",
  description: "",
  websiteUrl: "",
  isActive: true,
  sortOrder: 0,
}

interface FieldErrors {
  name?: string[]
  slug?: string[]
  logoUrl?: string[]
  description?: string[]
  websiteUrl?: string[]
  isActive?: string[]
  sortOrder?: string[]
}

export function BrandForm({ open, onOpenChange, initialData, onSuccess }: BrandFormProps) {
  const [form, setForm] = useState<BrandFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string>("")
  const isEditing = Boolean(initialData?.id)

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name ?? "",
        slug: initialData?.slug ?? "",
        logoUrl: initialData?.logoUrl ?? "",
        description: initialData?.description ?? "",
        websiteUrl: initialData?.websiteUrl ?? "",
        isActive: initialData?.isActive ?? true,
        sortOrder: initialData?.sortOrder ?? 0,
      })
      setErrors({})
      setServerError("")
    }
  }, [open, initialData])

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

    const payload: CreateBrandInput = {
      name: form.name,
      slug: form.slug || undefined,
      logoUrl: form.logoUrl || undefined,
      description: form.description || undefined,
      websiteUrl: form.websiteUrl || undefined,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    }

    const url = isEditing ? `/api/brands/${initialData!.id}` : "/api/brands"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Markayı Düzenle" : "Yeni Marka Ekle"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="brand-name">
              Marka Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="brand-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Örn: Hikvision"
              aria-invalid={Boolean(errors.name)}
              required
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-slug">Slug</Label>
            <Input
              id="brand-slug"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="hikvision"
              aria-invalid={Boolean(errors.slug)}
            />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug[0]}</p>
            )}
            <p className="text-xs text-muted-foreground">İsimden otomatik üretilir.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-logo">Logo URL</Label>
            <Input
              id="brand-logo"
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
              placeholder="https://..."
              aria-invalid={Boolean(errors.logoUrl)}
            />
            {errors.logoUrl && (
              <p className="text-xs text-destructive">{errors.logoUrl[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-website">Website URL</Label>
            <Input
              id="brand-website"
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
              placeholder="https://..."
              aria-invalid={Boolean(errors.websiteUrl)}
            />
            {errors.websiteUrl && (
              <p className="text-xs text-destructive">{errors.websiteUrl[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-description">Açıklama</Label>
            <textarea
              id="brand-description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Marka hakkında kısa açıklama..."
              rows={3}
              className="h-auto w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="brand-active"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
            />
            <Label htmlFor="brand-active">Aktif</Label>
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
