import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"

export async function getDealerSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  return session as Session | null
}

export function requireDealerSession(
  session: Session | null
): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Oturum açmanız gerekiyor." },
      { status: 401 }
    )
  }
  if (session.user.role !== "dealer" || session.user.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Bu sayfaya erişim için onaylı bayi hesabı gerekiyor." },
      { status: 403 }
    )
  }
  return null
}
