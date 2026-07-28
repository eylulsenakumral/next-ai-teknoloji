"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface SupplierMargin {
  id: string
  code: string
  name: string
  isActive: boolean
  marginRate: number
}

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  isActive: boolean
  sortOrder: number
}

interface CategoryMargin {
  id: string
  scopeId: string
  marginPct: number
}

// ----------------------------------------------------------------------------
// Suppliers tab
// ----------------------------------------------------------------------------

function SupplierMarginsCard() {
  const [suppliers, setSuppliers] = useState<SupplierMargin[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, { type: "ok" | "err"; msg: string }>>({})
  const [loading, setLoading] = useState(true)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/kar-marji")
      if (res.ok) {
        const json = await res.json()
        const list: SupplierMargin[] = json.data ?? []
        setSuppliers(list)
        setDrafts(Object.fromEntries(list.map((s) => [s.id, s.marginRate.toFixed(2)])))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSuppliers()
  }, [fetchSuppliers])

  async function saveOne(supplierId: string) {
    const value = drafts[supplierId]
    const parsed = parseFloat(value)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 200) {
      setFeedback((p) => ({
        ...p,
        [supplierId]: { type: "err", msg: "0-200 arası bir değer girin." },
      }))
      return
    }

    setSavingId(supplierId)
    setFeedback((p) => ({ ...p, [supplierId]: { type: "ok", msg: "" } }))

    try {
      const res = await fetch("/api/admin/kar-marji", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, marginRate: parsed }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFeedback((p) => ({
          ...p,
          [supplierId]: { type: "err", msg: json.error ?? "Hata oluştu." },
        }))
      } else {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === supplierId ? { ...s, marginRate: json.data.marginRate } : s))
        )
        setFeedback((p) => ({
          ...p,
          [supplierId]: { type: "ok", msg: "Kaydedildi." },
        }))
        setTimeout(() => {
          setFeedback((p) => {
            const next = { ...p }
            delete next[supplierId]
            return next
          })
        }, 2000)
      }
    } catch {
      setFeedback((p) => ({
        ...p,
        [supplierId]: { type: "err", msg: "Sunucu hatası." },
      }))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tedarikçi Marjları</CardTitle>
        <CardDescription>
          Tedarikçi bazlı kar marjı. Kategori marjı tanımlı ürünlerde kategori marjı önceliklidir.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Tedarikçi</TableHead>
              <TableHead>Mevcut Marj</TableHead>
              <TableHead>Yeni Marj (%)</TableHead>
              <TableHead className="text-right pr-4">Kaydet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            )}
            {!loading && suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Tedarikçi bulunamadı.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              suppliers.map((s) => {
                const fb = feedback[s.id]
                return (
                  <TableRow key={s.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{s.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {s.code}
                        </Badge>
                        {!s.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Pasif
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">%{s.marginRate.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="200"
                          step="0.5"
                          value={drafts[s.id] ?? ""}
                          onChange={(e) => setDrafts((p) => ({ ...p, [s.id]: e.target.value }))}
                          className="h-8 w-24"
                        />
                        {fb && (
                          <span
                            className={`text-xs ${
                              fb.type === "err" ? "text-destructive" : "text-emerald-600"
                            }`}
                          >
                            {fb.msg}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button size="sm" onClick={() => saveOne(s.id)} disabled={savingId === s.id}>
                        {savingId === s.id ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ----------------------------------------------------------------------------
// Categories tab
// ----------------------------------------------------------------------------

function CategoryMarginsCard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [margins, setMargins] = useState<Record<string, CategoryMargin>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, { type: "ok" | "err"; msg: string }>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, marginRes] = await Promise.all([
        fetch("/api/categories?flat=true"),
        fetch("/api/pricing/margins?scope=CATEGORY"),
      ])

      let cats: Category[] = []
      if (catRes.ok) {
        const json = await catRes.json()
        cats = (json.data ?? []).map((c: Category) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parentId: c.parentId,
          depth: c.depth,
          isActive: c.isActive,
          sortOrder: c.sortOrder,
        }))
        cats.sort(
          (a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
        )
        setCategories(cats)
      }

      if (marginRes.ok) {
        const json = await marginRes.json()
        const list: CategoryMargin[] = (json.data ?? [])
          .filter((m: CategoryMargin) => m.scopeId)
          .map((m: CategoryMargin) => ({
            id: m.id,
            scopeId: m.scopeId,
            marginPct: Number(m.marginPct),
          }))
        const map = Object.fromEntries(list.map((m) => [m.scopeId, m]))
        setMargins(map)
        setDrafts(
          Object.fromEntries(cats.map((c) => [c.id, map[c.id]?.marginPct.toFixed(2) ?? ""]))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  async function saveOne(categoryId: string) {
    const value = drafts[categoryId]
    const parsed = parseFloat(value)
    if (value !== "" && (!Number.isFinite(parsed) || parsed < 0 || parsed > 200)) {
      setFeedback((p) => ({
        ...p,
        [categoryId]: { type: "err", msg: "0-200 arası bir değer girin." },
      }))
      return
    }

    setSavingId(categoryId)
    setFeedback((p) => ({ ...p, [categoryId]: { type: "ok", msg: "" } }))

    try {
      const existing = margins[categoryId]
      let res: Response

      if (existing) {
        if (value === "") {
          setFeedback((p) => ({
            ...p,
            [categoryId]: { type: "ok", msg: "Boş bırakıldı." },
          }))
          setSavingId(null)
          return
        }
        res = await fetch(`/api/pricing/margins/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marginPct: parsed }),
        })
      } else {
        if (value === "") {
          setFeedback((p) => ({
            ...p,
            [categoryId]: { type: "ok", msg: "Boş bırakıldı." },
          }))
          setSavingId(null)
          return
        }
        res = await fetch("/api/pricing/margins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope: "CATEGORY",
            scopeId: categoryId,
            marginPct: parsed,
          }),
        })
      }

      const json = await res.json()
      if (!res.ok) {
        setFeedback((p) => ({
          ...p,
          [categoryId]: { type: "err", msg: json.error ?? "Hata oluştu." },
        }))
      } else {
        const saved: CategoryMargin = {
          id: json.data.id,
          scopeId: json.data.scopeId,
          marginPct: Number(json.data.marginPct),
        }
        setMargins((prev) => ({ ...prev, [saved.scopeId]: saved }))
        setDrafts((prev) => ({ ...prev, [saved.scopeId]: saved.marginPct.toFixed(2) }))
        setFeedback((p) => ({
          ...p,
          [categoryId]: { type: "ok", msg: "Kaydedildi." },
        }))
        setTimeout(() => {
          setFeedback((p) => {
            const next = { ...p }
            delete next[categoryId]
            return next
          })
        }, 2000)
      }
    } catch {
      setFeedback((p) => ({
        ...p,
        [categoryId]: { type: "err", msg: "Sunucu hatası." },
      }))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Kategori Bazlı Marjlar</CardTitle>
            <CardDescription>
              Her kategori için komisyon oranı belirleyin. Kategori marjı varsa tedarikçi marjı
              devreye girmez.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData} aria-label="Yenile">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Kategori</TableHead>
              <TableHead>Mevcut Marj</TableHead>
              <TableHead>Yeni Marj (%)</TableHead>
              <TableHead className="text-right pr-4">Kaydet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            )}
            {!loading && categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Kategori bulunamadı.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              categories.map((c) => {
                const fb = feedback[c.id]
                const current = margins[c.id]
                return (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium text-sm"
                          style={{ paddingLeft: `${c.depth * 20}px` }}
                        >
                          {c.name}
                        </span>
                        {!c.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Pasif
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">
                        {current ? `%${current.marginPct.toFixed(2)}` : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="200"
                          step="0.5"
                          value={drafts[c.id] ?? ""}
                          onChange={(e) => setDrafts((p) => ({ ...p, [c.id]: e.target.value }))}
                          className="h-8 w-24"
                          placeholder="Marj"
                        />
                        {fb && (
                          <span
                            className={cn(
                              "text-xs",
                              fb.type === "err" ? "text-destructive" : "text-emerald-600"
                            )}
                          >
                            {fb.msg}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button size="sm" onClick={() => saveOne(c.id)} disabled={savingId === c.id}>
                        {savingId === c.id ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function KarMarjiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Kar Marjı</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tedarikçi ve kategori bazlı kar marjı yönetimi.
        </p>
      </div>

      <Tabs defaultValue="supplier" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="supplier">Tedarikçi Marjı</TabsTrigger>
          <TabsTrigger value="category">Kategori Marjı</TabsTrigger>
        </TabsList>
        <TabsContent value="supplier">
          <SupplierMarginsCard />
        </TabsContent>
        <TabsContent value="category">
          <CategoryMarginsCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
