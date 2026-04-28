import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const result = await sql`
    UPDATE products SET is_active = true
    WHERE sku LIKE 'r-%' AND is_active = false
    RETURNING id
  `
  console.log(`Aktif hale getirilen Reser ürünü: ${result.length}`)
}
main()
