import { z } from "zod"

// ---------------------------------------------------------------------------
// CampaignSetType enum - schema ile sync
// ---------------------------------------------------------------------------
const CampaignSetTypeEnum = z.enum(["OUTLET", "FEATURED", "BUNDLE"])

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export const createCampaignSetSchema = z.object({
  name: z
    .string()
    .min(1, "Set adı zorunlu")
    .max(255, "Set adı en fazla 255 karakter olabilir"),
  description: z.string().optional().nullable(),
  imageUrl: z
    .string()
    .url("Geçerli bir görsel URL girin")
    .optional()
    .nullable(),
  type: CampaignSetTypeEnum.default("BUNDLE"),
  discountPct: z
    .number()
    .min(0, "İndirim oranı negatif olamaz")
    .max(100, "İndirim oranı 100'den büyük olamaz")
    .optional()
    .nullable(),
  price: z
    .number()
    .nonnegative("Fiyat negatif olamaz")
    .optional()
    .nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  minPurchaseAmount: z
    .number()
    .nonnegative("Minimum satın alma tutarı negatif olamaz")
    .optional()
    .nullable(),
  maxUsageCount: z
    .number()
    .int("Kullanım limiti tam sayı olmalı")
    .positive("Kullanım limiti 0'dan büyük olmalı")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

// ---------------------------------------------------------------------------
// Update (partial)
// ---------------------------------------------------------------------------
export const updateCampaignSetSchema = createCampaignSetSchema.partial()

// ---------------------------------------------------------------------------
// Add product to set
// ---------------------------------------------------------------------------
export const addProductToSetSchema = z.object({
  productId: z.string().uuid("Geçersiz ürün ID"),
  quantity: z
    .number()
    .int("Miktar tam sayı olmalı")
    .positive("Miktar 0'dan büyük olmalı")
    .default(1),
  sortOrder: z.number().int().default(0),
  label: z
    .string()
    .max(255, "Etiket en fazla 255 karakter olabilir")
    .optional()
    .nullable(),
})

// ---------------------------------------------------------------------------
// Update set product metadata
// ---------------------------------------------------------------------------
export const updateSetProductSchema = z.object({
  quantity: z
    .number()
    .int("Miktar tam sayı olmalı")
    .positive("Miktar 0'dan büyük olmalı")
    .optional(),
  sortOrder: z.number().int().optional(),
  label: z
    .string()
    .max(255, "Etiket en fazla 255 karakter olabilir")
    .optional()
    .nullable(),
})

// ---------------------------------------------------------------------------
// Filter schema
// ---------------------------------------------------------------------------
export const campaignSetFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: CampaignSetTypeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

export type CreateCampaignSetInput = z.infer<typeof createCampaignSetSchema>
export type UpdateCampaignSetInput = z.infer<typeof updateCampaignSetSchema>
export type AddProductToSetInput = z.infer<typeof addProductToSetSchema>
export type UpdateSetProductInput = z.infer<typeof updateSetProductSchema>
export type CampaignSetFilterInput = z.infer<typeof campaignSetFilterSchema>
