// ============================================================================
// GET /api/whatsapp/status — WhatsApp Connection Status
// ============================================================================
import { NextResponse } from "next/server";
import { getConnectionStatus, getSocket } from "@/lib/whatsapp/client";
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getAdminSession();
  const denied = requireAdminSession(session);
  if (denied) return denied;

  const status = getConnectionStatus();
  const sock = getSocket();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (sock as any)?.user;

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
