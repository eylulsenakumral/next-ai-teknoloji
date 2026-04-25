"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Minus,
  Sparkles,
  Loader2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CampaignSetType = "OUTLET" | "FEATURED" | "BUNDLE"

interface CampaignSet {
  id: string
  name: string
  slug: string
  type: CampaignSetType
  discountPct: string | null
  price: string | null
  currency: string | null
  isActive: boolean
  sortOrder: number
  validFrom: string | null
  validUntil: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  _count: { products: number }
}

interface SetProduct {
  id: string
  quantity: number
  sortOrder: number
  label: string | null
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    isActive: boolean
    brand: { id: string; name: string } | null
    category: { id: string; name: string } | null
    supplierProducts: Array<{ purchasePrice: string | null; stockQuantity: number; currency: string }>
  }
}

interface CampaignSetDetail extends CampaignSet {
  description: string | null
  minPurchaseAmount: string | null
  maxUsageCount: number | null
  stockQuantity: number | null
  metadata: Record<string, unknown> | null
  products: SetProduct[]
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ProductSearchResult {
  id: string
  name: string
  barcode: string | null
  sku: string | null
  brand: { name: string } | null
  category: { name: string } | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TYPE_LABELS: Record<CampaignSetType, string> = {
  OUTLET: "Outlet",
  FEATURED: "Öne Çıkan",
  BUNDLE: "Set",
}

const TYPE_COLORS: Record<CampaignSetType, string> = {
  OUTLET: "bg-orange-100 text-orange-800",
  FEATURED: "bg-blue-100 text-blue-800",
  BUNDLE: "bg-purple-100 text-purple-800",
}

function formatPrice(val: string | null | undefined, currency: string = "TRY") {
  if (!val) return "—"
  const n = parseFloat(val)
  if (isNaN(n)) return "—"
  const locale = currency === "TRY" ? "tr-TR" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n)
}

function formatDate(val: string | null | undefined) {
  if (!val) return "—"
  return new Date(val).toLocaleDateString("tr-TR")
}

// ---------------------------------------------------------------------------
// Set Form Modal
// ---------------------------------------------------------------------------
interface SetFormModalProps {
  open: boolean
  initial?: CampaignSetDetail | null
  onClose: () => void
  onSaved: () => void
}

interface SelectedProduct {
  id: string
  name: string
  quantity: number
  brand: string | null
}

function SetFormModal({ open, initial, onClose, onSaved }: SetFormModalProps) {
  const isEdit = !!initial
  const [saving, setSaving] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    type: "BUNDLE" as CampaignSetType,
    discountPct: "",
    price: "",
    currency: "TRY",
    validFrom: "",
    validUntil: "",
    minPurchaseAmount: "",
    maxUsageCount: "",
    stockQuantity: "",
    isActive: true,
    sortOrder: "0",
  })

  // Ürün seçimi state
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [productQuery, setProductQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Ürün arama
  useEffect(() => {
    if (!productQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(productQuery)}&limit=10`
        )
        if (res.ok) {
          const json = await res.json()
          setSearchResults(json.data ?? [])
        }
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [productQuery])

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name,
          description: initial.description ?? "",
          imageUrl: initial.imageUrl ?? "",
          type: initial.type,
          discountPct: initial.discountPct ?? "",
          price: initial.price ?? "",
          currency: initial.currency ?? "TRY",
          validFrom: initial.validFrom ? initial.validFrom.slice(0, 16) : "",
          validUntil: initial.validUntil ? initial.validUntil.slice(0, 16) : "",
          minPurchaseAmount: initial.minPurchaseAmount ?? "",
          maxUsageCount: initial.maxUsageCount != null ? String(initial.maxUsageCount) : "",
          stockQuantity: initial.stockQuantity != null ? String(initial.stockQuantity) : "",
          isActive: initial.isActive,
          sortOrder: String(initial.sortOrder),
        })
        setSelectedProducts(
          initial.products.map((p) => ({
            id: p.product.id,
            name: p.product.name,
            quantity: p.quantity,
            brand: p.product.brand?.name ?? null,
          }))
        )
      } else {
        setForm({
          name: "",
          description: "",
          imageUrl: "",
          type: "BUNDLE",
          discountPct: "",
          price: "",
          currency: "TRY",
          validFrom: "",
          validUntil: "",
          minPurchaseAmount: "",
          maxUsageCount: "",
          stockQuantity: "",
          isActive: true,
          sortOrder: "0",
        })
        setSelectedProducts([])
      }
      setProductQuery("")
      setSearchResults([])
    }
  }, [open, initial])

  function addProduct(p: ProductSearchResult) {
    if (selectedProducts.some((sp) => sp.id === p.id)) return
    setSelectedProducts((prev) => [
      ...prev,
      { id: p.id, name: p.name, quantity: 1, brand: p.brand?.name ?? null },
    ])
  }

  function removeProduct(productId: string) {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p))
    )
  }

  async function handleSubmit() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        type: form.type,
        discountPct: form.discountPct ? parseFloat(form.discountPct) : null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency || "TRY",
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
        minPurchaseAmount: form.minPurchaseAmount
          ? parseFloat(form.minPurchaseAmount)
          : null,
        maxUsageCount: form.maxUsageCount ? parseInt(form.maxUsageCount) : null,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : null,
        isActive: form.isActive,
        sortOrder: parseInt(form.sortOrder) || 0,
      }

      const url = isEdit
        ? `/api/admin/campaign-sets/${initial!.id}`
        : "/api/admin/campaign-sets"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json()
        alert(json.error + (json.details ? `\n\n${json.details}` : ""))
        return
      }

      const json = await res.json()
      const setId = isEdit ? initial!.id : json.data.id

      // Ürünleri senkronize et
      if (isEdit && initial) {
        // Mevcut ürünleri çıkar
        const existingIds = new Set(initial.products.map((p) => p.product.id))
        const newIds = new Set(selectedProducts.map((p) => p.id))

        // Silinenler
        for (const old of initial.products) {
          if (!newIds.has(old.product.id)) {
            await fetch(`/api/admin/campaign-sets/${setId}/products`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: old.product.id }),
            })
          }
        }

        // Eklenenler
        for (const sp of selectedProducts) {
          if (!existingIds.has(sp.id)) {
            await fetch(`/api/admin/campaign-sets/${setId}/products`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: sp.id, quantity: sp.quantity }),
            })
          } else {
            // Miktar güncellensebileceğinden PATCH at
            await fetch(`/api/admin/campaign-sets/${setId}/products`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: sp.id, quantity: sp.quantity }),
            })
          }
        }
      } else {
        // Yeni set — tüm ürünleri ekle
        for (const sp of selectedProducts) {
          await fetch(`/api/admin/campaign-sets/${setId}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: sp.id, quantity: sp.quantity }),
          })
        }
      }

      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Kampanya Setini Düzenle" : "Yeni Kampanya Seti"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Set Adı *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Örn: Yaz Sezonu Seti"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Açıklama</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Kısa açıklama..."
            />
          </div>

          {/* Ürün Seçimi */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Set Ürünleri</Label>

            {/* Seçili ürünler listesi */}
            {selectedProducts.length > 0 && (
              <div className="space-y-1.5 border rounded-md p-2 bg-gray-50">
                {selectedProducts.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">
                      {sp.brand && <span className="text-muted-foreground mr-1">{sp.brand} ·</span>}
                      {sp.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(sp.id, sp.quantity - 1)}
                      >−</Button>
                      <Input
                        type="number"
                        min={1}
                        value={sp.quantity}
                        onChange={(e) => updateQuantity(sp.id, parseInt(e.target.value) || 1)}
                        className="h-6 w-14 text-center text-xs px-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(sp.id, sp.quantity + 1)}
                      >+</Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeProduct(sp.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Ürün arama */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Ürün ara (ad, barkod, SKU)..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
            </div>

            {searching && (
              <p className="text-xs text-muted-foreground text-center py-1">Aranıyor...</p>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md">
                {searchResults.map((p) => {
                  const alreadyAdded = selectedProducts.some((sp) => sp.id === p.id)
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm hover:bg-muted/40 cursor-pointer"
                      onClick={() => !alreadyAdded && addProduct(p)}
                    >
                      <div className="min-w-0">
                        <span className="truncate">{p.name}</span>
                        <span className="text-muted-foreground ml-1 text-xs">
                          {p.brand?.name ?? ""} {p.category?.name ? `· ${p.category.name}` : ""}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {alreadyAdded ? "Eklendi" : "+ Ekle"}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {!searching && productQuery.trim() && searchResults.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-1">Sonuç bulunamadı.</p>
            )}

            {selectedProducts.length === 0 && !productQuery.trim() && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Sete eklemek istediğiniz ürünleri arayarak seçin.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as CampaignSetType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUNDLE">Set</SelectItem>
                  <SelectItem value="OUTLET">Outlet</SelectItem>
                  <SelectItem value="FEATURED">Öne Çıkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Sıralama</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>İndirim Oranı (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.discountPct}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountPct: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Set Fiyatı</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  className="flex-1"
                />
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="TRY">TRY ₺</option>
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Geçerlilik Başlangıcı</Label>
              <Input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Geçerlilik Bitişi</Label>
              <Input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) =>
                  setForm((f) => ({ ...f, validUntil: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Min. Satın Alma (₺)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.minPurchaseAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minPurchaseAmount: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Maks. Kullanım</Label>
              <Input
                type="number"
                min={1}
                value={form.maxUsageCount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxUsageCount: e.target.value }))
                }
                placeholder="Sınırsız"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Stok Adedi</Label>
              <Input
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stockQuantity: e.target.value }))
                }
                placeholder="Sınırsız"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Görsel</Label>
            <div className="flex gap-2">
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://... veya dosya yükleyin"
                className="flex-1"
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="set-image-upload"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    const fd = new FormData()
                    fd.append("file", file)
                    const res = await fetch("/api/admin/upload?folder=misc", {
                      method: "POST",
                      body: fd,
                    })
                    const data = await res.json()
                    if (data.url) {
                      setForm((f) => ({ ...f, imageUrl: data.url }))
                    } else {
                      alert(data.error || "Dosya yüklenemedi.")
                    }
                  } catch {
                    alert("Dosya yükleme hatası.")
                  } finally {
                    setUploading(false)
                    e.target.value = ""
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById("set-image-upload")?.click()}
                className="shrink-0 gap-1.5"
              >
                {uploading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Yükleniyor...</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Dosya</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={generatingImage || !form.name.trim()}
                onClick={async () => {
                  setGeneratingImage(true)
                  try {
                    const products = selectedProducts.map((p) => ({
                      name: p.name,
                      quantity: p.quantity,
                    }))
                    const res = await fetch("/api/admin/campaign-sets/generate-image", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: form.name, products }),
                    })
                    const data = await res.json()
                    if (data.imageUrl) {
                      setForm((f) => ({ ...f, imageUrl: data.imageUrl }))
                    } else {
                      alert(data.error || "Görsel oluşturulamadı.")
                    }
                  } catch {
                    alert("Görsel oluşturma hatası.")
                  } finally {
                    setGeneratingImage(false)
                  }
                }}
                className="shrink-0 gap-1.5"
              >
                {generatingImage ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Oluşturuluyor...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> AI ile Oluştur</>
                )}
              </Button>
            </div>
            {form.imageUrl && (
              <div className="mt-1.5 w-full h-32 rounded-md border bg-muted/30 flex items-center justify-center overflow-hidden">
                <img src={form.imageUrl} alt="Önizleme" className="max-h-full max-w-full object-contain" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>
            {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------
interface ConfirmProps {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onClose,
  loading,
}: ConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Add Product Modal
// ---------------------------------------------------------------------------
interface AddProductModalProps {
  open: boolean
  setId: string
  existingProductIds: Set<string>
  onClose: () => void
  onAdded: () => void
}

function AddProductModal({
  open,
  setId,
  existingProductIds,
  onClose,
  onAdded,
}: AddProductModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&limit=10`
        )
        if (res.ok) {
          const json = await res.json()
          setResults(json.data ?? [])
        }
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function handleAdd(productId: string) {
    setAdding(productId)
    try {
      const res = await fetch(`/api/admin/campaign-sets/${setId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        onAdded()
        onClose()
      } else {
        const json = await res.json()
        alert(json.error ?? "Ürün eklenemedi.")
      }
    } finally {
      setAdding(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sete Ürün Ekle</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Ürün adı, barkod veya SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {searching && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aranıyor...
            </p>
          )}

          {!searching && results.length === 0 && query.trim() && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Sonuç bulunamadı.
            </p>
          )}

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.map((p) => {
              const alreadyAdded = existingProductIds.has(p.id)
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.brand?.name ?? "—"} · {p.category?.name ?? "—"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyAdded ? "outline" : "default"}
                    disabled={alreadyAdded || adding === p.id}
                    onClick={() => handleAdd(p.id)}
                  >
                    {alreadyAdded ? "Eklendi" : adding === p.id ? "..." : "Ekle"}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Set Detail Panel
// ---------------------------------------------------------------------------
interface SetDetailPanelProps {
  setId: string
  onClose: () => void
}

function SetDetailPanel({ setId, onClose }: SetDetailPanelProps) {
  const [detail, setDetail] = useState<CampaignSetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/campaign-sets/${setId}`)
      if (res.ok) {
        const json = await res.json()
        setDetail(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [setId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  async function handleRemoveProduct(productId: string) {
    setRemovingId(productId)
    try {
      const res = await fetch(`/api/admin/campaign-sets/${setId}/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        fetchDetail()
      } else {
        const json = await res.json()
        alert(json.error ?? "Ürün çıkarılamadı.")
      }
    } finally {
      setRemovingId(null)
    }
  }

  const existingProductIds = new Set(
    detail?.products.map((p) => p.product.id) ?? []
  )

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">
            {detail ? detail.name : "Yükleniyor..."}
          </span>
          {detail && (
            <Badge variant="outline" className={cn("text-xs", TYPE_COLORS[detail.type])}>
              {TYPE_LABELS[detail.type]}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setAddProductOpen(true)}
            disabled={!detail}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ürün Ekle
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Yükleniyor...
        </div>
      ) : !detail ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Set bulunamadı.
        </div>
      ) : detail.products.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Bu sette henüz ürün yok.
          <br />
          <Button
            variant="link"
            size="sm"
            onClick={() => setAddProductOpen(true)}
          >
            Ürün ekle
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Marka</TableHead>
              <TableHead className="text-center">Adet</TableHead>
              <TableHead>Alış Fiyatı</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.products.map((item) => {
              const sp = item.product.supplierProducts[0]
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product.name}
                      </p>
                      {item.label && (
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.product.brand?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-sm">
                    {formatPrice(sp?.purchasePrice, sp?.currency ?? "USD")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {sp?.stockQuantity != null ? sp.stockQuantity : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      disabled={removingId === item.product.id}
                      onClick={() => handleRemoveProduct(item.product.id)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {detail && (
        <AddProductModal
          open={addProductOpen}
          setId={setId}
          existingProductIds={existingProductIds}
          onClose={() => setAddProductOpen(false)}
          onAdded={fetchDetail}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function KampanyaSetleriPage() {
  const [sets, setSets] = useState<CampaignSet[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | CampaignSetType>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)

  // Form dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editSet, setEditSet] = useState<CampaignSetDetail | null>(null)

  // Delete
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CampaignSet | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Detail panel
  const [detailSetId, setDetailSetId] = useState<string | null>(null)

  const fetchSets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search ? { search } : {}),
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
      ...(statusFilter !== "all"
        ? { isActive: statusFilter === "active" ? "true" : "false" }
        : {}),
    })
    try {
      const res = await fetch(`/api/admin/campaign-sets?${params}`)
      if (res.ok) {
        const json = await res.json()
        setSets(json.data ?? [])
        setMeta(json.meta ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter, statusFilter])

  useEffect(() => {
    fetchSets()
  }, [fetchSets])

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, statusFilter])

  async function handleEdit(set: CampaignSet) {
    try {
      const res = await fetch(`/api/admin/campaign-sets/${set.id}`)
      if (res.ok) {
        const json = await res.json()
        setEditSet(json.data)
        setFormOpen(true)
      }
    } catch {
      alert("Set detayları yüklenemedi.")
    }
  }

  function handleDeleteRequest(set: CampaignSet) {
    setDeleteTarget(set)
    setConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/campaign-sets/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setConfirmOpen(false)
        setDeleteTarget(null)
        if (detailSetId === deleteTarget.id) setDetailSetId(null)
        fetchSets()
      } else {
        const json = await res.json()
        alert(json.error ?? "Silme başarısız.")
      }
    } finally {
      setDeleting(false)
    }
  }

  function handleFormSaved() {
    fetchSets()
    if (detailSetId) fetchSets()
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#0040a4]" />
          <h1 className="text-xl font-bold text-[#1a1a1a]">Kampanya Setleri</h1>
          {meta && (
            <Badge variant="outline" className="text-xs">
              {meta.total}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditSet(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Set
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Set ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v as "all" | CampaignSetType)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tür" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                <SelectItem value="BUNDLE">Set</SelectItem>
                <SelectItem value="OUTLET">Outlet</SelectItem>
                <SelectItem value="FEATURED">Öne Çıkan</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={fetchSets}
              title="Yenile"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Setler</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Set Adı</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>İndirim</TableHead>
                <TableHead>Set Fiyatı</TableHead>
                <TableHead>Geçerlilik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : sets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Kampanya seti bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                sets.map((s) => (
                  <TableRow
                    key={s.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/40",
                      detailSetId === s.id && "bg-muted/60"
                    )}
                    onClick={() =>
                      setDetailSetId((prev) => (prev === s.id ? null : s.id))
                    }
                  >
                    <TableCell>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", TYPE_COLORS[s.type])}
                      >
                        {TYPE_LABELS[s.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{s._count.products}</TableCell>
                    <TableCell className="text-sm">
                      {s.discountPct ? `%${parseFloat(s.discountPct)}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{formatPrice(s.price, s.currency ?? "TRY")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.validFrom || s.validUntil
                        ? `${formatDate(s.validFrom)} – ${formatDate(s.validUntil)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          s.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-50 text-gray-500"
                        )}
                      >
                        {s.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(s)}
                          title="Düzenle"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRequest(s)}
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail panel */}
      {detailSetId && (
        <SetDetailPanel
          key={detailSetId}
          setId={detailSetId}
          onClose={() => setDetailSetId(null)}
        />
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {meta.total} set · Sayfa {meta.page}/{meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <SetFormModal
        open={formOpen}
        initial={editSet}
        onClose={() => {
          setFormOpen(false)
          setEditSet(null)
        }}
        onSaved={handleFormSaved}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Kampanya Setini Sil"
        description={`"${deleteTarget?.name}" setini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setConfirmOpen(false)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
