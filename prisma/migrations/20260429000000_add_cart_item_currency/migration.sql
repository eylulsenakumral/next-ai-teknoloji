-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "price_currency" VARCHAR(10) NOT NULL DEFAULT 'TRY';
