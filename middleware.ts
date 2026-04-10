import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't need authentication
  const publicRoutes = ["/", "/katalog", "/markalar", "/urunler", "/basvuru", "/garanti-takip", "/kategoriler", "/login"]
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  ) || pathname.startsWith("/api/public") || pathname.startsWith("/api/auth")
  
  // Allow public routes WITHOUT any auth check
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, redirect to login if no session
  const sessionToken = request.cookies.get("next-auth.session-token") || 
                       request.cookies.get("__Secure-next-auth.session-token")

  if (!sessionToken) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
