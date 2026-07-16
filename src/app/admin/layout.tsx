import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminHeader } from "@/components/layout/admin-header"

export const metadata: Metadata = {
  title: {
    default: "Admin Panel",
    template: "%s | Admin | Next AI Teknoloji",
  },
  // Admin paneli — indexlenmemeli.
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // KRİTİK-22: Tüm /admin/* için tek server-side guard.
  // Bayi (role: dealer) ve VIEWER (role: viewer) admin paneline erişemez.
  const session = await getServerSession(authOptions)
  if (
    !session?.user ||
    (session.user.role !== "admin" && session.user.role !== "super_admin")
  ) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main id="main-content" className="flex-1 p-6 overflow-auto bg-[var(--DT_product_bg_color)]">
          {children}
        </main>
      </div>
    </div>
  )
}
