import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Public newsletter aboneliği — anasayfa newsletter bandı */
export async function POST(req: NextRequest) {
  let email: string | undefined
  try {
    const body = await req.json()
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 255) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 })
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      // Daha önce ayrılmışsa yeniden aktifleştir
      update: { isActive: true, deletedAt: null },
      create: { email, source: "homepage" },
    })
    return NextResponse.json({ success: true, message: "Aboneliğiniz alındı, teşekkürler." })
  } catch (err) {
    console.error("[newsletter] subscribe error:", err)
    return NextResponse.json({ error: "Bir hata oluştu, lütfen tekrar deneyin." }, { status: 500 })
  }
}
