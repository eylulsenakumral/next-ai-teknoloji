import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const auth = NextAuth(authOptions)

export default auth((req) => {
  const isAuthenticated = !!req.auth
  
  // Define public routes
  const publicRoutes = ["/", "/katalog", "/markalar", "/urunler", "/basvuru", "/garanti-takip"]
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + "/")
  ) || req.nextUrl.pathname.startsWith("/api/public") || req.nextUrl.pathname.startsWith("/kategoriler")

  // Allow public routes without authentication
  if (isPublicRoute) {
    return null
  }

  // Require authentication for other routes
  if (!isAuthenticated && !req.nextUrl.pathname.startsWith("/login")) {
    return Response.redirect(new URL("/login", req.url))
  }

  return null
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
