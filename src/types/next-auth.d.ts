import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      dealerCode?: string
      companyName: string
      contactName: string
      email?: string
      role: "dealer" | "admin" | "super_admin" | "viewer"
      status: string
    }
  }

  interface User {
    id: string
    dealerCode?: string
    companyName: string
    contactName: string
    email?: string
    role: "dealer" | "admin" | "super_admin" | "viewer"
    status: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    dealerCode?: string
    companyName: string
    contactName: string
    role: "dealer" | "admin" | "super_admin" | "viewer"
    status: string
  }
}
