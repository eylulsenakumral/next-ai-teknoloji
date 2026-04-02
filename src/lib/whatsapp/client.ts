// ============================================================================
// WhatsApp State — Reads from shared state file (written by PM2 worker)
// ============================================================================
import { readFileSync, existsSync } from "fs";

const STATE_FILE = "./.whatsapp-state.json";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "qr_ready";

interface WAppState {
  status: ConnectionStatus;
  qr: string | null;
  updatedAt: number;
}

function readState(): WAppState {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = readFileSync(STATE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return { status: "disconnected", qr: null, updatedAt: 0 };
}

export function getConnectionStatus(): ConnectionStatus {
  return readState().status;
}

export function getLatestQR(): string | null {
  const state = readState();
  // QR 2 dakikadan eskise geçersiz
  if (state.qr && Date.now() - state.updatedAt < 120000) {
    return state.qr;
  }
  return null;
}

export function getSocket() {
  return null; // Worker process'te, API route erişemez
}

export function onConnectionChange(
  _cb: (status: ConnectionStatus, qr?: string | null) => void,
): () => void {
  // No-op: API route tarafında real-time listener gerekmez
  return () => {};
}

export async function connectWhatsApp() {
  throw new Error("WhatsApp sadece PM2 worker üzerinden başlatılabilir.");
}

export async function disconnectWhatsApp() {
  throw new Error("WhatsApp sadece PM2 worker üzerinden kapatılabilir.");
}

export async function sendTextMessage(_to: string, _text: string): Promise<string | null> {
  throw new Error("Mesaj gönderme sadece PM2 worker üzerinden yapılabilir.");
}

export async function sendImageMessage(_to: string, _imageUrl: string, _caption?: string): Promise<string | null> {
  throw new Error("Mesaj gönderme sadece PM2 worker üzerinden yapılabilir.");
}
