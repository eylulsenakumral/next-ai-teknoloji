#!/bin/bash
# B2B Catalog Scraper - Cron Wrapper
# Runs the Python scraper and syncs results to the Next.js API
#
# Usage:
#   ./run-b2b-sync.sh           # Scrape all sites and sync to API
#   ./run-b2b-sync.sh ergen     # Scrape single site
#   ./run-b2b-sync.sh --test    # Test mode (single site, no full scan)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="/home/tolgabrk/.openclaw/venvs/scrapling/bin/python3"
LOG_DIR="$HOME/.b2b-catalog/logs"
API_URL="${B2B_API_URL:-http://localhost:3000/api/admin/scrapers/sync}"
SITE="${1:-all}"

mkdir -p "$LOG_DIR"

DATE=$(date +%Y-%m-%d_%H%M)
LOG_FILE="$LOG_DIR/b2b-sync-${DATE}.log"

echo "[$(date)] B2B Scraper starting (site=$SITE)" | tee "$LOG_FILE"

cd "$SCRIPT_DIR"

if [ "$SITE" = "--test" ]; then
    echo "[test] Running in test mode (ergen only)..." | tee -a "$LOG_FILE"
    $PYTHON -m b2b_scraper.scraper ergen --json 2>&1 | tee -a "$LOG_FILE"
else
    $PYTHON -m b2b_scraper.scraper "$SITE" --json --sync --api-url "$API_URL" 2>&1 | tee -a "$LOG_FILE"
fi

EXIT_CODE=$?
echo "[$(date)] B2B Scraper finished (exit=$EXIT_CODE)" | tee -a "$LOG_FILE"

# Cleanup logs older than 7 days
find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true

exit $EXIT_CODE
