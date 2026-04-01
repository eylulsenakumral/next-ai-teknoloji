import type { Metadata } from "next"
import { AdminSidebar } from "@/components/layout/admin-sidebar"

export const metadata: Metadata = {
  title: {
    default: "Admin Panel",
    template: "%s | Admin | Next AI Teknoloji",
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
