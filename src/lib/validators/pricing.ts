import { z } from "zod"

export const createMarginSchema = z.object({
  scope: z.enum(["GLOBAL", "CATEGORY", "BRAND", "PRODUCT", "CUSTOMER"]),
  scopeId: z.string().uuid("Geçerli bir ID girin").optional().nullable(),
  marginPct: z
    .number()
    .min(0, "Marj 0'dan küçük olamaz")
    .max(1000, "Marj 1000'den büyük olamaz"),
  minMarginPct: z
    .number()
    .min(0, "Minimum marj 0'dan küçük olamaz")
    .optional()
    .nullable(),
  maxMarginPct: z
    .number()
    .min(0, "Maksimum marj 0'dan küçük olamaz")
    .optional()
    .nullable(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000, "Not en fazla 1000 karakter olabilir").optional().nullable(),
})

export const updateMarginSchema = createMarginSchema.partial()

export const simulatePriceSchema = z.object({
  purchasePrice: z
    .number()
    .positive("Alış fiyatı 0'dan büyük olmalı"),
  marginPct: z
    .number()
    .min(0, "Marj 0'dan küçük olamaz")
    .max(1000, "Marj 1000'den büyük olamaz"),
  vatRate: z
    .number()
    .min(0, "KDV oranı 0'dan küçük olamaz")
    .max(100, "KDV oranı 100'den büyük olamaz")
    .default(20),
})

export const calculatePriceSchema = z.union([
  z.object({
    productId: z.string().uuid("Geçerli bir ürün ID'si girin"),
    purchasePrice: z.undefined().optional(),
    marginPct: z.undefined().optional(),
    vatRate: z.undefined().optional(),
  }),
  z.object({
    productId: z.undefined().optional(),
    purchasePrice: z.number().positive("Alış fiyatı 0'dan büyük olmalı"),
    marginPct: z.number().min(0).max(1000),
    vatRate: z.number().min(0).max(100).default(20),
  }),
])

export type CreateMarginInput = z.infer<typeof createMarginSchema>
export type UpdateMarginInput = z.infer<typeof updateMarginSchema>
export type SimulatePriceInput = z.infer<typeof simulatePriceSchema>
