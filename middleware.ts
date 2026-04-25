import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets and internal Next.js paths — skip entirely
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Public routes that don't need authentication
  const publicRoutes = [
    "/",
    "/katalog",
    "/markalar",
    "/kategoriler",
    "/kategori",
    "/iletisim",
    "/basvuru",
    "/garanti-takip",
    "/login",
    "/hakkimizda",
    "/hakkinda",
    "/kurumsal",
    "/gizlilik-politikasi",
    "/kullanim-sartlari",
    "/kampanya",
    "/urun",
    "/sifremi-unuttum",
  ]

  const isPublicRoute =
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    ) ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/categories") ||
    pathname.startsWith("/api/locations") ||
    pathname === "/api/applications"

  // Allow public routes WITHOUT any auth check
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, check session cookie
  const sessionToken =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token")

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For admin routes, verify admin role
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || (token.role !== "admin" && token.role !== "super_admin")) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("error", "admin_required")
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
