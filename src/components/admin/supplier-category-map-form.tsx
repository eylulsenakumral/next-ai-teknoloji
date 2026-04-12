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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ---------- Types ----------
interface Supplier {
  id: string
  code: string
  name: string
}

interface Category {
  id: string
  name: string
  path: string | null
  depth: number
}

interface FormData {
  supplierCode: string
  supplierCatName: string
  categoryId: string
}

interface SupplierCategoryMapFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When provided the dialog is in edit mode */
  initialData?: {
    id: string
    supplierCode: string
    supplierCatName: string
    categoryId: string | null
  }
  onSuccess: () => void
}

const defaultForm: FormData = {
  supplierCode: "",
  supplierCatName: "",
  categoryId: "",
}

// Build a human-readable label like "Elektronik > Bilgisayar > Notebook"
function buildCategoryLabel(cat: Category): string {
  if (cat.path) {
    // path is like "Ana/Alt/Derin" — replace separators
    return cat.path.replace(/\//g, " > ")
  }
  return cat.name
}

export function SupplierCategoryMapForm({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: SupplierCategoryMapFormProps) {
  const [form, setForm] = useState<FormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const isEditing = Boolean(initialData?.id)

  // Remote data
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        supplierCode: initialData?.supplierCode ?? "",
        supplierCatName: initialData?.supplierCatName ?? "",
        categoryId: initialData?.categoryId ?? "",
      })
      setServerError("")
    }
  }, [open, initialData])

  // Load suppliers once when dialog opens
  useEffect(() => {
    if (!open) return
    setSuppliersLoading(true)
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((json) => {
        setSuppliers(json.data ?? [])
      })
      .catch(() => setSuppliers([]))
      .finally(() => setSuppliersLoading(false))
  }, [open])

  // Load categories once when dialog opens
  useEffect(() => {
    if (!open) return
    setCategoriesLoading(true)
    fetch("/api/categories?flat=true&limit=500")
      .then((r) => r.json())
      .then((json) => {
        setCategories(json.data ?? [])
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false))
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.supplierCode) {
      setServerError("Tedarikçi seçimi zorunludur.")
      return
    }
    if (!form.supplierCatName.trim()) {
      setServerError("Tedarikçi kategori adı zorunludur.")
      return
    }

    setLoading(true)
    setServerError("")

    const payload = {
      supplierCode: form.supplierCode,
      supplierCatName: form.supplierCatName.trim(),
      categoryId: form.categoryId || null,
    }

    let res: Response
    if (isEditing) {
      res = await fetch(`/api/supplier-category-maps/${initialData!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: payload.categoryId }),
      })
    } else {
      res = await fetch("/api/supplier-category-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setServerError(json.error ?? "Bir hata oluştu.")
      return
    }

    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Eşleşmeyi Düzenle" : "Yeni Kategori Eşleşmesi"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Tedarikçi */}
          <div className="space-y-1.5">
            <Label htmlFor="scm-supplier">
              Tedarikçi <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.supplierCode}
              onValueChange={(val) =>
                setForm((prev) => ({ ...prev, supplierCode: val ?? "" }))
              }
              disabled={isEditing || suppliersLoading}
            >
              <SelectTrigger id="scm-supplier" className="w-full">
                <SelectValue
                  placeholder={
                    suppliersLoading ? "Yükleniyor..." : "Tedarikçi seçin"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Tedarikçi düzenleme modunda değiştirilemez.
              </p>
            )}
          </div>

          {/* Tedarikçi Kategori Adı */}
          <div className="space-y-1.5">
            <Label htmlFor="scm-supplier-cat">
              Tedarikçi Kategori Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="scm-supplier-cat"
              value={form.supplierCatName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, supplierCatName: e.target.value }))
              }
              placeholder="Örn: Güvenlik Kameraları"
              disabled={isEditing}
              required
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Tedarikçi kategori adı düzenleme modunda değiştirilemez.
              </p>
            )}
          </div>

          {/* Sistem Kategorisi */}
          <div className="space-y-1.5">
            <Label htmlFor="scm-category">Sistem Kategorisi</Label>
            <Select
              value={form.categoryId}
              onValueChange={(val) =>
                setForm((prev) => ({ ...prev, categoryId: val ?? "" }))
              }
              disabled={categoriesLoading}
            >
              <SelectTrigger id="scm-category" className="w-full">
                <SelectValue
                  placeholder={
                    categoriesLoading ? "Yükleniyor..." : "Kategori seçin (opsiyonel)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Eşleşme yok --</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {buildCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Seçilen kategori bu tedarikçi kategorisindeki ürünlere uygulanır.
            </p>
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
              {loading ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Eşleştir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
