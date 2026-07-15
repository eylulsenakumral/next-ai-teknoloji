import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

// Routes that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/basvuru",
  "/katalog",
  "/markalar",
  "/urunler",
  "/urun",
  "/kategoriler",
  "/kategori",
  "/garanti-takip",
  "/hakkinda",
  "/iletisim",
  "/gizlilik-politikasi",
  "/kullanim-sartlari",
  "/kampanyalar",
  "/kampanya-setleri",
  "/sepet/odeme/sonuc",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]

// API routes that are public (no auth required)
// Cron ve sync endpoint'leri kendi auth mekanizmalarını kullanır (Bearer token)
const PUBLIC_API_PATHS = ["/api/auth", "/api/public", "/api/cron", "/api/chat", "/api/exchange-rate", "/api/payment", "/api/locations", "/api/categories", "/api/error-report"]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?")
  )
}

function isPublicApi(pathname: string): boolean {
  if (PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true
  // POST /api/applications is public (dealer application form)
  if (pathname === "/api/applications") return true
  return false
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths without any auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // /admin/* routes — require ADMIN or SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(loginUrl)
    }

    if (token.role !== "admin" && token.role !== "super_admin") {
      // Authenticated but wrong role — redirect to dealer dashboard or 403
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  }

  // /(dealer)/* routes — require APPROVED customer
  if (pathname.startsWith("/dealer") || pathname.match(/^\/(siparis|urun|profil|hesap|online-odeme|favoriler|sepet)/)) {
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(loginUrl)
    }

    if (token.role !== "dealer" || token.status !== "APPROVED") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
  }

  // /api/* routes — require authentication (except public API paths)
  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Bu işlem için giriş yapmanız gerekiyor." },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // All other routes — require any authenticated user
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
}
