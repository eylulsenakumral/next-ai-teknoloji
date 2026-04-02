// ============================================================================
// WhatsApp Client — whatsapp-web.js (Puppeteer) — Stable Connection
// ============================================================================
import WhatsAppWeb from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = WhatsAppWeb;
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import type { ConnectionStatus } from "./types";

// Shared state file for inter-process communication
const STATE_FILE = "./.whatsapp-state.json";

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------
let client: InstanceType<typeof Client> | null = null;
let connectionStatus: ConnectionStatus = "disconnected";
let latestQR: string | null = null;
let connectionListeners: Array<(status: ConnectionStatus, qr?: string | null) => void> = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

export function getLatestQR(): string | null {
  return latestQR;
}

export function getSocket() {
  return client;
}

export function onConnectionChange(
  cb: (status: ConnectionStatus, qr?: string | null) => void,
): () => void {
  connectionListeners.push(cb);
  return () => {
    connectionListeners = connectionListeners.filter((l) => l !== cb);
  };
}

function notifyListeners(status: ConnectionStatus, qr?: string | null) {
  connectionStatus = status;
  latestQR = qr ?? null;
  connectionListeners.forEach((cb) => cb(status, qr));

  // State'i dosyaya yaz (Next.js API route okuyabilmesi için)
  try {
    writeFileSync(STATE_FILE, JSON.stringify({ status: connectionStatus, qr: latestQR, updatedAt: Date.now() }));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------
export async function connectWhatsApp(): Promise<InstanceType<typeof Client>> {
  if (client && connectionStatus === "connected") {
    return client;
  }

  // Eski client'ı temizle
  if (client) {
    try { await client.destroy(); } catch { /* ignore */ }
    client = null;
  }

  notifyListeners("connecting");

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: "./.whatsapp-session",
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
    },
    webVersionCache: {
      type: "local",
    },
  });

  // --- Events ---

  client.on("qr", (qr: string) => {
    console.log("[WhatsApp] QR kod oluşturuldu");
    notifyListeners("qr_ready", qr);
  });

  client.on("ready", () => {
    console.log("[WhatsApp] Bağlantı başarılı!");
    notifyListeners("connected");
  });

  client.on("disconnected", (reason: string) => {
    console.log(`[WhatsApp] Bağlantı koptu: ${reason}`);
    client = null;
    notifyListeners("disconnected");
  });

  client.on("auth_failure", (msg: string) => {
    console.error(`[WhatsApp] Auth hatası: ${msg}`);
    notifyListeners("disconnected");
  });

  client.on("message", async (msg: WhatsAppWeb.Message) => {
    // Kendi mesajlarımızı ve grup mesajlarını yoksay
    if (msg.fromMe) return;
    if (msg.from.includes("@g.us")) return;

    console.log(`[WhatsApp] Mesaj from: ${msg.from}, body: ${(msg.body || "").substring(0, 50)}`);

    try {
      const { handleWWebMessage } = await import("./handler");
      await handleWWebMessage(client!, msg);
    } catch (err) {
      console.error("[WhatsApp] Mesaj işleme hatası:", err);
    }
  });

  await client.initialize();
  return client;
}

// ---------------------------------------------------------------------------
// Disconnect
// ---------------------------------------------------------------------------
export async function disconnectWhatsApp(): Promise<void> {
  if (client) {
    try { await client.destroy(); } catch { /* ignore */ }
    client = null;
  }
  notifyListeners("disconnected");
}

// ---------------------------------------------------------------------------
// Send message helpers
// ---------------------------------------------------------------------------
export async function sendTextMessage(to: string, text: string): Promise<string | null> {
  if (!client) throw new Error("WhatsApp not connected");

  // whatsapp-web.js chatId format: 905551234567@c.us
  const chatId = to.includes("@") ? to : `${to}@c.us`;
  const msg = await client.sendMessage(chatId, text);
  return msg.id?._serialized ?? null;
}

export async function sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<string | null> {
  if (!client) throw new Error("WhatsApp not connected");

  const chatId = to.includes("@") ? to : `${to}@c.us`;
  const media = await MessageMedia.fromUrl(imageUrl);
  const msg = await client.sendMessage(chatId, media, { caption });
  return msg.id?._serialized ?? null;
}
