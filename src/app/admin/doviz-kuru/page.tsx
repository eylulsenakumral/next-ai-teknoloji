"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Pencil,
  Save,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface RateData {
  mode: string
  usd: number
  eur: number
  lastUpdated: string | null
}

export default function DovizKuruPage() {
  const [data, setData] = useState<RateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editUsd, setEditUsd] = useState("")
  const [editEur, setEditEur] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/exchange-rate")
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  // Auto-clear message
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(t)
    }
  }, [message])

  async function handleTCMBFetch() {
    setFetching(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/exchange-rate", { method: "POST" })
      const json = await res.json()
      if (res.ok) {
        setData(json.data)
        setMessage({ type: "success", text: json.message || "Kur güncellendi." })
      } else {
        setMessage({ type: "error", text: json.error || "Kur alınamadı." })
      }
    } catch {
      setMessage({ type: "error", text: "Sunucuya bağlanılamadı." })
    } finally {
      setFetching(false)
    }
  }

  async function handleModeSwitch() {
    if (!data) return
    setSwitching(true)
    setMessage(null)
    const newMode = data.mode === "AUTO" ? "MANUAL" : "AUTO"
    try {
      const res = await fetch("/api/admin/exchange-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      })
      const json = await res.json()
      if (res.ok) {
        setData(json.data)
        setMessage({ type: "success", text: `Mod ${newMode === "AUTO" ? "Otomatik" : "Manuel"} olarak değiştirildi.` })
      }
    } catch {
      setMessage({ type: "error", text: "Mod değiştirilemedi." })
    } finally {
      setSwitching(false)
    }
  }

  function startEdit() {
    if (!data) return
    setEditUsd(data.usd.toFixed(4))
    setEditEur(data.eur.toFixed(4))
    setEditMode(true)
  }

  async function handleSaveManual() {
    const usd = parseFloat(editUsd)
    const eur = parseFloat(editEur)
    if (!usd || usd <= 0 || !eur || eur <= 0) {
      setMessage({ type: "error", text: "Geçerli kur değerleri girin." })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/exchange-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usd, eur }),
      })
      const json = await res.json()
      if (res.ok) {
        setData(json.data)
        setEditMode(false)
        setMessage({ type: "success", text: "Kur başarıyla kaydedildi." })
      }
    } catch {
      setMessage({ type: "error", text: "Kaydedilemedi." })
    } finally {
      setSaving(false)
    }
  }

  function formatRate(n: number) {
    return n.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—"
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            Döviz Kuru Yönetimi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            TCMB veya manuel olarak döviz kurlarını yönetin
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTCMBFetch}
          disabled={fetching}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", fetching && "animate-spin")} />
          TCMB&apos;den Çek
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg text-sm",
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Güncelleme Modu</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {data?.mode === "AUTO"
                ? "Otomatik modda kur saatte bir TCMB'den çekilir"
                : "Manuel modda kur sadece sizin girişinizle güncellenir"}
            </p>
          </div>
          <button
            onClick={handleModeSwitch}
            disabled={switching || !data}
            className={cn(
              "relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "disabled:opacity-50",
              data?.mode === "AUTO" ? "bg-blue-600" : "bg-slate-400"
            )}
          >
            {switching && <Loader2 className="w-4 h-4 animate-spin absolute left-1/2 -translate-x-1/2 text-white" />}
            <span
              className={cn(
                "inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-300",
                data?.mode === "AUTO" ? "translate-x-9" : "translate-x-1"
              )}
            />
            <span
              className={cn(
                "absolute text-[10px] font-bold text-white",
                data?.mode === "AUTO" ? "left-1.5" : "left-7"
              )}
            >
              {data?.mode === "AUTO" ? "OTO" : "MAN"}
            </span>
          </button>
        </div>

        {data?.mode === "AUTO" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Saatte bir otomatik güncellenecek</span>
          </div>
        )}
        {data?.mode === "MANUAL" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Pencil className="w-3.5 h-3.5 text-slate-400" />
            <span>Kurları aşağıdan manuel olarak güncelleyebilirsiniz</span>
          </div>
        )}
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* USD Card */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-bold text-lg">
                $
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">USD / TRY</p>
                <p className="text-xs text-slate-400">Amerikan Doları</p>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          {editMode ? (
            <Input
              type="number"
              step="0.0001"
              value={editUsd}
              onChange={(e) => setEditUsd(e.target.value)}
              className="text-2xl font-bold h-12"
            />
          ) : (
            <p className="text-3xl font-bold text-slate-900 tabular-nums">
              {data?.usd ? formatRate(data.usd) : "—"}
              <span className="text-base font-normal text-slate-400 ml-1">₺</span>
            </p>
          )}
        </div>

        {/* EUR Card */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                €
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">EUR / TRY</p>
                <p className="text-xs text-slate-400">Avrupa Para Birimi</p>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          {editMode ? (
            <Input
              type="number"
              step="0.0001"
              value={editEur}
              onChange={(e) => setEditEur(e.target.value)}
              className="text-2xl font-bold h-12"
            />
          ) : (
            <p className="text-3xl font-bold text-slate-900 tabular-nums">
              {data?.eur ? formatRate(data.eur) : "—"}
              <span className="text-base font-normal text-slate-400 ml-1">₺</span>
            </p>
          )}
        </div>
      </div>

      {/* Last Updated & Actions */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>Son güncelleme: <strong className="text-slate-700">{formatDate(data?.lastUpdated ?? null)}</strong></span>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                >
                  İptal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveManual}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  Kaydet
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={startEdit}
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Manuel Düzenle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500 space-y-1.5">
        <p className="flex items-center gap-2">
          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
          <strong>Otomatik mod:</strong> Kurlar her saat başı TCMB&apos;den çekilir ve veritabanına kaydedilir.
        </p>
        <p className="flex items-center gap-2">
          <Pencil className="w-3.5 h-3.5 shrink-0" />
          <strong>Manuel mod:</strong> TCMB otomatik çekme durur. Kurları kendiniz girebilirsiniz.
        </p>
        <p className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <strong>TCMB&apos;den Çek:</strong> Moddan bağımsız olarak anlık TCMB kurunu çeker.
        </p>
      </div>
    </div>
  )
}
