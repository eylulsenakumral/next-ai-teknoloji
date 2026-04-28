"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface SupplierMargin {
  id: string
  code: string
  name: string
  isActive: boolean
  marginRate: number
}

export default function KarMarjiPage() {
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
        setDrafts(
          Object.fromEntries(list.map((s) => [s.id, s.marginRate.toFixed(2)]))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
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
          prev.map((s) =>
            s.id === supplierId ? { ...s, marginRate: json.data.marginRate } : s
          )
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kar Marjı</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tedarikçi bazlı kar marjı yönetimi. Bayi katalog fiyatları bu orana göre hesaplanır.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchSuppliers} aria-label="Yenile">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tedarikçi Marjları</CardTitle>
          <CardDescription>
            Satış fiyatı = Alış fiyatı × (1 + marj/100). Varsayılan %30.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Tedarikçi</TableHead>
                <TableHead>Mevcut Marj (%)</TableHead>
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
                        <span className="text-sm tabular-nums">
                          %{s.marginRate.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="200"
                            step="0.5"
                            value={drafts[s.id] ?? ""}
                            onChange={(e) =>
                              setDrafts((p) => ({ ...p, [s.id]: e.target.value }))
                            }
                            className="h-8 w-24"
                          />
                          {fb && (
                            <span
                              className={`text-xs ${
                                fb.type === "err"
                                  ? "text-destructive"
                                  : "text-emerald-600"
                              }`}
                            >
                              {fb.msg}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          size="sm"
                          onClick={() => saveOne(s.id)}
                          disabled={savingId === s.id}
                        >
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
    </div>
  )
}
