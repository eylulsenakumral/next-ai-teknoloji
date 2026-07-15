import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  // B2BDepo mevcut margin
  const margins = await sql`SELECT code, name, margin_rate FROM suppliers ORDER BY code`
  console.log("Tedarikçi marjları:")
  console.table(margins)

  // HIKVISION ürünü bul
  const product = await sql`
    SELECT sp.external_name, sp.purchase_price, sp.currency, s.code, s.margin_rate,
           (sp.purchase_price * (1 + s.margin_rate/100))::numeric(10,2) AS expected_price
    FROM supplier_products sp
    JOIN suppliers s ON s.id = sp.supplier_id
    WHERE sp.external_name ILIKE '%DS-T4664%'
    LIMIT 5
  `
  console.log("\nHIKVISION DS-T4664 ürünü:")
  console.table(product)
}
main()
