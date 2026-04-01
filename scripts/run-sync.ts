import "dotenv/config"
import { syncProducts } from "../src/services/bizimhesap.service"

async function main() {
  const token = process.env.BIZIMHESAP_API_KEY
  if (!token) {
    console.error("[Sync] HATA: BIZIMHESAP_API_KEY ortam değişkeni ayarlanmamış.")
    process.exit(1)
  }
  console.log("[Sync] Başlatılıyor...")
  const result = await syncProducts(token)
  console.log("[Sync] Tamamlandı:", JSON.stringify(result, null, 2))
  process.exit(0)
}

main().catch((e) => {
  console.error("[Sync] HATA:", e.message)
  process.exit(1)
})
