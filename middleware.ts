import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't need authentication
  const publicRoutes = ["/", "/katalog", "/markalar", "/urunler", "/basvuru", "/garanti-takip", "/kategoriler", "/login"]
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  ) || pathname.startsWith("/api/public") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/categories")

  // Allow public routes WITHOUT any auth check
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, check session
  const sessionToken = request.cookies.get("next-auth.session-token") ||
                       request.cookies.get("__Secure-next-auth.session-token")

  if (!sessionToken) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // For admin routes, verify admin role
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token || (token.role !== "admin" && token.role !== "super_admin")) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      // Add hint that admin login is required
      url.searchParams.set("error", "admin_required")
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  // API route'ları hariç: API'ler kendi auth helper'ları (requireDealerSession /
  // requireAdminSession) ile korunur. Dahil edilirse mobil Bearer-token çağrıları
  // (cookie'siz) /login'e redirect edilip mobil app kırılır.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
