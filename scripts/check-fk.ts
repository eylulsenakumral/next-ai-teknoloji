import "dotenv/config"
import { prisma } from "../src/lib/db"

async function main() {
  const refs = {
    orderItems: await prisma.orderItem.count(),
    cartItems: await prisma.cartItem.count(),
    priceListItems: await prisma.priceListItem.count(),
    wishlistItems: await prisma.wishlistItem.count(),
    productTags: await prisma.productTag.count(),
    campaignSetProducts: await prisma.campaignSetProduct.count(),
    productCategories: await prisma.productCategory.count(),
  }

  console.log("=== ÜRÜN FK BAĞIMLILIKLARI ===")
  for (const [k, v] of Object.entries(refs)) {
    console.log(`  ${k}: ${v}`)
  }

  const suppliers = await prisma.supplier.findMany({ select: { id: true, code: true, name: true } })
  console.log("\nSuppliers:", JSON.stringify(suppliers))

  await prisma.$disconnect()
}
main()
