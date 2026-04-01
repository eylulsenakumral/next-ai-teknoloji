import "dotenv/config"
import { syncOkisanProducts } from "../src/services/okisan.service"

async function main() {
  console.log("[Okisan Sync] Başlatılıyor...")
  const startTime = Date.now()

  const result = await syncOkisanProducts()

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log("\n[Okisan Sync] Tamamlandı!")
  console.log("─────────────────────────")
  console.log(`  Toplam synced : ${result.synced}`)
  console.log(`  Yeni oluşturulan : ${result.created}`)
  console.log(`  Güncellenen   : ${result.updated}`)
  console.log(`  Atlanan       : ${result.skipped}`)
  console.log(`  Hata          : ${result.errors}`)
  console.log(`  Süre          : ${duration}s`)
  console.log("─────────────────────────")

  process.exit(result.errors > 0 && result.synced === 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("[Okisan Sync] KRİTİK HATA:", e instanceof Error ? e.message : String(e))
  process.exit(1)
})
