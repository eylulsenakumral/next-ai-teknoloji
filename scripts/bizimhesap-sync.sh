#!/bin/bash
cd /home/tolgabrk/projects/next-ai-teknoloji
echo "[$(date)] BizimHesap sync başlatılıyor..."
npx tsx scripts/run-sync.ts >> scripts/crontab.log 2>&1
echo "[$(date)] BizimHesap sync tamamlandı." >> scripts/crontab.log
