#!/bin/bash
# Reser XML → Neon DB lokal sync (Vercel IP'ler bloklandığı için lokal çalışır)
cd /home/tolgabrk/projects/next-ai-teknoloji
DOTENV_CONFIG_PATH=.env.production \
  /home/tolgabrk/.nvm/versions/node/v22.22.2/bin/npx tsx scripts/sync-reser-neon.ts
