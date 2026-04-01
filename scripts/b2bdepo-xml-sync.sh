#!/bin/bash
# B2BDepo ProductList XML Sync - Günde 1 kez (06:00)
# Tam ürün senkronizasyonu (kategori, marka, resim, fiyat, stok)

cd /home/tolgabrk/projects/next-ai-teknoloji || exit 1

LOG_DIR="logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/b2bdepo-xml-sync.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

export PATH="/home/tolgabrk/.nvm/versions/node/v22.22.0/bin:$PATH"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nextai"
export SCRAPER_B2BDEPO_BAYI_KODU="30365"

echo "[$TIMESTAMP] ProductList sync başlatılıyor..." >> "$LOG_FILE"

npx tsx -e "
import { syncProducts } from './src/services/b2bdepo-xml.service';
async function main() {
  const result = await syncProducts();
  console.log(JSON.stringify({ success: true, ...result }));
}
main().catch(e => {
  console.log(JSON.stringify({ success: false, error: e.message }));
  process.exit(1);
});
" >> "$LOG_FILE" 2>&1

TIMESTAMP2=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP2] ProductList sync tamamlandı." >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
