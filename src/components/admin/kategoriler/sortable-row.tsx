"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Folder } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface FlatCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  path: string | null
  isActive: boolean
  sortOrder: number
  description: string | null
  imageUrl: string | null
  _count: { children: number; products: number }
  parent?: { id: string; name: string } | null
}

const depthColors: Record<number, string> = {
  0: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  1: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  2: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  3: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  4: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
}

const depthLabels: Record<number, string> = {
  0: "Ana",
  1: "L1",
  2: "L2",
  3: "L3",
  4: "L4",
}

interface SortableRowProps {
  category: FlatCategory
  checked: boolean
  onCheckChange: (id: string, checked: boolean) => void
  onAddChild: (cat: FlatCategory) => void
  onEdit: (cat: FlatCategory) => void
  onDelete: (cat: FlatCategory) => void
  indent?: number
}

export function SortableRow({
  category,
  checked,
  onCheckChange,
  onAddChild,
  onEdit,
  onDelete,
  indent = 0,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={cn(indent > 0 && "bg-muted/20")}>
      <TableCell>
        <div className="flex items-center gap-1.5" style={{ paddingLeft: `${indent * 24}px` }}>
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted transition-colors shrink-0 touch-none"
            aria-label="Surukle"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <Checkbox
            checked={checked}
            onCheckedChange={(val) => onCheckChange(category.id, !!val)}
          />
          <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{category.name}</p>
            <code className="text-xs text-muted-foreground">{category.slug}</code>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge className={cn("text-[10px] h-4 px-1.5 font-mono", depthColors[category.depth] ?? depthColors[4])}>
          {depthLabels[category.depth] ?? `L${category.depth}`}
        </Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
        {category._count.children > 0 ? category._count.children : <span className="text-muted-foreground/50">-</span>}
      </TableCell>
      <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">
        {category._count.products > 0 ? category._count.products : <span className="text-muted-foreground/50">-</span>}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={category.isActive ? "default" : "outline"}>
          {category.isActive ? "Aktif" : "Pasif"}
        </Badge>
      </TableCell>
      <TableCell className="text-right pr-4">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onAddChild(category)}
            aria-label="Alt kategori ekle"
            title="Alt kategori ekle"
          >
            <span className="text-sm leading-none">+</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(category)}
            aria-label="Duzenle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(category)}
            aria-label="Sil"
            className="text-destructive hover:text-destructive"
            disabled={category._count.children > 0}
            title={category._count.children > 0 ? "Alt kategoriler silinmeden silinemez" : "Sil"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
