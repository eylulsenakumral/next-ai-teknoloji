"use client"

import { useState, useRef } from "react"
import { Plus, Trash2, ArrowUp, ArrowDown, Star, Upload, Loader2, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ImageManagerProps {
  value: string[]
  onChange: (images: string[]) => void
  disabled?: boolean
  className?: string
}

export function ImageManager({ value, onChange, disabled, className }: ImageManagerProps) {
  const [newUrl, setNewUrl] = useState("")
  const [urlError, setUrlError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addImage(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return

    if (value.includes(trimmed)) {
      setUrlError("Bu görsel zaten eklenmiş.")
      return
    }

    setUrlError("")
    onChange([...value, trimmed])
  }

  function addFromUrl() {
    const trimmed = newUrl.trim()
    if (!trimmed) return

    try {
      new URL(trimmed)
    } catch {
      setUrlError("Geçerli bir URL girin (https://... ile başlamalı)")
      return
    }

    addImage(trimmed)
    setNewUrl("")
  }

  function removeImage(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...value]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  function moveDown(index: number) {
    if (index === value.length - 1) return
    const next = [...value]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      addFromUrl()
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya tipi kontrolu
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Sadece JPEG, PNG, GIF, WebP ve SVG dosyaları yüklenebilir.")
      return
    }

    // Dosya boyutu kontrolu (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Dosya boyutu en fazla 10MB olabilir.")
      return
    }

    setUploading(true)
    setUploadError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error || "Yükleme başarısız")
        return
      }

      // Yuklenen dosya URL'ini ekle
      addImage(data.url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Yükleme hatası")
    } finally {
      setUploading(false)
      // Input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Dosya tipi kontrolu
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Sadece görsel dosyaları sürükleyebilirsiniz.")
      return
    }

    // Dosya boyutu kontrolu (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Dosya boyutu en fazla 10MB olabilir.")
      return
    }

    setUploading(true)
    setUploadError("")

    const formData = new FormData()
    formData.append("file", file)

    fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          addImage(data.url)
        } else {
          setUploadError(data.error || "Yükleme başarısız")
        }
      })
      .catch((err) => {
        setUploadError(err instanceof Error ? err.message : "Yükleme hatası")
      })
      .finally(() => {
        setUploading(false)
      })
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Görsel listesi */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((url, index) => (
            <div
              key={url}
              className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card"
            >
              {/* Sıralama kontrolleri */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => moveUp(index)}
                  disabled={disabled || index === 0}
                  aria-label="Yukarı taşı"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => moveDown(index)}
                  disabled={disabled || index === value.length - 1}
                  aria-label="Aşağı taşı"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Önizleme */}
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Görsel ${index + 1}`}
                  className="w-12 h-12 object-contain rounded border border-border bg-muted"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='m21 15-5-5L5 21'/%3E%3C/svg%3E"
                  }}
                />
                {index === 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                    <Star className="h-2.5 w-2.5 text-white fill-white" />
                  </span>
                )}
              </div>

              {/* URL (truncated) */}
              <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                {index === 0 && (
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium mr-1">
                    Ana görsel
                  </span>
                )}
                {url}
              </p>

              {/* Sil */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeImage(index)}
                disabled={disabled}
                aria-label="Görseli kaldır"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dosya yükleme alanı */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
          uploading ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleFileUpload}
          disabled={disabled || uploading}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={cn(
            "flex flex-col items-center gap-2 cursor-pointer",
            (disabled || uploading) && "cursor-not-allowed opacity-50"
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? "Yükleniyor..." : "Dosya sürükle veya tıkla ile yükle"}
          </span>
          <span className="text-xs text-muted-foreground/70">
            JPEG, PNG, GIF, WebP, SVG (max 10MB)
          </span>
        </label>
      </div>

      {uploadError && (
        <p className="text-xs text-destructive">{uploadError}</p>
      )}

      {/* URL ile ekleme */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="https://example.com/gorsel.jpg"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value)
                if (urlError) setUrlError("")
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              aria-invalid={Boolean(urlError)}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addFromUrl}
            disabled={disabled || !newUrl.trim()}
          >
            <Plus className="h-4 w-4" />
            Ekle
          </Button>
        </div>
        {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        <p className="text-xs text-muted-foreground">
          {value.length === 0
            ? "Görsel URL'si girin veya dosya yükleyin."
            : `${value.length} görsel eklendi. İlk görsel ana görsel olarak kullanılır.`}
        </p>
      </div>
    </div>
  )
}
