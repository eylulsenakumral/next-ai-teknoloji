import { z } from "zod"

// ---------------------------------------------------------------------------
// Unit enum - schema ile sync
// ---------------------------------------------------------------------------
const UnitEnum = z.enum(["ADET", "KUTU", "PAKET", "KOLI", "METRE", "KILOGRAM"])

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export const createProductSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunlu").max(500, "Ürün adı en fazla 500 karakter olabilir"),
  brandId: z.string().uuid("Geçersiz marka ID").optional().nullable(),
  categoryId: z.string().uuid("Geçersiz kategori ID").optional().nullable(),
  barcode: z.string().max(100, "Barkod en fazla 100 karakter").optional().nullable(),
  sku: z.string().max(100, "SKU en fazla 100 karakter").optional().nullable(),
  modelCode: z.string().max(255, "Model kodu en fazla 255 karakter").optional().nullable(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().max(1000, "Kısa açıklama en fazla 1000 karakter").optional().nullable(),
  specs: z.record(z.string(), z.string()).optional().nullable(),
  images: z.array(z.string().url("Geçerli bir görsel URL girin")).default([]),
  manualPrice: z.number().nonnegative("Fiyat negatif olamaz").optional().nullable(),
  manualPriceCurrency: z.enum(["TRY", "USD", "EUR"]).optional().nullable(),
  weight: z
    .number()
    .nonnegative("Ağırlık negatif olamaz")
    .optional()
    .nullable(),
  dimensions: z
    .object({
      length: z.number().nonnegative().optional(),
      width: z.number().nonnegative().optional(),
      height: z.number().nonnegative().optional(),
      unit: z.enum(["cm", "mm", "m"]).default("cm"),
    })
    .optional()
    .nullable(),
  warrantyMonths: z
    .number()
    .int("Garanti süresi tam sayı olmalı")
    .nonnegative("Garanti süresi negatif olamaz")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isOutlet: z.boolean().default(false),
  minOrderQuantity: z.number().int().positive("Minimum sipariş adedi 1 veya üzeri olmalı").default(1),
  unit: UnitEnum.default("ADET"),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

// ---------------------------------------------------------------------------
// Update (partial)
// ---------------------------------------------------------------------------
export const updateProductSchema = createProductSchema.partial()

// ---------------------------------------------------------------------------
// Bulk update
// ---------------------------------------------------------------------------
export const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "En az bir ürün seçmelisiniz"),
  action: z.enum(["activate", "deactivate", "delete", "update_margin", "duplicate"]),
  value: z.number().optional(), // margin değeri için
})

// ---------------------------------------------------------------------------
// Filter / list query
// ---------------------------------------------------------------------------
export const productFilterSchema = z.object({
  search: z.string().optional(),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  isFeatured: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : undefined)),
  isNew: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : undefined)),
  isOutlet: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : undefined)),
  inStock: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  minPrice: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  sortBy: z
    .enum(["name", "createdAt", "updatedAt", "viewCount"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, Number(v ?? "1"))),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(100, Math.max(1, Number(v ?? "25")))),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>
export type ProductFilter = z.infer<typeof productFilterSchema>
