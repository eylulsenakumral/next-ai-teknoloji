import type { Metadata } from "next"
import { PublicHeader } from "@/components/public/public-header"
import { PublicFooter } from "@/components/public/public-footer"
import { WhatsAppButton } from "@/components/whatsapp-button"

export const metadata: Metadata = {
  title: {
    default: "Ürün Kataloğu",
    template: "%s | Next AI Teknoloji",
  },
  description:
    "Next AI Teknoloji ürün kataloğu. 5.000+ teknoloji ürününü inceleyin, en iyi fiyat tekliflerini hemen alın.",
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f9f9f9]">
      <PublicHeader />
      <main className="flex-1 w-full">{children}</main>
      <PublicFooter />
      <WhatsAppButton />
    </div>
  )
}
