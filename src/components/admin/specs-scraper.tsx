"use client"

import { useState } from "react"
import { Globe, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SpecsScraperProps {
  onSpecsExtracted: (specs: Record<string, string>, images?: string[]) => void
  disabled?: boolean
  className?: string
}

export function SpecsScraper({ onSpecsExtracted, disabled, className }: SpecsScraperProps) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [, setExtractedCount] = useState(0)
  const [, setImageCount] = useState(0)

  async function handleScrape() {
    if (!url.trim()) return

    setLoading(true)
    setStatus("idle")
    setMessage("")
    setExtractedCount(0)
    setImageCount(0)

    try {
      const res = await fetch("/api/admin/scrape-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error || "Scrape başarısız")
        return
      }

      const specsCount = data.specs ? Object.keys(data.specs).length : 0
      const imgsCount = data.images ? data.images.length : 0

      if (specsCount > 0 || imgsCount > 0) {
        setStatus("success")
        setExtractedCount(specsCount)
        setImageCount(imgsCount)

        const parts = []
        if (specsCount > 0) parts.push(`${specsCount} özellik`)
        if (imgsCount > 0) parts.push(`${imgsCount} görsel`)
        setMessage(parts.join(", ") + " çıkarıldı")

        onSpecsExtracted(data.specs || {}, data.images || [])
      } else {
        setStatus("error")
        setMessage("Teknik özellik veya görsel bulunamadı")
      }
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Bağlantı hatası")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading && !disabled) {
      handleScrape()
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Ürün sayfası URL'si (ör: https://example.com/urun)"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setStatus("idle")
              setMessage("")
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleScrape}
          disabled={disabled || loading || !url.trim()}
          className="shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Çekiliyor...
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              Çek
            </>
          )}
        </Button>
      </div>

      {/* Status mesajı */}
      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2 text-xs px-3 py-2 rounded-md",
            status === "success" && "bg-green-50 text-green-700 border border-green-200",
            status === "error" && "bg-red-50 text-red-700 border border-red-200"
          )}
        >
          {status === "success" && <CheckCircle2 className="h-3.5 w-3.5" />}
          {status === "error" && <AlertCircle className="h-3.5 w-3.5" />}
          {message}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <ImageIcon className="h-3 w-3 inline mr-1" />
        Herhangi bir ürün sayfası URL'si girin. LLM teknik özellikleri ve görselleri otomatik çıkarır.
      </p>
    </div>
  )
}
