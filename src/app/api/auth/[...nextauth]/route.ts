import NextAuth, { AuthOptions } from "next-auth"
import { authOptions } from "@/lib/auth"

// Create NextAuth handler with disabled auto-redirect
const handler = NextAuth({
  ...authOptions,
  // Disable NextAuth's built-in middleware behavior
  useSecureCookies: process.env.NODE_ENV === "production",
})

export { handler as GET, handler as POST }
