import type { Metadata } from "next"
import { ConditionalHeader, ConditionalFooter } from "@/components/layout/conditional-header"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { ChatWidget } from "@/components/chat-widget"

export const metadata: Metadata = {
  title: {
    default: "Next AI Teknoloji",
    template: "%s | Next AI Teknoloji",
  },
  description:
    "Next AI Teknoloji — Türkiye'nin teknoloji bayi portalı. 5.000+ ürün, toptan fiyat avantajları, hızlı teslimat.",
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f9f9f9]">
      <ConditionalHeader />
      <main className="flex-1 w-full">{children}</main>
      <ConditionalFooter />
      <WhatsAppButton />
      <ChatWidget />
    </div>
  )
}
