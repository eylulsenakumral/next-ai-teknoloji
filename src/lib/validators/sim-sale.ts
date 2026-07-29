import { z } from "zod"

export const SIM_PACKAGES = [
  { value: "GB5", label: "5 GB" },
  { value: "GB8", label: "8 GB" },
  { value: "GB15", label: "15 GB" },
] as const

export const SIM_PACKAGE_LABELS: Record<string, string> = Object.fromEntries(
  SIM_PACKAGES.map((p) => [p.value, p.label])
)

export const createSimSaleSchema = z.object({
  buyerName: z
    .string()
    .min(1, "Ad soyad zorunlu")
    .max(255, "Ad soyad en fazla 255 karakter olabilir"),
  contactPhone: z
    .string()
    .min(1, "İletişim no zorunlu")
    .max(50, "İletişim no en fazla 50 karakter olabilir"),
  simPhoneNumber: z
    .string()
    .max(50, "Hat telefon no en fazla 50 karakter olabilir")
    .optional()
    .or(z.literal("")),
  tcNumber: z
    .string()
    .max(11, "TC kimlik no 11 karakter olmalıdır")
    .optional()
    .or(z.literal("")),
  idPhotoUrl: z.string().optional().or(z.literal("")),
  package: z.enum(["GB5", "GB8", "GB15"]),
  purchaseDate: z
    .string()
    .min(1, "Satın alma tarihi zorunlu")
    .refine((v) => !isNaN(Date.parse(v)), "Geçerli bir tarih girin"),
  customerId: z.string().uuid().optional().nullable(),
})

export const updateSimSaleSchema = createSimSaleSchema.partial()

export type CreateSimSaleInput = z.infer<typeof createSimSaleSchema>
export type UpdateSimSaleInput = z.infer<typeof updateSimSaleSchema>
