import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  // Kolon zaten varsa sessizce geç
  const exists = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'margin_rate'
  `
  if (exists.length > 0) {
    console.log("margin_rate kolonu zaten mevcut, atlanıyor.")
    return
  }
  await sql`ALTER TABLE "suppliers" ADD COLUMN "margin_rate" DECIMAL(5,2) NOT NULL DEFAULT 30`
  console.log("✓ margin_rate kolonu eklendi (default: 30%)")

  // Eski hardcoded marjları ayarla
  const updates = [
    { code: "b2bdepo",    rate: 20 },
    { code: "ergen",      rate: 20 },
    { code: "NETEX",      rate: 15 },
    { code: "INDEXGRUP",  rate: 15 },
    { code: "TESAN",      rate: 15 },
    { code: "okisan",     rate: 10 },
    { code: "bizimhesap", rate: 10 },
    { code: "reser",      rate: 30 },
  ]
  for (const { code, rate } of updates) {
    await sql`UPDATE suppliers SET margin_rate = ${rate} WHERE code = ${code}`
  }
  console.log("✓ Mevcut tedarikçi marjları eski değerlere ayarlandı")

  // Sonucu göster
  const rows = await sql`SELECT code, name, margin_rate FROM suppliers ORDER BY code`
  console.table(rows)
}
main()
