// ============================================================================
// GET /api/whatsapp/qrcode — Get latest QR Code
// ============================================================================
import { NextResponse } from "next/server";
import { getConnectionStatus, getLatestQR } from "@/lib/whatsapp/client";

export async function GET() {
  const status = getConnectionStatus();

  if (status === "connected") {
    return NextResponse.json({
      status: "connected",
      qr: null,
      message: "WhatsApp zaten bağlı.",
    });
  }

  const qr = getLatestQR();

  if (!qr) {
    return NextResponse.json(
      {
        status: status,
        qr: null,
        message: "QR kod henüz hazır değil. Lütfen tekrar deneyin.",
      },
      { status: 202 },
    );
  }

  return NextResponse.json({
    status: "qr_ready",
    qr,
    message: "WhatsApp Web ile QR kodu tarayın.",
  });
}
