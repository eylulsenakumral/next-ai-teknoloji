import type { Metadata } from "next"
import { DealerHeader } from "@/components/layout/dealer-header"
import { DealerFooter } from "@/components/layout/dealer-footer"
import { WhatsAppButton } from "@/components/whatsapp-button"

export const metadata: Metadata = {
  title: {
    default: "Bayi Portalı",
    template: "%s | Next AI Teknoloji",
  },
}

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <DealerHeader />
      <main className="flex-1 w-full">
        {children}
      </main>
      <DealerFooter />
      <WhatsAppButton />
    </div>
  )
}
