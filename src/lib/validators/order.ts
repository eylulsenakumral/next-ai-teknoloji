import { z } from "zod"

// ---------------------------------------------------------------------------
// Ortak alanlar
// ---------------------------------------------------------------------------

const shippingAddressSchema = z.object({
  companyName: z.string().min(2, "Firma adı en az 2 karakter olmalı").max(500),
  contactName: z.string().min(2, "Yetkili adı en az 2 karakter olmalı").max(255),
  phone: z
    .string()
    .min(10, "Geçerli bir telefon numarası girin")
    .max(50)
    .regex(/^[0-9\s+\-()+]+$/, "Geçerli bir telefon numarası girin"),
  address: z.string().min(10, "Adres en az 10 karakter olmalı").max(2000),
  city: z.string().min(2, "İl en az 2 karakter olmalı").max(100),
  district: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(10).optional().or(z.literal("")),
  country: z.string().length(2).default("TR"),
})

// ---------------------------------------------------------------------------
// Sipariş oluşturma
// ---------------------------------------------------------------------------

const orderItemInputSchema = z.object({
  productId: z.string().uuid("Geçerli bir ürün ID girin"),
  quantity: z
    .number()
    .int("Adet tam sayı olmalı")
    .min(1, "Adet en az 1 olmalı")
    .max(9999, "Adet çok yüksek"),
})

export const createOrderSchema = z.object({
  items: z
    .array(orderItemInputSchema)
    .min(1, "En az 1 ürün eklemelisiniz")
    .max(200, "Sipariş en fazla 200 kalem içerebilir"),
  shippingAddress: shippingAddressSchema.optional(),
  notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").optional().or(z.literal("")),
  paymentMethod: z.enum(["BANK_TRANSFER", "ON_ACCOUNT", "CREDIT_CARD"], {
    error: "Geçerli bir ödeme yöntemi seçin",
  }),
})

// ---------------------------------------------------------------------------
// Sipariş durumu güncelleme (Admin)
// ---------------------------------------------------------------------------

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"],
    { error: "Geçerli bir sipariş durumu seçin" }
  ),
  adminNotes: z
    .string()
    .max(2000, "Admin notu en fazla 2000 karakter olabilir")
    .optional()
    .or(z.literal("")),
  shippingTrackingNumber: z
    .string()
    .max(255)
    .optional()
    .or(z.literal("")),
  shippingCarrier: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
})

// ---------------------------------------------------------------------------
// Sipariş iptal (Bayi)
// ---------------------------------------------------------------------------

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(5, "İptal sebebi en az 5 karakter olmalı")
    .max(1000, "İptal sebebi en fazla 1000 karakter olabilir"),
})

// ---------------------------------------------------------------------------
// Export tipleri
// ---------------------------------------------------------------------------

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>
