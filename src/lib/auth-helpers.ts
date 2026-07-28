import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"

export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  return session as Session | null
}

// Katı admin erişimi: admin, super_admin. viewer ve diğerleri -> 403.
// requireAdminSession bilinçli olarak viewer'a açılmadı (KRİTİK-22):
// middleware.ts yok ve ~53 write handler (POST/PUT/DELETE/PATCH) ile
// hassas read route'ları (kar-marji, llm/*, settings, whatsapp...) hâlâ
// bu helper üzerinden geçiyor. viewer'ı burada açarsak tüm o route'larda
// viewer yazabilir/hassas veri okur hale gelir. viewer-readable GET'ler
// için requireReadPermission, write'lar için requireWritePermission kullanın.
export function requireAdminSession(
  session: Session | null
): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Oturum açmanız gerekiyor." },
      { status: 401 }
    )
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Bu işlem için yetkiniz yok." },
      { status: 403 }
    )
  }
  return null
}

// Read erişimi: admin, super_admin, viewer. viewer buradan okuyabilir.
// Sadece viewer-readable GET handler'larında kullanın.
export function requireReadPermission(
  session: Session | null
): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Oturum açmanız gerekiyor." },
      { status: 401 }
    )
  }
  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "viewer"
  ) {
    return NextResponse.json(
      { error: "Bu işlem için yetkiniz yok." },
      { status: 403 }
    )
  }
  return null
}

// Write erişimi: admin, super_admin only. viewer -> 403.
// Tüm POST/PUT/DELETE/PATCH handler'ları için kullanın.
// requireAdminSession ile aynı kural — çağrı noktasında write niyetini
// belli etmek için ayrı isimlendirilmiş helper.
export function requireWritePermission(
  session: Session | null
): NextResponse | null {
  return requireAdminSession(session)
}
