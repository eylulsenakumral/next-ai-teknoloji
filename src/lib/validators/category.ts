import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(1, "Kategori adı zorunlu").max(200, "Kategori adı en fazla 200 karakter olabilir"),
  slug: z.string().optional(),
  parentId: z.string().uuid("Geçersiz üst kategori ID").optional().nullable(),
  description: z.string().optional(),
  imageUrl: z.string().url("Geçerli bir URL girin").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const updateCategorySchema = createCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
