"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Pencil, Trash2, RefreshCw, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

// ----------------------------------------------------------------------------
// Sayfa bazlı config
// ----------------------------------------------------------------------------
export interface SectionConfig {
  /** API type parametresi */
  type: string
  /** Tab/section başlığı */
  label: string
  /** Tablo kolonları */
  columns: { key: string; label: string }[]
  /** Form alanları */
  fields: { key: string; label: string; type: "text" | "textarea" | "select" | "list" | "image" }[]
  /** Filtre — sadece bu sayfaya ait veriler */
  filter?: { key: string; value: string }
}

export interface PageConfig {
  title: string
  description: string
  sections: SectionConfig[]
}

// ----------------------------------------------------------------------------
// Ana component — sayfa config'i alır, tüm section'ları yönetir
// ----------------------------------------------------------------------------
interface ContentItem {
  id: string
  [key: string]: unknown
  isActive: boolean
  sortOrder: number
}

export function PageContentManager({ config }: { config: PageConfig }) {
  const [activeSection, setActiveSection] = useState(0)
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<ContentItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const section = config.sections[activeSection]

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: section.type })
      if (section.filter) {
        params.set(section.filter.key, section.filter.value)
      }
      const res = await fetch(`/api/admin/icerik?${params}`)
      const json = await res.json()
      if (res.ok) {
        let data: ContentItem[] = json.data ?? []
        if (section.filter) {
          const fk = section.filter.key
          const fv = section.filter.value
          data = data.filter((d) => String(d[fk]) === fv)
        }
        setItems(data)
      } else {
        setItems([])
      }
    } catch {
      setItems([])
    }
    setLoading(false)
  }, [section])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleSave = async (data: Record<string, unknown>) => {
    // Filter değerini otomatik ekle
    if (section.filter) {
      data[section.filter.key] = section.filter.value
    }

    try {
      const isEdit = !!editItem
      const url = isEdit
        ? `/api/admin/icerik/${editItem!.id}?type=${section.type}`
        : `/api/admin/icerik?type=${section.type}`
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
    if (!confirm("Silinsin mi?")) return
    try {
      await fetch(`/api/admin/icerik/${id}?type=${section.type}`, { method: "DELETE" })
      toast.success("Silindi.")
      fetchItems()
    } catch {
      toast.error("Silme başarısız.")
    }
  }

  const handleToggleActive = async (item: ContentItem) => {
    await fetch(`/api/admin/icerik/${item.id}?type=${section.type}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    })
    fetchItems()
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {config.sections.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setActiveSection(i)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              i === activeSection
                ? "bg-[#155bfe] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} kayıt</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw className="mr-2 h-4 w-4" /> Yenile
          </Button>
          <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Ekle
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">Henüz kayıt yok.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {section.columns.map((c) => (
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
                  {section.columns.map((c) => (
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
                      onClick={() => handleToggleActive(item)}
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
                      <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setDialogOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ContentDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditItem(null) }}
        section={section}
        item={editItem}
        onSave={handleSave}
      />
    </div>
  )
}

// ----------------------------------------------------------------------------
// Dialog
// ----------------------------------------------------------------------------
function ContentDialog({
  open, onOpenChange, section, item, onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  section: SectionConfig
  item: ContentItem | null
  onSave: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      const data: Record<string, string> = {}
      for (const f of section.fields) {
        const val = item[f.key]
        data[f.key] = f.type === "list"
          ? (Array.isArray(val) ? (val as string[]).join(", ") : String(val ?? ""))
          : String(val ?? "")
      }
      setForm(data)
    } else {
      setForm({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: Record<string, unknown> = { ...form }
    for (const f of section.fields) {
      if (f.type === "list") {
        data[f.key] = (form[f.key] ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      }
    }
    if ("sortOrder" in form) data.sortOrder = Number(form.sortOrder ?? 0)
    if ("rating" in form) data.rating = Number(form.rating ?? 5)
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Düzenle" : "Yeni Ekle"} — {section.label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {section.fields.map((f) => (
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
              ) : f.type === "select" && f.key === "page" ? (
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form[f.key] ?? "HOMEPAGE"}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                >
                  <option value="HOMEPAGE">Anasayfa</option>
                  <option value="COZUMLER">Çözümler</option>
                  <option value="HAKKIMDA">Hakkımızda</option>
                  <option value="BAYI_PROGRAMI">Bayi Programı</option>
                  <option value="KURUMSAL">Kurumsal</option>
                </select>
              ) : f.type === "image" ? (
                <ImageUpload
                  value={form[f.key] ?? ""}
                  onChange={(url) => setForm((p) => ({ ...p, [f.key]: url }))}
                />
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
              <Input type="number" value={form.sortOrder ?? "0"} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Switch id="isActive" checked={form.isActive !== "false"} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: String(v) }))} />
              <label htmlFor="isActive" className="text-sm">Aktif</label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit">{item ? "Güncelle" : "Oluştur"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ----------------------------------------------------------------------------
// Image Upload Component
// ----------------------------------------------------------------------------
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload?folder=brands", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (res.ok && json.url) {
        onChange(json.url)
        toast.success("Görsel yüklendi.")
      } else {
        toast.error(json.error || "Yükleme başarısız.")
      }
    } catch {
      toast.error("Yükleme hatası.")
    }
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
          e.target.value = ""
        }}
      />

      {value ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="logo" className="h-full w-full object-contain p-1" />
        </div>
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed bg-slate-50 text-slate-300">
          <Upload className="h-5 w-5" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Yükleniyor..." : value ? "Değiştir" : "Görsel Yükle"}
        </Button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 text-xs text-destructive hover:underline"
          >
            <X className="h-3 w-3" /> Kaldır
          </button>
        )}
        {value && <p className="max-w-xs truncate text-xs text-muted-foreground">{value}</p>}
      </div>
    </div>
  )
}