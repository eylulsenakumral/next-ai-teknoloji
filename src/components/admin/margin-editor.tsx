"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MarginEditorProps {
  marginId?: string
  scopeId?: string
  scope: "GLOBAL" | "CATEGORY" | "BRAND" | "PRODUCT"
  currentMargin: number | null
  onSaved: () => void
  placeholder?: string
  className?: string
}

export function MarginEditor({
  marginId,
  scopeId,
  scope,
  currentMargin,
  onSaved,
  placeholder = "30",
  className,
}: MarginEditorProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentMargin !== null ? String(currentMargin) : "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function startEdit() {
    setValue(currentMargin !== null ? String(currentMargin) : "")
    setError("")
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError("")
  }

  async function save() {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0 || parsed > 1000) {
      setError("0-1000 arası girin")
      return
    }

    setLoading(true)
    setError("")

    try {
      if (marginId) {
        // Update existing
        const res = await fetch(`/api/pricing/margins/${marginId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marginPct: parsed }),
        })
        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? "Hata oluştu")
          return
        }
      } else {
        // Create new
        const res = await fetch("/api/pricing/margins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope,
            scopeId: scope === "GLOBAL" ? null : scopeId,
            marginPct: parsed,
            isActive: true,
            priority: 0,
          }),
        })
        if (!res.ok) {
          const json = await res.json()
          setError(json.error ?? "Hata oluştu")
          return
        }
      }

      setEditing(false)
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span className="text-sm tabular-nums">
          {currentMargin !== null ? `%${currentMargin}` : <span className="text-muted-foreground">—</span>}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={startEdit}
          aria-label="Marjı düzenle"
          className="h-6 w-6"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="relative w-24">
        <Input
          type="number"
          min="0"
          max="1000"
          step="0.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save()
            if (e.key === "Escape") cancelEdit()
          }}
          placeholder={placeholder}
          className={cn(
            "h-7 text-sm pr-6",
            error && "border-destructive focus-visible:ring-destructive/20"
          )}
          autoFocus
          disabled={loading}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          %
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={save}
        disabled={loading}
        className="h-6 w-6 text-green-600 hover:text-green-700"
        aria-label="Kaydet"
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={cancelEdit}
        disabled={loading}
        className="h-6 w-6"
        aria-label="İptal"
      >
        <X className="h-3 w-3" />
      </Button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  )
}
