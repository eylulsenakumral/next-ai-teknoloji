"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, RefreshCw, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

// ----------------------------------------------------------------------------
// Tipler
// ----------------------------------------------------------------------------
type ContentType = "solutions" | "sectors" | "references" | "faqs" | "milestones" | "testimonials" | "blog"

interface ContentItem {
  id: string
  [key: string]: unknown
  isActive: boolean
  sortOrder: number
  createdAt: string
}

const TABS: { value: ContentType; label: string }[] = [
  { value: "solutions", label: "Çözümler" },
  { value: "sectors", label: "Sektörler" },
  { value: "references", label: "Referanslar" },
  { value: "faqs", label: "SSS" },
  { value: "blog", label: "Blog" },
  { value: "milestones", label: "Tarihçe" },
  { value: "testimonials", label: "Yorumlar" },
]

// Alan tanımları — her tip için form alanları
const FIELD_DEFS: Record<ContentType, { key: string; label: string; type: "text" | "textarea" | "list" | "select" }[]> = {
  solutions: [
    { key: "number", label: "Numara", type: "text" },
    { key: "title", label: "Başlık", type: "text" },
    { key: "tagline", label: "Alt Başlık", type: "text" },
    { key: "icon", label: "İkon (IcnCamera, IcnNetwork...)", type: "text" },
    { key: "gradient", label: "Gradient (tailwind)", type: "text" },
    { key: "category", label: "Kategori", type: "select" },
    { key: "description", label: "Açıklama", type: "textarea" },
    { key: "brands", label: "Markalar (virgülle)", type: "list" },
    { key: "features", label: "Özellikler (satır başına)", type: "list" },
  ],
  sectors: [
    { key: "title", label: "Başlık", type: "text" },
    { key: "icon", label: "İkon", type: "text" },
    { key: "description", label: "Açıklama", type: "textarea" },
  ],
  references: [
    { key: "title", label: "Başlık", type: "text" },
    { key: "icon", label: "İkon", type: "text" },
    { key: "tags", label: "Etiketler (virgülle)", type: "list" },
    { key: "description", label: "Açıklama", type: "textarea" },
  ],
  faqs: [
    { key: "question", label: "Soru", type: "text" },
    { key: "answer", label: "Cevap", type: "textarea" },
    { key: "group", label: "Sayfa", type: "select" },
  ],
  blog: [
    { key: "title", label: "Başlık", type: "text" },
    { key: "slug", label: "URL (slug)", type: "text" },
    { key: "excerpt", label: "Özet", type: "textarea" },
    { key: "content", label: "İçerik (Markdown)", type: "textarea" },
    { key: "imageUrl", label: "Görsel URL", type: "text" },
    { key: "readTime", label: "Okuma Süresi", type: "text" },
  ],
  milestones: [
    { key: "year", label: "Yıl", type: "text" },
    { key: "title", label: "Başlık", type: "text" },
    { key: "description", label: "Açıklama", type: "textarea" },
  ],
  testimonials: [
    { key: "authorName", label: "Ad Soyad", type: "text" },
    { key: "authorTitle", label: "Ünvan / Şehir", type: "text" },
    { key: "authorInitials", label: "Baş harfler (MK)", type: "text" },
    { key: "quote", label: "Yorum", type: "textarea" },
    { key: "rating", label: "Puan (1-5)", type: "text" },
  ],
}

// Tablo kolonları — her tip için listelemede gösterilecek alanlar
const TABLE_COLS: Record<ContentType, { key: string; label: string }[]> = {
  solutions: [
    { key: "number", label: "#" },
    { key: "title", label: "Başlık" },
    { key: "category", label: "Kategori" },
  ],
  sectors: [{ key: "title", label: "Başlık" }],
  references: [{ key: "title", label: "Başlık" }],
  faqs: [
    { key: "question", label: "Soru" },
    { key: "group", label: "Sayfa" },
  ],
  blog: [
    { key: "title", label: "Başlık" },
    { key: "readTime", label: "Süre" },
  ],
  milestones: [
    { key: "year", label: "Yıl" },
    { key: "title", label: "Başlık" },
  ],
  testimonials: [
    { key: "authorName", label: "Ad" },
    { key: "rating", label: "Puan" },
  ],
}

// ----------------------------------------------------------------------------
// Ana component
// ----------------------------------------------------------------------------
export default function IcerikPage() {
  const [activeTab, setActiveTab] = useState<ContentType>("solutions")
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<ContentItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/icerik?type=${activeTab}`)
      const json = await res.json()
      if (res.ok) {
        setItems(json.data ?? [])
      } else {
        setItems([])
        toast.error(json.error || "İçerik yüklenemedi.")
      }
    } catch {
      setItems([])
      toast.error("Sunucuya ulaşılamadı.")
    }
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      const isEdit = !!editItem
      const url = isEdit
        ? `/api/admin/icerik/${editItem!.id}?type=${activeTab}`
        : `/api/admin/icerik?type=${activeTab}`
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error()
      toast.success(isEdit ? "Güncellendi." : "Oluşturuldu.")
      setDialogOpen(false)
      setEditItem(null)
      fetchItems()
    } catch {
      toast.error("Kayıt başarısız.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return
    try {
      const res = await fetch(`/api/admin/icerik/${id}?type=${activeTab}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Silindi.")
      fetchItems()
    } catch {
      toast.error("Silme başarısız.")
    }
  }

  const handleToggleActive = async (item: ContentItem) => {
    try {
      const res = await fetch(`/api/admin/icerik/${item.id}?type=${activeTab}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (!res.ok) throw new Error()
      fetchItems()
    } catch {
      toast.error("Durum güncellenemedi.")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İçerik Yönetimi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Çözümler, sektörler, referanslar, SSS ve diğer site içeriklerini yönetin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditItem(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ekle
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <ContentTable
              type={t.value}
              items={items}
              loading={loading}
              onEdit={(item) => {
                setEditItem(item)
                setDialogOpen(true)
              }}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          </TabsContent>
        ))}
      </Tabs>

      <ContentDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v)
          if (!v) setEditItem(null)
        }}
        type={activeTab}
        item={editItem}
        onSave={handleSave}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Tablo
// ----------------------------------------------------------------------------
function ContentTable({
  type,
  items,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  type: ContentType
  items: ContentItem[]
  loading: boolean
  onEdit: (item: ContentItem) => void
  onDelete: (id: string) => void
  onToggleActive: (item: ContentItem) => void
}) {
  const cols = TABLE_COLS[type]

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Yükleniyor...</div>
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">Henüz kayıt yok. "Yeni Ekle" ile başlayın.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            {cols.map((c) => (
              <TableHead key={c.key}>{c.label}</TableHead>
            ))}
            <TableHead className="w-20">Sıra</TableHead>
            <TableHead className="w-24">Durum</TableHead>
            <TableHead className="w-24">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </TableCell>
              {cols.map((c) => (
                <TableCell key={c.key} className="max-w-xs truncate text-sm">
                  {c.key === "group" ? (
                    <Badge variant={item[c.key] === "COZUMLER" ? "secondary" : "outline"}>
                      {item[c.key] === "COZUMLER" ? "Çözümler" : "Anasayfa"}
                    </Badge>
                  ) : c.key === "category" ? (
                    <Badge variant={item[c.key] === "ANALYTICS" ? "secondary" : "outline"}>
                      {item[c.key] === "ANALYTICS" ? "Analitik" : "Ana"}
                    </Badge>
                  ) : String(item[c.key] ?? "—")}
                </TableCell>
              ))}
              <TableCell className="text-sm text-muted-foreground">{item.sortOrder}</TableCell>
              <TableCell>
                <button
                  onClick={() => onToggleActive(item)}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition ${
                    item.isActive
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {item.isActive ? "Aktif" : "Pasif"}
                </button>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Dialog (Ekle/Düzenle)
// ----------------------------------------------------------------------------
function ContentDialog({
  open,
  onOpenChange,
  type,
  item,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  type: ContentType
  item: ContentItem | null
  onSave: (data: Record<string, unknown>) => void
}) {
  const fields = FIELD_DEFS[type]
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      const data: Record<string, string> = {}
      for (const f of fields) {
        const val = item[f.key]
        if (f.type === "list") {
          data[f.key] = Array.isArray(val) ? (val as string[]).join(", ") : String(val ?? "")
        } else {
          data[f.key] = String(val ?? "")
        }
      }
      setForm(data)
    } else {
      setForm({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, type, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: Record<string, unknown> = { ...form }

    // List alanlarını array'e çevir
    for (const f of fields) {
      if (f.type === "list") {
        data[f.key] = (form[f.key] ?? "")
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      }
    }

    // number alanları
    if ("sortOrder" in form) data.sortOrder = Number(form.sortOrder ?? 0)
    if ("rating" in form) data.rating = Number(form.rating ?? 5)

    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Düzenle" : "Yeni Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium">{f.label}</label>
              {f.type === "textarea" ? (
                <Textarea
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  rows={f.key === "content" ? 12 : 4}
                  className={f.key === "content" ? "font-mono text-sm" : ""}
                />
              ) : f.type === "select" && f.key === "category" ? (
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form[f.key] ?? "MAIN"}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                >
                  <option value="MAIN">Ana Çözüm</option>
                  <option value="ANALYTICS">Analitik Çözüm</option>
                </select>
              ) : f.type === "select" && f.key === "group" ? (
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form[f.key] ?? "GENERAL"}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                >
                  <option value="GENERAL">Anasayfa</option>
                  <option value="COZUMLER">Çözümler</option>
                </select>
              ) : (
                <Input
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sıra</label>
              <Input
                type="number"
                value={form.sortOrder ?? "0"}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Switch
                id="isActive"
                checked={form.isActive !== "false"}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: String(v) }))}
              />
              <label htmlFor="isActive" className="text-sm">Aktif</label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">{item ? "Güncelle" : "Oluştur"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
