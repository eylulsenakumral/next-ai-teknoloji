-- Batch 4: Cart/Wishlist/CartItem/WishlistItem cuid -> uuid @db.Uuid + Customer FK
--
-- DİKKAT (canlı deploy): cuid id'ler uuid'ye guvenli donusemez. Mevcut sepet/favori
-- verisi (gecici, cart/wishlist) TRUNCATE edilir. KALICI VERI KAYBI YOK -- siparis ve
-- teklif gecmisi OrderItem/QuoteItem snapshot'larinda sakli, cart'tan bagimsizdir.
-- Bayiler sepette/favorilerdeki urunleri yeniden ekler.
--
-- Test: Neon staging branch (staging-uuid-batch4) uzerinde dogrulandi.

TRUNCATE TABLE "cart_items", "wishlist_items", "carts", "wishlists" RESTART IDENTITY CASCADE;

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cart_id_fkey";
-- DropForeignKey
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_wishlist_id_fkey";
-- AlterTable
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "cart_id",
ADD COLUMN     "cart_id" UUID NOT NULL,
ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");
-- AlterTable
ALTER TABLE "carts" DROP CONSTRAINT "carts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");
-- AlterTable
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "wishlist_id",
ADD COLUMN     "wishlist_id" UUID NOT NULL,
ADD CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id");
-- AlterTable
ALTER TABLE "wishlists" DROP CONSTRAINT "wishlists_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");
-- DropTable
DROP TABLE "playing_with_neon";
-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");
-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");
-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items"("wishlist_id", "product_id");
-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_key" ON "wishlists"("user_id");
-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
