"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Loader2,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { cn } from "@/lib/utils"

interface Customer {
  id: string
  dealerCode: string
  companyName: string
  tradeName: string | null
  contactName: string | null
  contactTitle: string | null
  phone: string | null
  phone2: string | null
  email: string | null
  taxOffice: string | null
  taxNumber: string | null
  address: string | null
  city: string | null
  district: string | null
  postalCode: string | null
  whatsappPhone: string | null
  status: string
  balance: number
  creditLimit: number
  discountRate: number
  notes: string | null
  createdAt: string
  approvedAt: string | null
  lastLoginAt: string | null
  orders: Order[]
  accountTransactions: Transaction[]
  _count: { orders: number; accountTransactions: number }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  grandTotal: number
  createdAt: string
  _count: { orderItems: number }
}

interface Transaction {
  id: string
  type: string
  amount: number
  balanceAfter: number
  description: string | null
  createdAt: string
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Bekleyen" },
  { value: "APPROVED", label: "Aktif" },
  { value: "REJECTED", label: "Reddedilmiş" },
  { value: "SUSPENDED", label: "Askıda" },
  { value: "BLACKLISTED", label: "Kara Liste" },
]

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INVOICE: "Fatura",
  PAYMENT: "Ödeme",
  REFUND: "İade",
  ADJUSTMENT: "Düzeltme",
  OPENING_BALANCE: "Açılış Bakiye",
}

const ADJUSTMENT_TYPES = [
  { value: "ADJUSTMENT", label: "Düzeltme" },
  { value: "PAYMENT", label: "Ödeme" },
  { value: "REFUND", label: "İade" },
  { value: "OPENING_BALANCE", label: "Açılış Bakiye" },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value)
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") ?? "genel"

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [smsSending, setSmsSending] = useState(false)
  const [smsResult, setSmsResult] = useState<{ success: boolean; message: string } | null>(null)

  // Cari hareketler
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [txTotal, setTxTotal] = useState(0)
  const [txFilter, setTxFilter] = useState("")

  // Balance dialog
  const [balanceOpen, setBalanceOpen] = useState(false)
  const [balanceAmount, setBalanceAmount] = useState("")
  const [balanceType, setBalanceType] = useState("ADJUSTMENT")
  const [balanceDesc, setBalanceDesc] = useState("")
  const [balanceSaving, setBalanceSaving] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  // Form state (genel tab)
  const [form, setForm] = useState<Partial<Customer>>({})

  const fetchCustomer = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/customers/${id}`)
    if (res.ok) {
      const json = await res.json()
      setCustomer(json.data)
      setForm({
        dealerCode: json.data.dealerCode,
        companyName: json.data.companyName,
        tradeName: json.data.tradeName,
        contactName: json.data.contactName,
        contactTitle: json.data.contactTitle,
        phone: json.data.phone,
        phone2: json.data.phone2,
        email: json.data.email,
        taxOffice: json.data.taxOffice,
        taxNumber: json.data.taxNumber,
        address: json.data.address,
        city: json.data.city,
        district: json.data.district,
        postalCode: json.data.postalCode,
        whatsappPhone: json.data.whatsappPhone,
        status: json.data.status,
        creditLimit: json.data.creditLimit,
        discountRate: json.data.discountRate,
        notes: json.data.notes,
      })
    } else {
      setError("Müşteri yüklenemedi.")
    }
    setLoading(false)
  }, [id])

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true)
    const params = new URLSearchParams({
      page: String(txPage),
      limit: "15",
      ...(txFilter ? { type: txFilter } : {}),
    })
    const res = await fetch(`/api/customers/${id}/balance?${params}`)
    if (res.ok) {
      const json = await res.json()
      setTransactions(json.data ?? [])
      setTxTotal(json.meta?.total ?? 0)
    }
    setTxLoading(false)
  }, [id, txPage, txFilter])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  async function handleSave() {
    setSaving(true)
    setSaveMessage(null)
    setError(null)

    // null değerleri temizle - API'nin kabul etmesi için
    const cleanForm: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(form)) {
      if (value !== undefined) {
        // Sayısal alanları number'a çevir
        if (key === "creditLimit" || key === "discountRate") {
          cleanForm[key] = value === "" || value === null ? undefined : Number(value)
        } else {
          cleanForm[key] = value
        }
      }
    }

    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanForm),
    })

    const json = await res.json()
    if (res.ok) {
      setSaveMessage("Değişiklikler kaydedildi.")
      fetchCustomer()
    } else {
      const details = json.details ? Object.entries(json.details).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join(" | ") : ""
      setError(`${json.error ?? "Kayıt başarısız."}${details ? ` — ${details}` : ""}`)
    }
    setSaving(false)
  }

  async function handleBalanceSubmit() {
    const amount = parseFloat(balanceAmount)
    if (isNaN(amount) || amount === 0) {
      setBalanceError("Geçerli bir tutar girin.")
      return
    }
    if (!balanceDesc.trim()) {
      setBalanceError("Açıklama zorunlu.")
      return
    }

    setBalanceSaving(true)
    setBalanceError(null)

    const res = await fetch(`/api/customers/${id}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        description: balanceDesc,
        type: balanceType,
      }),
    })

    const json = await res.json()
    if (res.ok) {
      setBalanceOpen(false)
      setBalanceAmount("")
      setBalanceDesc("")
      setBalanceType("ADJUSTMENT")
      fetchCustomer()
      fetchTransactions()
    } else {
      setBalanceError(json.error ?? "İşlem başarısız.")
    }
    setBalanceSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error ?? "Müşteri bulunamadı."}</p>
        <Link href="/admin/musteriler" className="text-blue-600 underline mt-2 inline-block">
          Listeye dön
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Başlık */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/musteriler"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Müşteriler
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{customer.companyName}</h1>
            <Badge className="font-mono">{customer.dealerCode}</Badge>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          {saveMessage}
        </div>
      )}

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="genel">Genel Bilgiler</TabsTrigger>
          <TabsTrigger
            value="cari"
            onClick={() => {
              if (transactions.length === 0) fetchTransactions()
            }}
          >
            Cari Hesap
          </TabsTrigger>
          <TabsTrigger value="siparisler">
            Siparişler ({customer._count.orders})
          </TabsTrigger>
        </TabsList>

        {/* TAB: Genel Bilgiler */}
        <TabsContent value="genel" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Firma Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Firma Adı</Label>
                <Input
                  value={form.companyName ?? ""}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
              <div>
                <Label>Ticari Ünvan</Label>
                <Input
                  value={form.tradeName ?? ""}
                  onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                />
              </div>
              <div>
                <Label>Vergi Dairesi</Label>
                <Input
                  value={form.taxOffice ?? ""}
                  onChange={(e) => setForm({ ...form, taxOffice: e.target.value })}
                />
              </div>
              <div>
                <Label>Vergi Numarası</Label>
                <Input
                  value={form.taxNumber ?? ""}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Giriş Bilgileri</CardTitle>
              <CardDescription>Bayi kodu ve şifresini buradan değiştirebilirsiniz</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Bayi Kodu</Label>
                <Input
                  value={form.dealerCode ?? ""}
                  onChange={(e) => setForm({ ...form, dealerCode: e.target.value.toUpperCase() })}
                  placeholder="Örn: NEXTAI"
                />
              </div>
              <div>
                <Label>Yeni Şifre</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={(form as Record<string, unknown>).newPassword as string ?? ""}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value } as Partial<Customer>)}
                    placeholder="Değiştirmek istemiyorsanız boş bırakın"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const pin = String(Math.floor(100000 + Math.random() * 900000))
                      setForm({ ...form, newPassword: pin } as Partial<Customer>)
                    }}
                    className="text-[12px] shrink-0"
                  >
                    Üret
                  </Button>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Boş bırakırsanız mevcut şifre korunur</p>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-[var(--color-border)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={smsSending}
                  onClick={async () => {
                    let pw = (form as Record<string, unknown>).newPassword as string
                    if (!pw?.trim()) {
                      pw = String(Math.floor(100000 + Math.random() * 900000))
                      setForm({ ...form, newPassword: pw } as Partial<Customer>)
                    }
                    setSmsResult(null)
                    setSmsSending(true)
                    try {
                      const res = await fetch(`/api/customers/${id}/send-credentials`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: pw.trim() }),
                      })
                      const json = await res.json()
                      if (json.success) {
                        setSmsResult({ success: true, message: json.message })
                      } else {
                        setSmsResult({ success: false, message: json.error ?? "SMS gönderilemedi." })
                      }
                    } catch {
                      setSmsResult({ success: false, message: "Ağ hatası oluştu." })
                    } finally {
                      setSmsSending(false)
                    }
                  }}
                  className="text-[12px] gap-1.5"
                >
                  {smsSending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gönderiliyor...</>
                  ) : (
                    <><Send className="h-3.5 w-3.5" /> Şifreyi SMS ile Gönder</>
                  )}
                </Button>
                {smsResult && (
                  <span className={`text-[12px] ${smsResult.success ? "text-green-600" : "text-red-500"}`}>
                    {smsResult.message}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yetkili ve İletişim</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Yetkili Adı</Label>
                <Input
                  value={form.contactName ?? ""}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
              </div>
              <div>
                <Label>Ünvan</Label>
                <Input
                  value={form.contactTitle ?? ""}
                  onChange={(e) => setForm({ ...form, contactTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefon 2</Label>
                <Input
                  value={form.phone2 ?? ""}
                  onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={form.whatsappPhone ?? ""}
                  onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticari Koşullar ve Durum</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Durum</Label>
                <Select
                  value={form.status ?? ""}
                  onValueChange={(v) => v !== null && setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kredi Limiti (TRY)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.creditLimit ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>İskonto Oranı (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.discountRate ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, discountRate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Dahili notlar..."
              />
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </TabsContent>

        {/* TAB: Cari Hesap */}
        <TabsContent value="cari" className="space-y-4 mt-4">
          {/* Bakiye Özeti */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm text-slate-500">Güncel Bakiye</p>
                <p
                  className={cn(
                    "text-3xl font-bold mt-1",
                    Number(customer.balance) < 0 ? "text-red-600" : "text-green-600"
                  )}
                >
                  {formatCurrency(Number(customer.balance))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm text-slate-500">Kredi Limiti</p>
                <p className="text-2xl font-bold mt-1 text-slate-700">
                  {formatCurrency(Number(customer.creditLimit))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm text-slate-500">Toplam Hareket</p>
                <p className="text-2xl font-bold mt-1 text-slate-700">
                  {customer._count.accountTransactions}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtre ve Manuel Düzenleme */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={txFilter} onValueChange={(v) => { if (v !== null) { setTxFilter(v); setTxPage(1) } }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tüm tipler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm tipler</SelectItem>
                <SelectItem value="INVOICE">Fatura</SelectItem>
                <SelectItem value="PAYMENT">Ödeme</SelectItem>
                <SelectItem value="REFUND">İade</SelectItem>
                <SelectItem value="ADJUSTMENT">Düzeltme</SelectItem>
                <SelectItem value="OPENING_BALANCE">Açılış Bakiye</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTransactions}
              disabled={txLoading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", txLoading && "animate-spin")} />
              Yenile
            </Button>
            <Button
              size="sm"
              onClick={() => setBalanceOpen(true)}
              className="ml-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manuel Hareket
            </Button>
          </div>

          {/* Hareketler Tablosu */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead className="text-right">Bakiye</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-slate-100 rounded animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                          Hareket bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString("tr-TR")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {tx.description ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "font-mono text-sm flex items-center justify-end gap-1",
                                tx.amount < 0 ? "text-green-600" : "text-red-600"
                              )}
                            >
                              {tx.amount < 0 ? (
                                <TrendingDown className="w-3.5 h-3.5" />
                              ) : (
                                <TrendingUp className="w-3.5 h-3.5" />
                              )}
                              {formatCurrency(Math.abs(tx.amount))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(tx.balanceAfter)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {txTotal > 15 && (
                <div className="flex justify-between items-center px-4 py-3 border-t">
                  <span className="text-sm text-slate-500">{txTotal} hareket</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((p) => p - 1)}
                    >
                      Önceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage * 15 >= txTotal}
                      onClick={() => setTxPage((p) => p + 1)}
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Siparişler */}
        <TabsContent value="siparisler" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sipariş No</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Ödeme</TableHead>
                    <TableHead>Kalemler</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                        Sipariş bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customer.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{order.paymentStatus}</Badge>
                        </TableCell>
                        <TableCell>{order._count.orderItems} kalem</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(Number(order.grandTotal))}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Balance Dialog */}
      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manuel Bakiye Hareketi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hareket Türü</Label>
              <Select value={balanceType} onValueChange={(v) => v !== null && setBalanceType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                Tutar (pozitif = borç, negatif = alacak)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Örn: 1500 veya -500"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input
                placeholder="Hareket açıklaması..."
                value={balanceDesc}
                onChange={(e) => setBalanceDesc(e.target.value)}
              />
            </div>
            {balanceError && (
              <p className="text-sm text-red-600">{balanceError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleBalanceSubmit} disabled={balanceSaving}>
              {balanceSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
