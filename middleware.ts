import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/katalog", "/markalar", "/urunler", "/basvuru", "/garanti-takip", "/kategoriler", "/login"]
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  ) || pathname.startsWith("/api/public")

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for session token in cookies
  const sessionToken = request.cookies.get("next-auth.session-token") || 
                       request.cookies.get("__Secure-next-auth.session-token")

  // Redirect to login if no session and trying to access protected route
  if (!sessionToken && !pathname.startsWith("/login")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
