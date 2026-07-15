import { config } from "dotenv"; config()
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
const cs = process.env.DATABASE_URL!
const pool = new Pool({ connectionString: cs, ssl: cs.includes("neon.tech") ? { rejectUnauthorized: false } : false })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
async function main() {
  const sp = await prisma.supplierProduct.count({ where: { supplier: { code: "b2bdepo" } } })
  const p = await prisma.product.count({ where: { metadata: { path: ["b2bdepo_id"], not: null } } })
  console.log("B2BDepo SupplierProduct:", sp)
  console.log("B2BDepo Product (metadata.b2bdepo_id):", p)
  const available = await prisma.supplierProduct.count({ where: { supplier: { code: "b2bdepo" }, isAvailable: true } })
  console.log("  Stokta olan:", available)
}
main().catch(e=>console.error(e)).finally(async()=>{await prisma.$disconnect();await pool.end()})
