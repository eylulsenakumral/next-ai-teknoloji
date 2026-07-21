"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Trash2,
  Save,
  Send,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/format"

// ---------------------------------------------------------------------------
// Tipler
// ---------------------------------------------------------------------------

interface Customer {
  id: string
  companyName: string
  dealerCode: string
  phone?: string
  email?: string
}

interface Product {
  id: string
  name: string
  price: number
  vatRate: number
  images?: string[]
}

interface QuoteItemInput {
  key: string
  productId?: string
  productName: string
  quantity: number
  unitPrice: number
  discountAmount: number
  vatRate: number
  notes?: string
}

// ---------------------------------------------------------------------------
// Müşteri Arama
// ---------------------------------------------------------------------------

function CustomerSelect({
  selected,
  onSelect,
}: {
  selected: Customer | null
  onSelect: (c: Customer) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Customer[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&limit=10`)
      const json = await res.json()
      setResults(json.data ?? json)
    } catch { /* ignore */ }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
        <div className="flex-1 min-w-0">
          <p className="font-medium">{selected.companyName}</p>
          <p className="text-xs text-muted-foreground font-mono">{selected.dealerCode}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { onSelect(null as unknown as Customer); setQuery("") }} aria-label="Kaldır">
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          placeholder="Müşteri ara (firma adı veya bayi kodu)..."
          className="pl-9"
        />
      </div>
      {isOpen && query.length >= 2 && ref.current && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-popover border rounded-lg shadow-lg max-h-60 overflow-auto"
            style={{
              top: ref.current.getBoundingClientRect().bottom + 4,
              left: ref.current.getBoundingClientRect().left,
              width: ref.current.offsetWidth,
            }}
          >
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Aranıyor...</div>
            ) : results.length > 0 ? (
              results.map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
                  onClick={() => { onSelect(c); setIsOpen(false); setQuery("") }}
                >
                  <span className="font-medium">{c.companyName}</span>
                  <span className="text-xs text-muted-foreground font-mono">{c.dealerCode}</span>
                </button>
              ))
            ) : (
              <button
                className="w-full text-left px-3 py-3 hover:bg-muted/50 text-sm"
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    const res = await fetch("/api/customers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        companyName: query,
                        dealerCode: `BAYI-${Date.now().toString(36).toUpperCase()}`,
                        status: "APPROVED",
                      }),
                    })
                    const json = await res.json()
                    const customer = json.data ?? json
                    onSelect(customer)
                    setIsOpen(false)
                    setQuery("")
                  } catch {
                    alert("Müşteri oluşturulamadı.")
                  }
                  setIsLoading(false)
                }}
              >
                <span className="text-primary font-medium">+ "{query}" olarak yeni müşteri oluştur</span>
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ürün Arama
// ---------------------------------------------------------------------------

function ProductSearch({ onAdd }: { onAdd: (p: Product) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`)
        const json = await res.json()
        setResults(json.data ?? json)
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          placeholder="Ürün ara... (en az 2 karakter)"
          className="pl-9"
        />
      </div>
      {isOpen && query.length >= 2 && ref.current && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-popover border rounded-lg shadow-lg max-h-60 overflow-auto"
            style={{
              top: ref.current.getBoundingClientRect().bottom + 4,
              left: ref.current.getBoundingClientRect().left,
              width: ref.current.offsetWidth,
            }}
          >
            {results.length > 0 ? (
              results.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
                  onClick={() => {
                    onAdd(p)
                    setQuery("")
                    setResults([])
                    setIsOpen(false)
                  }}
                >
                  <span className="font-medium truncate mr-2">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatCurrency(p.price)}</span>
                </button>
              ))
            ) : (
              <button
                className="w-full text-left px-3 py-3 hover:bg-muted/50 text-sm"
                onClick={() => {
                  onAdd({ id: "", name: query, price: 0, vatRate: 20 })
                  setQuery("")
                  setResults([])
                  setIsOpen(false)
                }}
              >
                <span className="text-primary font-medium">+ "{query}" olarak manuel ekle</span>
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

let itemCounter = 0
function newItemKey() { return `item-${++itemCounter}-${Date.now()}` }

function calcLineTotal(item: QuoteItemInput) {
  const lineSubtotal = item.unitPrice * item.quantity - item.discountAmount * item.quantity
  const vat = lineSubtotal * (item.vatRate / 100)
  return lineSubtotal + vat
}

// ---------------------------------------------------------------------------
// Ana sayfa
// ---------------------------------------------------------------------------

export default function NewQuotePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<QuoteItemInput[]>([])
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().slice(0, 10)
  })
  const [notes, setNotes] = useState("")
  const [internalNotes, setInternalNotes] = useState("")

  // Toplamlar
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discountTotal = items.reduce((s, i) => s + i.discountAmount * i.quantity, 0)
  const vatTotal = items.reduce((s, i) => {
    const lineNet = i.unitPrice * i.quantity - i.discountAmount * i.quantity
    return s + lineNet * (i.vatRate / 100)
  }, 0)
  const grandTotal = subtotal - discountTotal + vatTotal

  function handleAddProduct(product: Product) {
    setItems((prev) => [
      ...prev,
      {
        key: newItemKey(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price ?? 0,
        discountAmount: 0,
        vatRate: product.vatRate ?? 20,
      },
    ])
  }

  function updateItem(index: number, field: keyof QuoteItemInput, value: string | number) {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave(asDraft: boolean) {
    if (!customer) {
      alert("Lütfen bir müşteri seçin.")
      return
    }
    if (items.length === 0) {
      alert("En az bir ürün ekleyin.")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        customerId: customer.id,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        internalNotes: internalNotes || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount,
          vatRate: i.vatRate,
          lineTotal: calcLineTotal(i),
          notes: i.notes,
        })),
      }

      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Teklif oluşturulamadı")

      // If not draft, update status to SENT
      if (!asDraft && json.data?.id) {
        await fetch(`/api/admin/quotes/${json.data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SENT" }),
        })
      }

      router.push("/admin/teklifler")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Teklif kaydedilemedi.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <Link href="/admin/teklifler">
          <Button variant="ghost" size="icon" aria-label="Geri">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Yeni Teklif</h1>
      </div>

      {/* Müşteri */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Müşteri</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerSelect selected={customer} onSelect={setCustomer} />
        </CardContent>
      </Card>

      {/* Ürünler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ürünler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProductSearch onAdd={handleAddProduct} />

          {items.length > 0 && (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="min-w-[200px]">Ürün</TableHead>
                    <TableHead className="w-24 text-center">Miktar</TableHead>
                    <TableHead className="w-32 text-right">Birim Fiyat</TableHead>
                    <TableHead className="w-32 text-right">İskonto</TableHead>
                    <TableHead className="w-20 text-center">KDV %</TableHead>
                    <TableHead className="w-32 text-right">Satır Toplam</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.key}>
                      <TableCell className="text-sm font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity ?? 1}
                          onChange={(e) => updateItem(idx, "quantity", Math.max(1, Number(e.target.value) || 1))}
                          className="flex h-8 w-20 rounded-md border border-input bg-transparent px-2 py-1 text-center text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice ?? 0}
                          onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value) || 0)}
                          className="flex h-8 w-28 rounded-md border border-input bg-transparent px-2 py-1 text-right text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.discountAmount ?? 0}
                          onChange={(e) => updateItem(idx, "discountAmount", Number(e.target.value) || 0)}
                          className="flex h-8 w-28 rounded-md border border-input bg-transparent px-2 py-1 text-right text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.vatRate ?? 20}
                          onChange={(e) => updateItem(idx, "vatRate", Number(e.target.value) || 0)}
                          className="flex h-8 w-16 rounded-md border border-input bg-transparent px-2 py-1 text-center text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(calcLineTotal(item))}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)} aria-label="Kaldır">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Ürün arayarak teklife ekleyin
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toplamlar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>İskonto</span>
                  <span className="tabular-nums">-{formatCurrency(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">KDV</span>
                <span className="tabular-nums">{formatCurrency(vatTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Genel Toplam</span>
                <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notlar + Geçerlilik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="validUntil" className="text-sm">Geçerlilik Tarihi</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm">Müşteriye Görünen Not</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Teklife ek not..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="internalNotes" className="text-sm">İç Not (müşteriye görünmez)</Label>
              <Textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="İç not..."
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Butonlar */}
      <div className="flex justify-end gap-3">
        <Link href="/admin/teklifler">
          <Button variant="outline">
            İptal
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => handleSave(true)}
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isSaving ? "Kaydediliyor..." : "Taslak Kaydet"}
        </Button>
        <Button
          onClick={() => handleSave(false)}
          disabled={isSaving}
        >
          <Send className="h-4 w-4 mr-1.5" />
          {isSaving ? "Gönderiliyor..." : "Kaydet ve Gönder"}
        </Button>
      </div>
    </div>
  )
}
