"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from "lucide-react"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  maxSize?: number // in bytes
  accept?: string
  folder?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  label = "Görsel",
  maxSize = 2 * 1024 * 1024, // 2MB default
  accept = "image/jpeg,image/png,image/webp,image/svg+xml",
  folder = "brands",
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError("")

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Sadece görsel dosyaları yüklenebilir.")
        return
      }

      // Validate file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
        setError(`Dosya boyutu en fazla ${maxSizeMB}MB olabilir.`)
        return
      }

      // Validate accepted formats
      const acceptedTypes = accept.split(",")
      if (!acceptedTypes.includes(file.type)) {
        setError("Bu dosya formatı desteklenmiyor.")
        return
      }

      setUploading(true)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`/api/admin/upload?folder=${folder}`, {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || "Yükleme başarısız.")
          return
        }

        onChange(result.url)
      } catch (err) {
        console.error("Upload error:", err)
        setError("Dosya yüklenirken bir hata oluştu.")
      } finally {
        setUploading(false)
      }
    },
    [maxSize, accept, folder, onChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleRemove = useCallback(() => {
    onChange("")
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onChange])

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
      setError("")
    },
    [onChange]
  )

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value && !showUrlInput ? (
        // Preview mode
        <div className="relative group">
          <div className="relative w-full h-40 rounded-lg border border-border overflow-hidden bg-muted">
            <img
              src={value}
              alt={label}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={disabled}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : showUrlInput ? (
        // URL input mode
        <div className="space-y-2">
          <Input
            type="text"
            value={value}
            onChange={handleUrlChange}
            placeholder="https://..."
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlInput(false)}
            disabled={disabled || uploading}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Dosya yükle
          </Button>
        </div>
      ) : (
        // Upload dropzone
        <div>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileInputChange}
              disabled={disabled || uploading}
            />

            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                </>
              ) : (
                <>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Görseli buraya sürükleyin veya tıklayın
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP, SVG (max {(maxSize / (1024 * 1024)).toFixed(1)}MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlInput(true)}
            disabled={disabled || uploading}
            className="w-full mt-2"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            veya URL girin
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
