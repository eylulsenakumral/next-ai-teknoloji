"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/image-upload"
import {
  SIM_PACKAGES,
  type CreateSimSaleInput,
} from "@/lib/validators/sim-sale"

interface SimSaleFormData {
  buyerName: string
  contactPhone: string
  simPhoneNumber: string
  tcNumber: string
  idPhotoUrl: string
  package: "GB5" | "GB8" | "GB15"
  purchaseDate: string // YYYY-MM-DD (input type=date)
}

interface SimSaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<SimSaleFormData> & { id?: string }
  onSuccess: () => void
}

const defaultForm: SimSaleFormData = {
  buyerName: "",
  contactPhone: "",
  simPhoneNumber: "",
  tcNumber: "",
  idPhotoUrl: "",
  package: "GB5",
  purchaseDate: new Date().toISOString().slice(0, 10),
}

interface FieldErrors {
  buyerName?: string[]
  contactPhone?: string[]
  simPhoneNumber?: string[]
  tcNumber?: string[]
  idPhotoUrl?: string[]
  package?: string[]
  purchaseDate?: string[]
}

export function SimSaleForm({ open, onOpenChange, initialData, onSuccess }: SimSaleFormProps) {
  const [form, setForm] = useState<SimSaleFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string>("")
  const isEditing = Boolean(initialData?.id)

  useEffect(() => {
    if (open) {
      setForm({
        buyerName: initialData?.buyerName ?? "",
        contactPhone: initialData?.contactPhone ?? "",
        simPhoneNumber: initialData?.simPhoneNumber ?? "",
        tcNumber: initialData?.tcNumber ?? "",
        idPhotoUrl: initialData?.idPhotoUrl ?? "",
        package: initialData?.package ?? "GB5",
        purchaseDate:
          initialData?.purchaseDate ?? new Date().toISOString().slice(0, 10),
      })
      setErrors({})
      setServerError("")
    }
  }, [open, initialData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setServerError("")

    const payload: CreateSimSaleInput = {
      buyerName: form.buyerName,
      contactPhone: form.contactPhone,
      simPhoneNumber: form.simPhoneNumber || undefined,
      tcNumber: form.tcNumber || undefined,
      idPhotoUrl: form.idPhotoUrl || undefined,
      package: form.package,
      purchaseDate: form.purchaseDate,
    }

    const url = isEditing
      ? `/api/admin/sim-sales/${initialData!.id}`
      : "/api/admin/sim-sales"
    const method = isEditing ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (json.details) {
        setErrors(json.details as FieldErrors)
      } else {
        setServerError(json.error ?? "Bir hata oluştu.")
      }
      return
    }

    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "SIM Satışını Düzenle" : "Yeni SIM Satışı"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sim-name">
              Ad Soyad <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sim-name"
              value={form.buyerName}
              onChange={(e) =>
                setForm((p) => ({ ...p, buyerName: e.target.value }))
              }
              placeholder="Örn: Ahmet Yılmaz"
              aria-invalid={Boolean(errors.buyerName)}
              required
            />
            {errors.buyerName && (
              <p className="text-xs text-destructive">{errors.buyerName[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-contact">
              İletişim No <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sim-contact"
              value={form.contactPhone}
              onChange={(e) =>
                setForm((p) => ({ ...p, contactPhone: e.target.value }))
              }
              placeholder="05XX XXX XX XX"
              aria-invalid={Boolean(errors.contactPhone)}
              required
            />
            {errors.contactPhone && (
              <p className="text-xs text-destructive">{errors.contactPhone[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-phone">Hat Telefon No</Label>
            <Input
              id="sim-phone"
              value={form.simPhoneNumber}
              onChange={(e) =>
                setForm((p) => ({ ...p, simPhoneNumber: e.target.value }))
              }
              placeholder="Hattın kendi numarası"
              aria-invalid={Boolean(errors.simPhoneNumber)}
            />
            {errors.simPhoneNumber && (
              <p className="text-xs text-destructive">
                {errors.simPhoneNumber[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-tc">TC Kimlik No</Label>
            <Input
              id="sim-tc"
              value={form.tcNumber}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  tcNumber: e.target.value.replace(/\D/g, "").slice(0, 11),
                }))
              }
              placeholder="11 haneli TC kimlik no"
              inputMode="numeric"
              maxLength={11}
              aria-invalid={Boolean(errors.tcNumber)}
            />
            {errors.tcNumber && (
              <p className="text-xs text-destructive">{errors.tcNumber[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-package">
              Paket <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.package}
              onValueChange={(v) =>
                setForm((p) => ({
                  ...p,
                  package: v as SimSaleFormData["package"],
                }))
              }
            >
              <SelectTrigger id="sim-package">
                <SelectValue placeholder="Paket seçin" />
              </SelectTrigger>
              <SelectContent>
                {SIM_PACKAGES.map((pkg) => (
                  <SelectItem key={pkg.value} value={pkg.value}>
                    {pkg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.package && (
              <p className="text-xs text-destructive">{errors.package[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-date">
              Satın Alma Tarihi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sim-date"
              type="date"
              value={form.purchaseDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, purchaseDate: e.target.value }))
              }
              aria-invalid={Boolean(errors.purchaseDate)}
              required
            />
            {errors.purchaseDate && (
              <p className="text-xs text-destructive">
                {errors.purchaseDate[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Bitiş tarihi, satın alma tarihinden 1 yıl sonrası olarak otomatik
              hesaplanır.
            </p>
          </div>

          <div className="space-y-1.5">
            <ImageUpload
              value={form.idPhotoUrl}
              onChange={(url) => setForm((p) => ({ ...p, idPhotoUrl: url }))}
              label="Kimlik Fotoğrafı (opsiyonel)"
              maxSize={5 * 1024 * 1024} // 5MB
              accept="image/jpeg,image/png,image/webp"
              folder="sim-id-photos"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Eklenmeden de kaydedilebilir.
            </p>
            {errors.idPhotoUrl && (
              <p className="text-xs text-destructive">{errors.idPhotoUrl[0]}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
