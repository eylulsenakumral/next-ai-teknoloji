#!/usr/bin/env node
// ============================================================================
// WhatsApp Worker — Baileys Client Runner
// Run with: npx tsx workers/whatsapp/worker.ts
// Or with PM2: pm2 start workers/whatsapp/worker.js --name whatsapp-worker
// ============================================================================
import "dotenv/config";
import { connectWhatsApp, disconnectWhatsApp, getConnectionStatus, getLatestQR, onConnectionChange } from "./client";

const WORKER_INTERVAL = 30000; // 30 saniye

async function main() {
  console.log("🚀 WhatsApp Worker başlatılıyor...");

  // Bağlantı durumu değişikliklerini dinle
  onConnectionChange((status, qr) => {
    console.log(`[WhatsApp] Durum: ${status}`);
    if (qr) {
      console.log("[WhatsApp] QR Kod mevcut - Taratmak için: /api/whatsapp/qrcode");
    }
  });

  // Bağlan
  try {
    await connectWhatsApp();
    console.log("✅ WhatsApp bağlandı");
  } catch (err) {
    console.error("❌ WhatsApp bağlantı hatası:", err);
  }

  // Periyodik durum logla - reconnect client.ts'deki connection.update halleder
  setInterval(async () => {
    const status = getConnectionStatus();

    if (status === "connected") {
      console.log(`[WhatsApp] ✅ Bağlı - ${new Date().toLocaleTimeString("tr-TR")}`);
    } else if (status === "disconnected") {
      console.log("[WhatsApp] ⚠️ Bağlantı yok - manuel reconnect deneniyor...");
      try {
        await connectWhatsApp();
      } catch (err) {
        console.error("[WhatsApp] Yeniden bağlanma hatası:", err);
      }
    }
    // "connecting" durumunda bir şey yapma - zaten deniyor
  }, WORKER_INTERVAL);
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 WhatsApp Worker kapatılıyor...");
  await disconnectWhatsApp();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 WhatsApp Worker kapatılıyor...");
  await disconnectWhatsApp();
  process.exit(0);
});

main().catch(console.error);