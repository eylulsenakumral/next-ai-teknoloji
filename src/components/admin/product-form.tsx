"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Save, Copy, RotateCcw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { SpecsEditor } from "@/components/admin/specs-editor"
import { SpecsScraper } from "@/components/admin/specs-scraper"
import { ImageManager } from "@/components/admin/image-manager"
import { PriceDisplay, PriceHistoryDisplay } from "@/components/admin/price-display"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/format"
import type { CreateProductInput } from "@/lib/validators/product"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Brand {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  depth: number
  path: string | null
  parent: { id: string; name: string } | null
}

interface SupplierProductData {
  id: string
  supplier: { name: string; code: string }
  purchasePrice: string | null
  stockQuantity: number
  isAvailable: boolean
  currency: string
  priceHistory?: Array<{
    id: string
    oldPrice: string | null
    newPrice: string
    priceChangePct: string | null
    recordedAt: string
    currency: string
  }>
}

interface ProductFormData {
  // Tab 1
  name: string
  shortDescription: string
  description: string
  brandId: string
  categoryId: string
  barcode: string
  sku: string
  modelCode: string
  unit: string
  minOrderQuantity: number
  warrantyMonths: string
  // Tab 2
  images: string[]
  // Tab 3
  specs: Record<string, string> | null
  weight: string
  dimensions: { length: string; width: string; height: string; unit: string }
  // Tab 4 - Fiyatlandırma
  manualPrice: string
  manualPriceCurrency: "TRY" | "USD" | "EUR"
  campaignDiscountPct: string
  // Tab 5
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  isOutlet: boolean
  // Tab 6
  metadata: Record<string, string> | null
}

interface ProductFormProps {
  productId?: string
  initialData?: Partial<ProductFormData> & {
    supplierProducts?: SupplierProductData[]
  }
  brands: Brand[]
  categories: Category[]
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
type TabId = "genel" | "gorseller" | "ozellikler" | "fiyatlandirma" | "stok" | "metadata"

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "genel", label: "Genel Bilgiler" },
  { id: "gorseller", label: "Görseller" },
  { id: "ozellikler", label: "Teknik Özellikler" },
  { id: "fiyatlandirma", label: "Fiyatlandırma" },
  { id: "stok", label: "Stok & Durum" },
  { id: "metadata", label: "Metadata" },
]

const UNITS = ["ADET", "KUTU", "PAKET", "KOLI", "METRE", "KILOGRAM"]
const UNIT_LABELS: Record<string, string> = {
  ADET: "Adet",
  KUTU: "Kutu",
  PAKET: "Paket",
  KOLI: "Koli",
  METRE: "Metre",
  KILOGRAM: "Kilogram",
}

const defaultForm: ProductFormData = {
  name: "",
  shortDescription: "",
  description: "",
  brandId: "",
  categoryId: "",
  barcode: "",
  sku: "",
  modelCode: "",
  unit: "ADET",
  minOrderQuantity: 1,
  warrantyMonths: "",
  images: [],
  specs: null,
  weight: "",
  dimensions: { length: "", width: "", height: "", unit: "cm" },
  manualPrice: "",
  manualPriceCurrency: "TRY",
  campaignDiscountPct: "",
  isActive: true,
  isFeatured: false,
  isNew: false,
  isOutlet: false,
  metadata: null,
}

// ---------------------------------------------------------------------------
// Form Bileşeni
// ---------------------------------------------------------------------------
export function ProductForm({ productId, initialData, brands, categories }: ProductFormProps) {
  const router = useRouter()
  const isEditing = Boolean(productId)

  const [form, setForm] = useState<ProductFormData>({
    ...defaultForm,
    ...(initialData
      ? {
          name: initialData.name ?? "",
          shortDescription: initialData.shortDescription ?? "",
          description: initialData.description ?? "",
          brandId: initialData.brandId ?? "",
          categoryId: initialData.categoryId ?? "",
          barcode: initialData.barcode ?? "",
          sku: initialData.sku ?? "",
          modelCode: initialData.modelCode ?? "",
          unit: initialData.unit ?? "ADET",
          minOrderQuantity: initialData.minOrderQuantity ?? 1,
          warrantyMonths: initialData.warrantyMonths ? String(initialData.warrantyMonths) : "",
          images: initialData.images ?? [],
          specs: initialData.specs ?? null,
          weight: initialData.weight ? String(initialData.weight) : "",
          dimensions: initialData.dimensions ?? { length: "", width: "", height: "", unit: "cm" },
          manualPrice: initialData.manualPrice ? String(initialData.manualPrice) : "",
          manualPriceCurrency: (initialData.manualPriceCurrency as "TRY" | "USD" | "EUR") ?? "TRY",
          campaignDiscountPct: initialData.campaignDiscountPct ? String(initialData.campaignDiscountPct) : "",
          isActive: initialData.isActive ?? true,
          isFeatured: initialData.isFeatured ?? false,
          isNew: initialData.isNew ?? false,
          isOutlet: initialData.isOutlet ?? false,
          metadata: initialData.metadata ?? null,
        }
      : {}),
  })

  const [activeTab, setActiveTab] = useState<TabId>("genel")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [serverError, setServerError] = useState("")
  const [isDirty, setIsDirty] = useState(false)

  // Değişiklik takibi
  const update = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key as string]
        return next
      })
    }
  }, [errors])

  // Sayfa kapatma uyarısı
  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  async function buildPayload(): Promise<CreateProductInput> {
    return {
      name: form.name,
      shortDescription: form.shortDescription || null,
      description: form.description || null,
      brandId: form.brandId || null,
      categoryId: form.categoryId || null,
      barcode: form.barcode || null,
      sku: form.sku || null,
      modelCode: form.modelCode || null,
      unit: form.unit as CreateProductInput["unit"],
      minOrderQuantity: form.minOrderQuantity,
      warrantyMonths: form.warrantyMonths ? parseInt(form.warrantyMonths) : null,
      images: form.images,
      specs: form.specs || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      dimensions:
        form.dimensions.length || form.dimensions.width || form.dimensions.height
          ? {
              length: form.dimensions.length ? parseFloat(form.dimensions.length) : undefined,
              width: form.dimensions.width ? parseFloat(form.dimensions.width) : undefined,
              height: form.dimensions.height ? parseFloat(form.dimensions.height) : undefined,
              unit: form.dimensions.unit as "cm" | "mm" | "m",
            }
          : null,
      manualPrice: form.manualPrice ? parseFloat(form.manualPrice) : null,
      manualPriceCurrency: form.manualPriceCurrency || null,
      campaignDiscountPct: form.campaignDiscountPct ? parseFloat(form.campaignDiscountPct) : null,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isNew: form.isNew,
      isOutlet: form.isOutlet,
      metadata: form.metadata || null,
    }
  }

  async function handleSubmit(e: React.FormEvent, andNew = false) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setServerError("")

    try {
      const payload = await buildPayload()
      const url = isEditing ? `/api/products/${productId}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      // Response boş olabilir, önce text olarak al
      const text = await res.text()
      let json: Record<string, unknown> = {}

      if (text) {
        try {
          json = JSON.parse(text)
        } catch {
          setServerError(`Sunucu hatası: Geçersiz yanıt (${res.status})`)
          setLoading(false)
          return
        }
      }

      setLoading(false)

      if (!res.ok) {
        if (json.details) {
          setErrors(json.details as Record<string, string[]>)
          setActiveTab("genel")
        } else {
          setServerError((json.error as string) ?? `Sunucu hatası: ${res.status}`)
        }
        return
      }

      setIsDirty(false)

      if (andNew) {
        router.push("/admin/urunler/yeni")
        router.refresh()
      } else {
        router.push("/admin/urunler")
        router.refresh()
      }
    } catch (err) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata"
      setServerError(`İstek başarısız: ${msg}`)
      console.error("Submit error:", err)
    }
  }

  async function handleDuplicate() {
    if (!productId) return
    setLoading(true)
    const res = await fetch("/api/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [productId], action: "duplicate" }),
    })
    setLoading(false)
    if (res.ok) {
      router.push("/admin/urunler")
      router.refresh()
    }
  }

  const supplierProducts = initialData?.supplierProducts ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {isEditing ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
          </h1>
          {isEditing && form.name && (
            <p className="text-sm text-muted-foreground mt-0.5">{form.name}</p>
          )}
        </div>

        {isDirty && (
          <Badge variant="outline" className="shrink-0 text-amber-600 border-amber-300 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Kaydedilmemiş değişiklikler
          </Badge>
        )}
      </div>

      {/* Tab navigasyonu */}
      <div className="flex gap-0 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hata mesajı */}
      {serverError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {serverError}
        </p>
      )}

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        {/* ========== TAB 1: Genel Bilgiler ========== */}
        {activeTab === "genel" && (
          <div className="space-y-5">
            <FormField label="Ürün Adı" required error={errors.name?.[0]}>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Ör: Hikvision DS-2CD2143G2-I 4MP IP Kamera"
                aria-invalid={Boolean(errors.name)}
                disabled={loading}
              />
            </FormField>

            <FormField label="Kısa Açıklama" error={errors.shortDescription?.[0]}>
              <Input
                value={form.shortDescription}
                onChange={(e) => update("shortDescription", e.target.value)}
                placeholder="Ürünü kısaca özetleyin (max 1000 karakter)"
                maxLength={1000}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.shortDescription.length}/1000
              </p>
            </FormField>

            <FormField label="Detaylı Açıklama" error={errors.description?.[0]}>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Ürün hakkında detaylı bilgi..."
                rows={5}
                disabled={loading}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-y placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Marka" error={errors.brandId?.[0]}>
                <select
                  value={form.brandId}
                  onChange={(e) => update("brandId", e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  <option value="">— Seçiniz —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Kategori" error={errors.categoryId?.[0]}>
                <select
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  <option value="">— Seçiniz —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.depth > 0 ? `${"  ".repeat(c.depth)}↳ ` : ""}
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Barkod" error={errors.barcode?.[0]}>
                <Input
                  value={form.barcode}
                  onChange={(e) => update("barcode", e.target.value)}
                  placeholder="Ör: 8699866014234"
                  disabled={loading}
                />
              </FormField>

              <FormField label="SKU" error={errors.sku?.[0]}>
                <Input
                  value={form.sku}
                  onChange={(e) => update("sku", e.target.value)}
                  placeholder="Ör: HIK-DS-2CD2143"
                  disabled={loading}
                />
              </FormField>

              <FormField label="Model Kodu" error={errors.modelCode?.[0]}>
                <Input
                  value={form.modelCode}
                  onChange={(e) => update("modelCode", e.target.value)}
                  placeholder="Ör: DS-2CD2143G2-I"
                  disabled={loading}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Birim" error={errors.unit?.[0]}>
                <select
                  value={form.unit}
                  onChange={(e) => update("unit", e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Min. Sipariş Adedi" error={errors.minOrderQuantity?.[0]}>
                <Input
                  type="number"
                  min={1}
                  value={form.minOrderQuantity}
                  onChange={(e) => update("minOrderQuantity", parseInt(e.target.value) || 1)}
                  disabled={loading}
                />
              </FormField>

              <FormField label="Garanti Süresi (Ay)" error={errors.warrantyMonths?.[0]}>
                <Input
                  type="number"
                  min={0}
                  value={form.warrantyMonths}
                  onChange={(e) => update("warrantyMonths", e.target.value)}
                  placeholder="Ör: 24"
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ========== TAB 2: Görseller ========== */}
        {activeTab === "gorseller" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold mb-1">Ürün Görselleri</h2>
              <p className="text-xs text-muted-foreground">
                Görsel URL&apos;leri ekleyin. İlk görsel ana görsel olarak kullanılır. Sırayı değiştirmek için ok butonlarını kullanın.
              </p>
            </div>
            <ImageManager
              value={form.images}
              onChange={(images) => update("images", images)}
              disabled={loading}
            />
          </div>
        )}

        {/* ========== TAB 3: Teknik Özellikler ========== */}
        {activeTab === "ozellikler" && (
          <div className="space-y-5">
            {/* URL'den Özellik Çekme */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <h3 className="text-sm font-semibold mb-2 text-blue-800">
                URL'den Otomatik Çek
              </h3>
              <p className="text-xs text-blue-700 mb-3">
                Herhangi bir ürün sayfası URL'si girin. LLM teknik özellikleri otomatik çıkarır ve aşağıya ekler.
              </p>
              <SpecsScraper
                onSpecsExtracted={(newSpecs, newImages) => {
                  // Mevcut specs ile merge et (yeni değerler öncelikli)
                  const merged = { ...(form.specs || {}), ...newSpecs }
                  update("specs", merged)

                  // Görselleri de ekle (mevcut görsellere ek olarak)
                  if (newImages && newImages.length > 0) {
                    const mergedImages = [...new Set([...form.images, ...newImages])]
                    update("images", mergedImages)
                  }
                }}
                disabled={loading}
              />
            </div>

            <div className="border-t border-border pt-5">
              <h2 className="text-sm font-semibold mb-1">Teknik Özellikler</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Ürünün teknik özelliklerini anahtar-değer çifti olarak girin. Yukarıdaki URL çekme özelliğini kullanabilir veya manuel ekleyebilirsiniz.
              </p>
              <SpecsEditor
                value={form.specs}
                onChange={(specs) => update("specs", specs)}
                disabled={loading}
              />
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <h2 className="text-sm font-semibold">Fiziksel Özellikler</h2>

              <FormField label="Ağırlık (kg)" error={errors.weight?.[0]}>
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  value={form.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  placeholder="Ör: 0.450"
                  disabled={loading}
                  className="max-w-xs"
                />
              </FormField>

              <div className="space-y-1.5">
                <Label>Boyutlar</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.dimensions.length}
                    onChange={(e) =>
                      update("dimensions", { ...form.dimensions, length: e.target.value })
                    }
                    placeholder="Uzunluk"
                    disabled={loading}
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">×</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.dimensions.width}
                    onChange={(e) =>
                      update("dimensions", { ...form.dimensions, width: e.target.value })
                    }
                    placeholder="Genişlik"
                    disabled={loading}
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">×</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.dimensions.height}
                    onChange={(e) =>
                      update("dimensions", { ...form.dimensions, height: e.target.value })
                    }
                    placeholder="Yükseklik"
                    disabled={loading}
                    className="w-28"
                  />
                  <select
                    value={form.dimensions.unit}
                    onChange={(e) =>
                      update("dimensions", { ...form.dimensions, unit: e.target.value })
                    }
                    disabled={loading}
                    className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  >
                    <option value="cm">cm</option>
                    <option value="mm">mm</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB 4: Fiyatlandırma ========== */}
        {activeTab === "fiyatlandirma" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold mb-1">Fiyatlandırma</h2>
              <p className="text-xs text-muted-foreground">
                Manuel fiyat girebilir veya tedarikçi fiyatlarını kullanabilirsiniz.
              </p>
            </div>

            {/* Manuel Fiyat Girişi */}
            <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Manuel Satış Fiyatı
              </h3>
              <p className="text-xs text-muted-foreground">
                Tedarikçi fiyatı yoksa veya özel fiyat belirlemek isterseniz manuel fiyat girebilirsiniz.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Fiyat" error={errors.manualPrice?.[0]}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Örn: 1299.99"
                    value={form.manualPrice}
                    onChange={(e) => update("manualPrice", e.target.value)}
                    disabled={loading}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="Para Birimi">
                  <select
                    value={form.manualPriceCurrency}
                    onChange={(e) => update("manualPriceCurrency", e.target.value as "TRY" | "USD" | "EUR")}
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="TRY">₺ Türk Lirası (TRY)</option>
                    <option value="USD">$ ABD Doları (USD)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                  </select>
                </FormField>
              </div>

              {form.manualPrice && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Girilen fiyat:</span>
                  <span className="font-semibold text-foreground">
                    {form.manualPriceCurrency === "TRY" && "₺"}
                    {form.manualPriceCurrency === "USD" && "$"}
                    {form.manualPriceCurrency === "EUR" && "€"}
                    {parseFloat(form.manualPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Kampanya İndirim Oranı */}
            <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Kampanya İndirim Oranı
              </h3>
              <p className="text-xs text-muted-foreground">
                Bu ürün kampanyalı olarak işaretlendiğinde, satış fiyatına uygulanacak indirim yüzdesi. Boş bırakılırsa indirimsiz gösterilir.
              </p>

              <FormField label="İndirim Yüzdesi (%)" error={errors.campaignDiscountPct?.[0]}>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Örn: 15"
                  value={form.campaignDiscountPct}
                  onChange={(e) => update("campaignDiscountPct", e.target.value)}
                  disabled={loading}
                  className="font-mono max-w-[200px]"
                />
              </FormField>

              {form.campaignDiscountPct && form.manualPrice && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">İndirimli fiyat:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      parseFloat(form.manualPrice) * (1 - parseFloat(form.campaignDiscountPct) / 100),
                      form.manualPriceCurrency
                    )}
                  </span>
                  <span className="text-muted-foreground line-through">
                    {form.manualPriceCurrency === "TRY" && "₺"}
                    {form.manualPriceCurrency === "USD" && "$"}
                    {form.manualPriceCurrency === "EUR" && "€"}
                    {parseFloat(form.manualPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Tedarikçi Fiyatları */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Tedarikçi Fiyatları (Otomatik)
              </h3>
              <p className="text-xs text-muted-foreground">
                Tedarikçi fiyatları scraper tarafından otomatik güncellenir.
              </p>

              <PriceDisplay
                supplierProducts={supplierProducts}
                marginPct={20}
                vatRate={20}
              />
            </div>

            {supplierProducts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Fiyat Geçmişi</h3>
                {supplierProducts.map((sp) =>
                  sp.priceHistory && sp.priceHistory.length > 0 ? (
                    <div key={sp.id} className="rounded-lg border border-border p-4">
                      <PriceHistoryDisplay
                        history={sp.priceHistory}
                        supplierName={sp.supplier.name}
                      />
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== TAB 5: Stok & Durum ========== */}
        {activeTab === "stok" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold mb-4">Ürün Durumu</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aktif</Label>
                    <p className="text-xs text-muted-foreground">Ürün mağazada görünür olsun</p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => update("isActive", v)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Öne Çıkan</Label>
                    <p className="text-xs text-muted-foreground">Ana sayfada öne çıkarılsın</p>
                  </div>
                  <Switch
                    checked={form.isFeatured}
                    onCheckedChange={(v) => update("isFeatured", v)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Yeni Ürün</Label>
                    <p className="text-xs text-muted-foreground">&apos;Yeni&apos; etiketi göster</p>
                  </div>
                  <Switch
                    checked={form.isNew}
                    onCheckedChange={(v) => update("isNew", v)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Outlet</Label>
                    <p className="text-xs text-muted-foreground">Outlet ürünü olarak işaretle</p>
                  </div>
                  <Switch
                    checked={form.isOutlet}
                    onCheckedChange={(v) => update("isOutlet", v)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {supplierProducts.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold mb-3">Tedarikçi Stok Bilgisi</h2>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tedarikçi</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Stok</th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {supplierProducts.map((sp) => (
                        <tr key={sp.id}>
                          <td className="px-3 py-2">
                            <p className="font-medium">{sp.supplier.name}</p>
                            <p className="text-xs text-muted-foreground">{sp.supplier.code}</p>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {sp.stockQuantity.toLocaleString("tr-TR")}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant={sp.isAvailable && sp.stockQuantity > 0 ? "default" : "outline"}
                              className="text-xs"
                            >
                              {!sp.isAvailable ? "Pasif" : sp.stockQuantity === 0 ? "Stok Yok" : "Mevcut"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30">
                        <td className="px-3 py-2 font-medium text-sm" colSpan={1}>Toplam</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {supplierProducts
                            .reduce((sum, sp) => sum + sp.stockQuantity, 0)
                            .toLocaleString("tr-TR")}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== TAB 6: Metadata ========== */}
        {activeTab === "metadata" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold mb-1">Metadata</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Serbest form anahtar-değer verileri. Özel entegrasyonlar ve SEO için kullanılabilir.
              </p>
              <SpecsEditor
                value={form.metadata}
                onChange={(metadata) => update("metadata", metadata)}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* ========== Form Alt Bar ========== */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/urunler")}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4" />
              İptal
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDuplicate}
                disabled={loading}
              >
                <Copy className="h-4 w-4" />
                Kopyala
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || !form.name}
              >
                {loading ? "Kaydediliyor..." : "Kaydet & Yeni Ekle"}
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !form.name}
            >
              <Save className="h-4 w-4" />
              {loading ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FormField helper
// ---------------------------------------------------------------------------
function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
