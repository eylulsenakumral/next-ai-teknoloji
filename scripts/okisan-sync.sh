#!/bin/bash
cd /home/tolgabrk/projects/next-ai-teknoloji
echo "[$(date)] Okisan sync başlatılıyor..."
npx tsx scripts/sync-okisan.ts >> scripts/crontab.log 2>&1
echo "[$(date)] Okisan sync tamamlandı." >> scripts/crontab.log
