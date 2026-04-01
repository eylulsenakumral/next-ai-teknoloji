import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { AyarlarClient } from "./ayarlar-client"

export const metadata: Metadata = {
  title: "Ayarlar",
}

// ─── Setting gruplarını çek ────────────────────────────────────────────────────

async function loadSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.setting.findMany({
    where: {
      group: { in: ["GENERAL", "WHATSAPP", "PRICING", "NOTIFICATION", "BIZIMHESAP", "NETGSM"] },
    },
  })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function AyarlarPage() {
  const session = await getServerSession(authOptions)
  if (
    !session?.user ||
    (session.user.role !== "admin" && session.user.role !== "super_admin")
  ) {
    redirect("/login")
  }

  const settings = await loadSettings()

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sistem geneli yapılandırma ve entegrasyon ayarları.
        </p>
      </div>

      <AyarlarClient initialSettings={settings} />
    </div>
  )
}
