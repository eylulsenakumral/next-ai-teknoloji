import { getServerSession } from "next-auth"
import { decode } from "next-auth/jwt"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"

export async function getDealerSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions)
  if (session?.user) return session as Session | null

  // Bearer token fallback (mobil uygulama)
  try {
    const headersList = await headers()
    const bearer = headersList.get("authorization")?.replace("Bearer ", "") ?? null
    if (bearer && process.env.NEXTAUTH_SECRET) {
      const decoded = await decode({ secret: process.env.NEXTAUTH_SECRET, token: bearer })
      if (decoded?.role === "dealer" && decoded?.status === "APPROVED") {
        return {
          user: {
            id: decoded.id,
            dealerCode: decoded.dealerCode,
            companyName: decoded.companyName,
            contactName: decoded.contactName,
            email: decoded.email ?? undefined,
            role: decoded.role,
            status: decoded.status,
          },
          expires: "",
        }
      }
    }
  } catch {}

  return null
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
