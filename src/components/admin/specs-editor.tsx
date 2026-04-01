"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SpecRow {
  key: string
  value: string
}

interface SpecsEditorProps {
  value: Record<string, string> | null | undefined
  onChange: (specs: Record<string, string> | null) => void
  disabled?: boolean
  className?: string
}

function recordToRows(record: Record<string, string> | null | undefined): SpecRow[] {
  if (!record) return []
  return Object.entries(record).map(([key, value]) => ({ key, value }))
}

function rowsToRecord(rows: SpecRow[]): Record<string, string> | null {
  const result: Record<string, string> = {}
  for (const row of rows) {
    if (row.key.trim()) {
      result[row.key.trim()] = row.value
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

export function SpecsEditor({ value, onChange, disabled, className }: SpecsEditorProps) {
  const [rows, setRows] = useState<SpecRow[]>(() => {
    const initial = recordToRows(value)
    return initial.length > 0 ? initial : [{ key: "", value: "" }]
  })

  function updateRow(index: number, field: "key" | "value", val: string) {
    const next = rows.map((row, i) =>
      i === index ? { ...row, [field]: val } : row
    )
    setRows(next)
    onChange(rowsToRecord(next))
  }

  function addRow() {
    setRows((prev) => [...prev, { key: "", value: "" }])
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index)
    const final = next.length > 0 ? next : [{ key: "", value: "" }]
    setRows(final)
    onChange(rowsToRecord(final))
  }

  return (
    <div className={cn("space-y-2", className)}>
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input
            placeholder="Özellik adı (ör: İşlemci)"
            value={row.key}
            onChange={(e) => updateRow(index, "key", e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
          <span className="text-muted-foreground text-sm shrink-0">:</span>
          <Input
            placeholder="Değer (ör: Intel Core i7)"
            value={row.value}
            onChange={(e) => updateRow(index, "value", e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(index)}
            disabled={disabled || (rows.length === 1 && !row.key && !row.value)}
            aria-label="Satırı sil"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-3.5 w-3.5" />
        Özellik Ekle
      </Button>

      {Object.keys(rowsToRecord(rows) ?? {}).length > 0 && (
        <p className="text-xs text-muted-foreground">
          {Object.keys(rowsToRecord(rows) ?? {}).length} teknik özellik tanımlandı
        </p>
      )}
    </div>
  )
}
