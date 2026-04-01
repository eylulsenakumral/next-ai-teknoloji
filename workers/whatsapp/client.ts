// ============================================================================
// WhatsApp Baileys Client — Connection & Session Management
// ============================================================================
import makeWASocket, {
  useMultiFileAuthState,
  type WASocket,
  type MessageUpsertType,
  type WAMessage,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import { prisma } from "@/lib/db";
import type { ConnectionStatus } from "./types";

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------
let sock: WASocket | null = null;
let connectionStatus: ConnectionStatus = "disconnected";
let latestQR: string | null = null;
let connectionListeners: Array<(status: ConnectionStatus, qr?: string | null) => void> = [];

const AUTH_DIR = "./.whatsapp-auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

export function getLatestQR(): string | null {
  return latestQR;
}

export function getSocket(): WASocket | null {
  return sock;
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
}

// ---------------------------------------------------------------------------
// PostgreSQL-backed auth store (simple key-value)
// ---------------------------------------------------------------------------
function createPostgresAuthStore(sessionId: string) {
  const prefix = `whatsapp-auth:${sessionId}`;

  return {
    async clear() {},
    async delete(key: string) {
      const fullKey = `${prefix}:${key}`;
      try {
        await prisma.$executeRawUnsafe(
          `DELETE FROM "whatsapp_auth_state" WHERE "key" = $1`,
          fullKey,
        );
      } catch { /* ignore */ }
    },
    async get(key: string) {
      const fullKey = `${prefix}:${key}`;
      try {
        const row = await prisma.$queryRawUnsafe<Array<{ value: string | null }>>(
          `SELECT "value" FROM "whatsapp_auth_state" WHERE "key" = $1`,
          fullKey,
        );
        return row[0]?.value ?? null;
      } catch { return null; }
    },
    async set(key: string, value: string) {
      const fullKey = `${prefix}:${key}`;
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "whatsapp_auth_state" ("key", "value", "updated_at")
          VALUES ($1, $2, NOW())
          ON CONFLICT ("key") DO UPDATE SET "value" = $2, "updated_at" = NOW()
        `, fullKey, value);
      } catch { /* ignore */ }
    },
    async has(key: string) {
      const fullKey = `${prefix}:${key}`;
      try {
        const row = await prisma.$queryRawUnsafe<Array<{ value: string | null }>>(
          `SELECT "value" FROM "whatsapp_auth_state" WHERE "key" = $1`,
          fullKey,
        );
        return row.length > 0 && row[0].value !== null;
      } catch { return false; }
    },
  };
}

// ---------------------------------------------------------------------------
// Custom auth state that wraps useMultiFileAuthState with Postgres fallback
// ---------------------------------------------------------------------------
type StoreLike = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  del: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};

async function buildAuthState(sessionId: string) {
  // Try multi-file auth (local)
  let fileState: Awaited<ReturnType<typeof useMultiFileAuthState>>;
  try {
    fileState = await useMultiFileAuthState(AUTH_DIR);
    return fileState;
  } catch {
    throw new Error("Auth state oluşturulamadı");
  }
}

// ---------------------------------------------------------------------------
// Connect / Start
// ---------------------------------------------------------------------------
export async function connectWhatsApp(): Promise<WASocket> {
  if (sock && connectionStatus === "connected") {
    return sock;
  }

  notifyListeners("connecting");

  const { version } = await fetchLatestBaileysVersion();
  const logger = pino({ level: "silent" });

  // Use multi-file auth state
  const authState = await buildAuthState("nexadepo-main");

  sock = makeWASocket({
    version,
    logger,
    auth: authState.state,
    printQRInTerminal: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: true,
    getMessage: (key) => Promise.resolve({ conversation: "" } as never),
  });

  // --- Events ---

  sock.ev.on("creds.update", authState.saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      notifyListeners("qr_ready", qr);
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        notifyListeners("connecting");
        setTimeout(() => connectWhatsApp(), 3000);
      } else {
        notifyListeners("disconnected");
      }
    }

    if (connection === "open") {
      notifyListeners("connected");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }: { messages: WAMessage[]; type: MessageUpsertType }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message) continue;
      try {
        const { handleIncomingMessage } = await import("./handler");
        await handleIncomingMessage(sock!, msg);
      } catch (err) {
        console.error("[WhatsApp] Error handling message:", err);
      }
    }
  });

  return sock;
}

// ---------------------------------------------------------------------------
// Disconnect
// ---------------------------------------------------------------------------
export async function disconnectWhatsApp(): Promise<void> {
  if (sock) {
    sock.ev.removeAllListeners("connection.update");
    sock.ev.removeAllListeners("messages.upsert");
    sock.ev.removeAllListeners("creds.update");
    sock.end(undefined as never);
    sock = null;
  }
  notifyListeners("disconnected");
}

// ---------------------------------------------------------------------------
// Send message helper
// ---------------------------------------------------------------------------
export async function sendTextMessage(to: string, text: string): Promise<string | null> {
  if (!sock) throw new Error("WhatsApp not connected");

  const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;
  const result = await sock.sendMessage(jid, { text });
  return result?.key?.id ?? null;
}

export async function sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<string | null> {
  if (!sock) throw new Error("WhatsApp not connected");

  const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;
  const result = await sock.sendMessage(jid, {
    image: { url: imageUrl },
    caption,
  });
  return result?.key?.id ?? null;
}
