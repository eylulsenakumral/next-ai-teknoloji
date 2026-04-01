"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Plus, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { MarginEditor } from "@/components/admin/margin-editor"
import { PriceSimulator } from "@/components/admin/price-simulator"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfitMargin {
  id: string
  scope: "GLOBAL" | "CATEGORY" | "BRAND" | "PRODUCT" | "CUSTOMER"
  scopeId: string | null
  marginPct: string
  minMarginPct: string | null
  maxMarginPct: string | null
  priority: number
  isActive: boolean
  validFrom: string | null
  validUntil: string | null
  notes: string | null
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Brand {
  id: string
  name: string
  slug: string
}

interface CampaignFormData {
  scope: "GLOBAL" | "CATEGORY" | "BRAND"
  scopeId: string
  marginPct: string
  validFrom: string
  validUntil: string
  notes: string
  priority: string
}

const defaultCampaignForm: CampaignFormData = {
  scope: "GLOBAL",
  scopeId: "",
  marginPct: "",
  validFrom: "",
  validUntil: "",
  notes: "",
  priority: "10",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMargin(m: ProfitMargin) {
  return `%${parseFloat(m.marginPct).toFixed(2)}`
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString("tr-TR")
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FiyatlandirmaPage() {
  const [margins, setMargins] = useState<ProfitMargin[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [campaignForm, setCampaignForm] = useState<CampaignFormData>(defaultCampaignForm)
  const [campaignSaving, setCampaignSaving] = useState(false)
  const [campaignError, setCampaignError] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<ProfitMargin | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const fetchMargins = useCallback(async () => {
    const res = await fetch("/api/pricing/margins")
    if (res.ok) {
      const json = await res.json()
      setMargins(json.data ?? [])
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories?limit=200&isActive=true")
    if (res.ok) {
      const json = await res.json()
      setCategories(json.data ?? [])
    }
  }, [])

  const fetchBrands = useCallback(async () => {
    const res = await fetch("/api/brands?limit=200&isActive=true")
    if (res.ok) {
      const json = await res.json()
      setBrands(json.data ?? [])
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchMargins(), fetchCategories(), fetchBrands()])
    setLoading(false)
  }, [fetchMargins, fetchCategories, fetchBrands])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const globalMargin = margins.find((m) => m.scope === "GLOBAL" && m.isActive)

  function getMarginForCategory(catId: string) {
    return margins
      .filter((m) => m.scope === "CATEGORY" && m.scopeId === catId && m.isActive && !m.validFrom && !m.validUntil)
      .sort((a, b) => b.priority - a.priority)[0] ?? null
  }

  function getMarginForBrand(brandId: string) {
    return margins
      .filter((m) => m.scope === "BRAND" && m.scopeId === brandId && m.isActive && !m.validFrom && !m.validUntil)
      .sort((a, b) => b.priority - a.priority)[0] ?? null
  }

  const productMargins = margins.filter((m) => m.scope === "PRODUCT")

  const campaignMargins = margins.filter(
    (m) => m.validFrom !== null || m.validUntil !== null
  )

  // ---------------------------------------------------------------------------
  // Campaign dialog
  // ---------------------------------------------------------------------------

  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault()
    setCampaignSaving(true)
    setCampaignError("")

    const parsed = parseFloat(campaignForm.marginPct)
    if (isNaN(parsed) || parsed < 0) {
      setCampaignError("Geçerli bir marj girin.")
      setCampaignSaving(false)
      return
    }

    const payload: Record<string, unknown> = {
      scope: campaignForm.scope,
      scopeId: campaignForm.scope === "GLOBAL" ? null : campaignForm.scopeId || null,
      marginPct: parsed,
      isActive: true,
      priority: parseInt(campaignForm.priority) || 10,
      notes: campaignForm.notes || null,
      validFrom: campaignForm.validFrom || null,
      validUntil: campaignForm.validUntil || null,
    }

    const res = await fetch("/api/pricing/margins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    setCampaignSaving(false)

    if (!res.ok) {
      setCampaignError(json.error ?? "Hata oluştu.")
      return
    }

    setCampaignDialogOpen(false)
    setCampaignForm(defaultCampaignForm)
    fetchMargins()
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await fetch(`/api/pricing/margins/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    setDeleteTarget(null)
    fetchMargins()
  }

  // ---------------------------------------------------------------------------
  // Toggle isActive
  // ---------------------------------------------------------------------------

  async function toggleActive(margin: ProfitMargin) {
    await fetch(`/api/pricing/margins/${margin.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !margin.isActive }),
    })
    fetchMargins()
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Fiyatlandırma</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kar marjları ve satış fiyatı yönetimi
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={loadAll} aria-label="Yenile">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* 1. Global Marj */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Global Marj</CardTitle>
          <CardDescription>
            Ürün, kategori veya marka bazında özel marj tanımlanmamışsa bu değer kullanılır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          ) : (
            <div className="flex items-center gap-4">
              <MarginEditor
                marginId={globalMargin?.id}
                scope="GLOBAL"
                currentMargin={globalMargin ? parseFloat(globalMargin.marginPct) : null}
                onSaved={fetchMargins}
                placeholder="30"
              />
              {globalMargin && (
                <div className="text-sm text-muted-foreground">
                  Min:{" "}
                  {globalMargin.minMarginPct
                    ? `%${parseFloat(globalMargin.minMarginPct).toFixed(2)}`
                    : "—"}{" "}
                  | Max:{" "}
                  {globalMargin.maxMarginPct
                    ? `%${parseFloat(globalMargin.maxMarginPct).toFixed(2)}`
                    : "—"}
                </div>
              )}
              {!globalMargin && (
                <p className="text-sm text-muted-foreground">
                  Kayıtlı global marj yok. Düzenleme ile oluşturabilirsiniz (varsayılan %30 kullanılır).
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Fiyat Simülatörü */}
      <PriceSimulator />

      {/* 3. Kategori Bazlı Marjlar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kategori Bazlı Marjlar</CardTitle>
          <CardDescription>
            Kategoriye özel marjlar global marjı geçersiz kılar.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Kategori</TableHead>
                <TableHead>Marj</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!loading && categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    Kategori bulunamadı.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                categories.map((cat) => {
                  const m = getMarginForCategory(cat.id)
                  return (
                    <TableRow key={cat.id}>
                      <TableCell className="pl-4 font-medium text-sm">{cat.name}</TableCell>
                      <TableCell>
                        <MarginEditor
                          marginId={m?.id}
                          scope="CATEGORY"
                          scopeId={cat.id}
                          currentMargin={m ? parseFloat(m.marginPct) : null}
                          onSaved={fetchMargins}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4. Marka Bazlı Marjlar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Marka Bazlı Marjlar</CardTitle>
          <CardDescription>
            Marka bazlı marjlar kategori marjından önce uygulanır.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Marka</TableHead>
                <TableHead>Marj</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              )}
              {!loading && brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    Marka bulunamadı.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                brands.map((brand) => {
                  const m = getMarginForBrand(brand.id)
                  return (
                    <TableRow key={brand.id}>
                      <TableCell className="pl-4 font-medium text-sm">{brand.name}</TableCell>
                      <TableCell>
                        <MarginEditor
                          marginId={m?.id}
                          scope="BRAND"
                          scopeId={brand.id}
                          currentMargin={m ? parseFloat(m.marginPct) : null}
                          onSaved={fetchMargins}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 5. Ürün Bazlı Override'lar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ürün Bazlı Override'lar</CardTitle>
          <CardDescription>
            Belirli ürünlere özel marj tanımlamaları. En yüksek önceliğe sahiptir.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {productMargins.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-6">
              Henüz ürün bazlı override yok.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Ürün ID</TableHead>
                  <TableHead>Marj</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-4">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productMargins.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4 text-xs font-mono text-muted-foreground">
                      {m.scopeId}
                    </TableCell>
                    <TableCell>
                      <MarginEditor
                        marginId={m.id}
                        scope="PRODUCT"
                        scopeId={m.scopeId ?? undefined}
                        currentMargin={parseFloat(m.marginPct)}
                        onSaved={fetchMargins}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={m.isActive}
                        onCheckedChange={() => toggleActive(m)}
                        aria-label="Aktif/Pasif"
                      />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(m)}
                        className="text-destructive hover:text-destructive"
                        aria-label="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 6. Kampanya Marjları */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Kampanya Marjları</CardTitle>
              <CardDescription className="mt-0.5">
                Tarih bazlı geçici marj override&apos;ları. Yüksek priority sayısı önce uygulanır.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setCampaignForm(defaultCampaignForm)
                setCampaignError("")
                setCampaignDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Yeni Kampanya
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {campaignMargins.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-6">
              Henüz kampanya marjı yok.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Kapsam</TableHead>
                  <TableHead>Marj</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Tarih Aralığı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-4">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignMargins.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {m.scope}
                        </Badge>
                        {m.notes && (
                          <span className="text-xs text-muted-foreground truncate max-w-28">
                            {m.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium tabular-nums">{formatMargin(m)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">{m.priority}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(m.validFrom) ?? "—"}
                        {" → "}
                        {formatDate(m.validUntil) ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={m.isActive}
                        onCheckedChange={() => toggleActive(m)}
                        aria-label="Aktif/Pasif"
                      />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(m)}
                        className="text-destructive hover:text-destructive"
                        aria-label="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Campaign Dialog */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kampanya Marjı</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCampaign} className="space-y-4">
            {campaignError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {campaignError}
              </p>
            )}

            <div className="space-y-1.5">
              <Label>Kapsam</Label>
              <div className="flex rounded-lg border border-input overflow-hidden text-sm">
                {(["GLOBAL", "CATEGORY", "BRAND"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setCampaignForm((p) => ({ ...p, scope: s, scopeId: "" }))
                    }
                    className={`flex-1 px-3 py-1.5 font-medium transition-colors ${
                      campaignForm.scope === s
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {s === "GLOBAL" ? "Global" : s === "CATEGORY" ? "Kategori" : "Marka"}
                  </button>
                ))}
              </div>
            </div>

            {campaignForm.scope === "CATEGORY" && (
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <select
                  value={campaignForm.scopeId}
                  onChange={(e) =>
                    setCampaignForm((p) => ({ ...p, scopeId: e.target.value }))
                  }
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
                  required
                >
                  <option value="">Kategori seçin...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {campaignForm.scope === "BRAND" && (
              <div className="space-y-1.5">
                <Label>Marka</Label>
                <select
                  value={campaignForm.scopeId}
                  onChange={(e) =>
                    setCampaignForm((p) => ({ ...p, scopeId: e.target.value }))
                  }
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
                  required
                >
                  <option value="">Marka seçin...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="camp-margin">
                  Marj (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="camp-margin"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={campaignForm.marginPct}
                  onChange={(e) =>
                    setCampaignForm((p) => ({ ...p, marginPct: e.target.value }))
                  }
                  placeholder="25"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-priority">Öncelik</Label>
                <Input
                  id="camp-priority"
                  type="number"
                  min="0"
                  step="1"
                  value={campaignForm.priority}
                  onChange={(e) =>
                    setCampaignForm((p) => ({ ...p, priority: e.target.value }))
                  }
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="camp-from">Başlangıç Tarihi</Label>
                <Input
                  id="camp-from"
                  type="datetime-local"
                  value={campaignForm.validFrom}
                  onChange={(e) =>
                    setCampaignForm((p) => ({ ...p, validFrom: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-until">Bitiş Tarihi</Label>
                <Input
                  id="camp-until"
                  type="datetime-local"
                  value={campaignForm.validUntil}
                  onChange={(e) =>
                    setCampaignForm((p) => ({ ...p, validUntil: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="camp-notes">Not (opsiyonel)</Label>
              <Input
                id="camp-notes"
                value={campaignForm.notes}
                onChange={(e) =>
                  setCampaignForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Örn: Yılbaşı kampanyası"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCampaignDialogOpen(false)}
                disabled={campaignSaving}
              >
                İptal
              </Button>
              <Button type="submit" disabled={campaignSaving}>
                {campaignSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Marj ayarı silinsin mi?"
        description="Bu marj ayarı kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Sil"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  )
}
