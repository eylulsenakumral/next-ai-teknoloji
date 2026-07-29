import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"

export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  return session as Session | null
}

// Katı admin erişimi: admin, super_admin. dealer ve diğerleri -> 403.
// middleware.ts yok ve ~53 write handler (POST/PUT/DELETE/PATCH) ile
// hassas read route'ları (kar-marji, llm/*, settings, whatsapp...) bu
// helper üzerinden geçiyor. Write'lar için requireWritePermission kullanın.
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

// Read erişimi: admin, super_admin. viewer rolü kullanımda olmadığından
// requireAdminSession ile eşdeğerdir; yalnızca mevcut çağrı alanlarını
// korumak için ayrı tutuldu.
export function requireReadPermission(
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

// Write erişimi: admin, super_admin only. dealer -> 403.
// Tüm POST/PUT/DELETE/PATCH handler'ları için kullanın.
// requireAdminSession ile aynı kural — çağrı noktasında write niyetini
// belli etmek için ayrı isimlendirilmiş helper.
export function requireWritePermission(
  session: Session | null
): NextResponse | null {
  return requireAdminSession(session)
}
