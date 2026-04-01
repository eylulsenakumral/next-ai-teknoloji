import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"

export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  return session as Session | null
}

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
