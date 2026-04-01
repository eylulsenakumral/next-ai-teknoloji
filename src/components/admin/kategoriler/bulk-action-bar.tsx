"use client"

import { useState } from "react"
import { CheckSquare, XSquare, Trash2, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { toast } from "@/components/ui/toaster"

type BulkAction = "activate" | "deactivate" | "delete"

interface BulkActionBarProps {
  selectedIds: string[]
  totalCount: number
  onClear: () => void
  onSelectAll: () => void
  onSuccess: () => void
}

export function BulkActionBar({
  selectedIds,
  totalCount,
  onClear,
  onSelectAll,
  onSuccess,
}: BulkActionBarProps) {
  const [loading, setLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  if (selectedIds.length === 0) return null

  async function handleBulkAction(action: BulkAction) {
    if (action === "delete") {
      setDeleteConfirmOpen(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/categories/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      })
      const json = await res.json()

      if (res.ok) {
        toast({ title: "Basarili", description: json.message })
        onClear()
        onSuccess()
      } else {
        toast({ title: "Hata", description: json.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Hata", description: "Islem basarisiz.", variant: "destructive" })
    }
    setLoading(false)
  }

  async function handleDeleteConfirm() {
    setLoading(true)
    try {
      const res = await fetch("/api/categories/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "delete" }),
      })
      const json = await res.json()

      if (res.ok) {
        toast({ title: "Basarili", description: json.message })
        setDeleteConfirmOpen(false)
        onClear()
        onSuccess()
      } else {
        toast({ title: "Hata", description: json.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Hata", description: "Silme islemi basarisiz.", variant: "destructive" })
    }
    setLoading(false)
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-popover border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 ring-1 ring-foreground/10">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedIds.length} / {totalCount} secili
        </span>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            Tumunu Sec
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs"
          >
            <XSquare className="h-3.5 w-3.5 mr-1" />
            Temizle
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" disabled={loading}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              Toplu Islem
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleBulkAction("activate")}>
              <Eye className="h-4 w-4 mr-2" />
              Toplu Aktif Yap
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction("deactivate")}>
              <EyeOff className="h-4 w-4 mr-2" />
              Toplu Pasif Yap
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleBulkAction("delete")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Toplu Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`${selectedIds.length} kategori silinsin mi?`}
        description="Secili kategoriler kalici olarak silinecek. Alt kategorisi olanlar silinemez."
        confirmLabel="Toplu Sil"
        onConfirm={handleDeleteConfirm}
        loading={loading}
      />
    </>
  )
}
