#!/bin/bash
# Tüm tedarikçileri Neon DB'ye senkronize eder.
# Systemd timer tarafından sabah 06:00 ve akşam 18:00'de çalıştırılır.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$SCRIPT_DIR/crontab.log"

cd "$PROJECT_DIR"

# Neon DATABASE_URL'yi yükle (.env.sync varsa, yoksa .env'deki NEON URL'yi kullan)
if [ -f "$PROJECT_DIR/.env.sync" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env.sync" | xargs)
fi

if [ -z "${DATABASE_URL:-}" ] || echo "$DATABASE_URL" | grep -q "localhost"; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] HATA: DATABASE_URL Neon URL'si değil, çıkılıyor." | tee -a "$LOG_FILE"
  exit 1
fi

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================"
log "NEON SYNC BAŞLADI"
log "DB: $(echo $DATABASE_URL | sed 's/:.*@/:*****@/')"
log "========================================"

# Reser (XML API)
log "--- Reser sync başlıyor ---"
DATABASE_URL="$DATABASE_URL" npx tsx scripts/sync-reser-neon.ts 2>&1 | tee -a "$LOG_FILE" || log "Reser BAŞARISIZ (devam ediliyor)"

# Okisan (XML API)
log "--- Okisan sync başlıyor ---"
DATABASE_URL="$DATABASE_URL" npx tsx scripts/sync-okisan.ts 2>&1 | tee -a "$LOG_FILE" || log "Okisan BAŞARISIZ (devam ediliyor)"

# B2BDepo XML (API)
log "--- B2BDepo XML sync başlıyor ---"
DATABASE_URL="$DATABASE_URL" npx tsx scripts/sync-b2bdepo-neon.ts 2>&1 | tee -a "$LOG_FILE" || log "B2BDepo BAŞARISIZ (devam ediliyor)"

log "========================================"
log "NEON SYNC TAMAMLANDI"
log "========================================"
