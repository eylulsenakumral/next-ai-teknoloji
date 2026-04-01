// ============================================================================
// GET /api/whatsapp/status — WhatsApp Connection Status
// ============================================================================
import { NextResponse } from "next/server";
import { getConnectionStatus, getSocket } from "@/lib/whatsapp/client";

export async function GET() {
  const status = getConnectionStatus();
  const sock = getSocket();
  const user = sock?.user;

  return NextResponse.json({
    status,
    connectedUser: user
      ? {
          id: user.id,
          name: user.name ?? user.verifiedName ?? "Bilinmeyen",
        }
      : null,
    timestamp: new Date().toISOString(),
  });
}
