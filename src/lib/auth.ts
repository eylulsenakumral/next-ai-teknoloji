import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      id: "dealer-credentials",
      name: "Bayi Girişi",
      credentials: {
        dealerCode: { label: "Bayi Kodu", type: "text" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.dealerCode || !credentials?.password) {
          throw new Error("Bayi kodu ve şifre gereklidir.")
        }

        const customer = await prisma.customer.findFirst({
          where: {
            dealerCode: credentials.dealerCode.trim().toUpperCase(),
            deletedAt: null,
          },
        })

        if (!customer) {
          throw new Error("Bayi kodu veya şifre hatalı.")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          customer.passwordHash
        )

        if (!isValid) {
          throw new Error("Bayi kodu veya şifre hatalı.")
        }

        if (customer.status === "SUSPENDED") {
          throw new Error("Hesabınız askıya alınmıştır. Lütfen iletişime geçin.")
        }

        if (customer.status === "BLACKLISTED") {
          throw new Error("Hesabınıza erişim kısıtlanmıştır.")
        }

        if (customer.status !== "APPROVED") {
          throw new Error(
            "Hesabınız henüz onaylanmamıştır. Onay durumunu öğrenmek için iletişime geçin."
          )
        }

        // Update last login
        await prisma.customer.update({
          where: { id: customer.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: customer.id,
          dealerCode: customer.dealerCode,
          companyName: customer.companyName,
          contactName: customer.contactName ?? "",
          email: customer.email ?? undefined,
          role: "dealer" as const,
          status: customer.status,
        }
      },
    }),

    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Girişi",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("E-posta ve şifre gereklidir.")
        }

        const admin = await prisma.adminUser.findFirst({
          where: {
            email: credentials.email.trim(),
            deletedAt: null,
            isActive: true,
          },
        })

        if (!admin) {
          throw new Error("E-posta veya şifre hatalı.")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          admin.passwordHash
        )

        if (!isValid) {
          throw new Error("E-posta veya şifre hatalı.")
        }

        // Update last login
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        })

        const role =
          admin.role === "SUPER_ADMIN"
            ? ("super_admin" as const)
            : admin.role === "VIEWER"
              ? ("viewer" as const)
              : ("admin" as const)

        return {
          id: admin.id,
          dealerCode: undefined,
          companyName: admin.name,
          contactName: admin.name,
          email: admin.email,
          role,
          status: "APPROVED",
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.dealerCode = user.dealerCode
        token.companyName = user.companyName
        token.contactName = user.contactName
        token.role = user.role
        token.status = user.status
      }
      return token
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        dealerCode: token.dealerCode,
        companyName: token.companyName,
        contactName: token.contactName,
        email: token.email ?? undefined,
        role: token.role,
        status: token.status,
      }
      return session
    },
  },
}
