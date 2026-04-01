import { z } from "zod"

export const createBrandSchema = z.object({
  name: z.string().min(1, "Marka adı zorunlu").max(200, "Marka adı en fazla 200 karakter olabilir"),
  slug: z.string().optional(),
  logoUrl: z.string().url("Geçerli bir URL girin").optional().or(z.literal("")),
  description: z.string().optional(),
  websiteUrl: z.string().url("Geçerli bir URL girin").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const updateBrandSchema = createBrandSchema.partial()

export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>
