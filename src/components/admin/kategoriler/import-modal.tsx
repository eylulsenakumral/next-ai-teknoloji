"use client"

import { useState, useEffect } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toaster"

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{
    total: number
    newCount: number
    updateCount: number
    preview: Array<{ name: string; depth: number; slug: string; action: "new" | "update" }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setPreview(null)
      setLoading(false)
      setImporting(false)
    }
  }, [open])

  async function handleFileSelect(f: File | null) {
    setFile(f)
    setPreview(null)
    if (!f) return

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", f)
      const res = await fetch("/api/categories/import", { method: "PUT", body: fd })
      if (res.ok) {
        const json = await res.json()
        setPreview(json.data)
      } else {
        const json = await res.json()
        toast({ title: "Hata", description: json.error ?? "Onizleme basarisiz", variant: "destructive" })
      }
    } catch {
      toast({ title: "Hata", description: "Dosya okunamadi", variant: "destructive" })
    }
    setLoading(false)
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/categories/import", { method: "POST", body: fd })
      if (res.ok) {
        const json = await res.json()
        const data = json.data
        toast({
          title: "Import tamamlandi",
          description: `${data.created} olusturuldu, ${data.updated} guncellendi${data.errors.length > 0 ? `, ${data.errors.length} hata` : ""}`,
          variant: data.errors.length > 0 ? "destructive" : "default",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        const json = await res.json()
        toast({ title: "Hata", description: json.error ?? "Import basarisiz", variant: "destructive" })
      }
    } catch {
      toast({ title: "Hata", description: "Import sirasinda hata olustu", variant: "destructive" })
    }
    setImporting(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-popover rounded-xl ring-1 ring-foreground/10 p-5 w-full max-w-lg mx-4">
        <h2 className="font-heading text-base font-medium mb-4">Kategorileri Ice Aktar (TSV)</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="tsv-file"
              className="flex items-center justify-center w-full h-28 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {file ? file.name : "TSV dosyasi secin veya surukleyin"}
                </p>
              </div>
              <input
                id="tsv-file"
                type="file"
                accept=".tsv,.txt"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground text-center">Onizleme yukleniyor...</p>
          )}

          {preview && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600 font-medium">{preview.newCount} yeni</span>
                <span className="text-blue-600 font-medium">{preview.updateCount} guncelleme</span>
                <span className="text-muted-foreground">{preview.total} toplam</span>
              </div>
              <div className="max-h-40 overflow-y-auto text-xs space-y-0.5">
                {preview.preview.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Badge
                      variant={p.action === "new" ? "default" : "secondary"}
                      className="text-[10px] h-4 px-1.5"
                    >
                      {p.action === "new" ? "Yeni" : "Guncelle"}
                    </Badge>
                    <span className="truncate">{p.name}</span>
                    <code className="text-muted-foreground">{p.slug}</code>
                  </div>
                ))}
                {preview.total > 50 && (
                  <p className="text-muted-foreground italic">
                    ve {preview.total - 50} satir daha...
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
              Iptal
            </Button>
            <Button onClick={handleImport} disabled={!preview || importing}>
              {importing ? "Import ediliyor..." : "Import Et"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
