import type { Metadata } from "next"
import { ConditionalFooter } from "@/components/layout/conditional-header"
import { PublicHeader } from "@/components/public/public-header"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { ChatWidget } from "@/components/chat-widget"

export const metadata: Metadata = {
  title: {
    default: "Bayi Portalı",
    template: "%s | Next AI Teknoloji",
  },
  // KRİTİK: Bayi paneli PII (sipariş, cari, adres, bakiye) içerir — indexlenmemeli.
  robots: { index: false, follow: false },
}

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f9f9f9]">
      <PublicHeader />
      <main id="main-content" className="flex-1 w-full">
        {children}
      </main>
      <ConditionalFooter />
      <WhatsAppButton />
      <ChatWidget />
    </div>
  )
}
