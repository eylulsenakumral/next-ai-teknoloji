// ============================================================================
// POST /api/whatsapp/connect — Start WhatsApp connection
// ============================================================================
import { NextResponse } from "next/server";
import { connectWhatsApp, getConnectionStatus } from "@/lib/whatsapp/client";
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers";

export async function POST() {
  const session = await getAdminSession();
  const denied = requireAdminSession(session);
  if (denied) return denied;

  const currentStatus = getConnectionStatus();

  if (currentStatus === "connected") {
    return NextResponse.json({
      status: "connected",
      message: "WhatsApp zaten bağlı.",
    });
  }

  try {
    // Fire and forget — QR will be available via /qrcode endpoint
    connectWhatsApp().catch((err) => {
      console.error("[WhatsApp] Connection error:", err);
    });

    return NextResponse.json({
      status: "connecting",
      message: "WhatsApp bağlantısı başlatıldı. QR kodu almak için /api/whatsapp/qrcode endpoint'ini kontrol edin.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Bağlantı hatası",
      },
      { status: 500 },
    );
  }
}
