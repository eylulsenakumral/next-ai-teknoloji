import { z } from "zod"

export const dealerApplicationSchema = z.object({
  companyName: z
    .string()
    .min(2, "Firma adı en az 2 karakter olmalı")
    .max(500, "Firma adı en fazla 500 karakter olabilir"),
  contactName: z
    .string()
    .min(2, "Yetkili adı en az 2 karakter olmalı")
    .max(255, "Yetkili adı en fazla 255 karakter olabilir"),
  phone: z
    .string()
    .min(10, "Geçerli bir telefon numarası girin")
    .max(50, "Telefon numarası çok uzun")
    .regex(/^[0-9\s\+\-\(\)]+$/, "Geçerli bir telefon numarası girin"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  taxOffice: z
    .string()
    .min(2, "Vergi dairesi en az 2 karakter olmalı")
    .max(255, "Vergi dairesi çok uzun")
    .optional()
    .or(z.literal("")),
  taxNumber: z
    .string()
    .min(10, "Vergi numarası 10 haneli olmalı")
    .max(11, "Vergi numarası en fazla 11 haneli olabilir")
    .regex(/^\d+$/, "Vergi numarası sadece rakam içermeli")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .min(10, "Adres en az 10 karakter olmalı")
    .max(2000, "Adres çok uzun")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(2, "İl en az 2 karakter olmalı")
    .max(100, "İl adı çok uzun")
    .optional()
    .or(z.literal("")),
  taxCertificateUrl: z
    .string()
    .url("Geçerli bir URL girin")
    .optional()
    .or(z.literal("")),
  businessType: z
    .string()
    .min(2, "Faaliyet alanı seçin")
    .max(255, "Faaliyet alanı çok uzun")
    .optional()
    .or(z.literal("")),
  referenceInfo: z
    .string()
    .max(2000, "Referans bilgisi çok uzun")
    .optional()
    .or(z.literal("")),
  kvkkConsent: z.boolean().refine((val) => val === true, {
    message: "KVKK aydınlatma metnini onaylamanız zorunludur",
  }),
})

export const updateCustomerSchema = z.object({
  companyName: z.string().min(2).max(500).optional().nullable(),
  tradeName: z.string().max(500).optional().or(z.literal("")).nullable(),
  contactName: z.string().max(255).optional().or(z.literal("")).nullable(),
  contactTitle: z.string().max(100).optional().or(z.literal("")).nullable(),
  phone: z.string().max(50).optional().or(z.literal("")).nullable(),
  phone2: z.string().max(50).optional().or(z.literal("")).nullable(),
  email: z.string().email("Geçerli bir e-posta girin").optional().or(z.literal("")).nullable(),
  taxOffice: z.string().max(255).optional().or(z.literal("")).nullable(),
  taxNumber: z.string().max(20).optional().or(z.literal("")).nullable(),
  address: z.string().max(2000).optional().or(z.literal("")).nullable(),
  city: z.string().max(100).optional().or(z.literal("")).nullable(),
  district: z.string().max(100).optional().or(z.literal("")).nullable(),
  postalCode: z.string().max(10).optional().or(z.literal("")).nullable(),
  whatsappPhone: z.string().max(50).optional().or(z.literal("")).nullable(),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "BLACKLISTED"])
    .optional(),
  creditLimit: z
    .number()
    .min(0, "Kredi limiti negatif olamaz")
    .max(10_000_000, "Kredi limiti çok yüksek")
    .optional()
    .nullable(),
  discountRate: z
    .number()
    .min(0, "İskonto oranı negatif olamaz")
    .max(100, "İskonto oranı %100'den fazla olamaz")
    .optional()
    .nullable(),
  notes: z.string().max(5000).optional().or(z.literal("")).nullable(),
  priceListId: z.string().uuid().optional().nullable(),
  taxCertificateUrl: z
    .string()
    .url("Geçerli bir URL girin")
    .optional()
    .or(z.literal(""))
    .nullable(),
})

export const balanceAdjustmentSchema = z.object({
  amount: z
    .number()
    .refine((v) => v !== 0, "Tutar sıfır olamaz")
    .refine(
      (v) => Math.abs(v) <= 1_000_000,
      "Tutar 1.000.000 TL'den fazla olamaz"
    ),
  description: z
    .string()
    .min(3, "Açıklama en az 3 karakter olmalı")
    .max(500, "Açıklama en fazla 500 karakter olabilir"),
  type: z.enum(["ADJUSTMENT", "OPENING_BALANCE", "PAYMENT", "REFUND"] as const, {
    error: "Geçerli bir hareket türü seçin",
  }),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre zorunlu"),
    newPassword: z
      .string()
      .min(6, "Yeni şifre en az 6 karakter olmalı")
      .max(100, "Şifre çok uzun"),
    confirmPassword: z.string().min(1, "Şifre tekrarı zorunlu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  })

export type DealerApplicationInput = z.infer<typeof dealerApplicationSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type BalanceAdjustmentInput = z.infer<typeof balanceAdjustmentSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
