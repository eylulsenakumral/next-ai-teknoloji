import "dotenv/config"
import { syncProducts } from "../src/services/b2bdepo-xml.service"

async function main() {
  console.log("[B2BDepo Neon Sync] Başlatılıyor...")
  console.log("[B2BDepo Neon Sync] DB:", process.env.DATABASE_URL?.replace(/:.*@/, ":*****@"))
  const startTime = Date.now()
  const result = await syncProducts()
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log("\n[B2BDepo Neon Sync] Tamamlandı!")
  console.log("─────────────────────────")
  console.log(`  Synced  : ${result.synced}`)
  console.log(`  Created : ${result.created}`)
  console.log(`  Updated : ${result.updated}`)
  console.log(`  Errors  : ${result.errors}`)
  console.log(`  Süre    : ${duration}s`)
  console.log("─────────────────────────")
  process.exit(result.errors > 0 && result.synced === 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("[B2BDepo Neon Sync] KRİTİK HATA:", e.message)
  process.exit(1)
})
