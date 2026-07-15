import type { Metadata } from "next"
import { PublicHeaderNext } from "@/components/layout/public-header-next"
import { PublicFooterNext } from "@/components/layout/public-footer-next"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { ChatWidget } from "@/components/chat-widget"

export const metadata: Metadata = {
  title: {
    default: "Next AI Teknoloji — B2B Teknoloji Tedarik & Proje Platformu",
    template: "%s | Next AI Teknoloji",
  },
  description:
    "16+ global markanın yetkili tedarikçisi. CCTV, network, geçiş kontrol, akıllı bina çözümleri. Bayi avantajları, proje tasarımı ve teknik danışmanlık.",
  keywords: [
    "CCTV tedarik",
    "güvenlik kamera bayi",
    "Dahua Hikvision UNV Türkiye",
    "network altyapısı",
    "geçiş kontrol sistemleri",
    "B2B teknoloji toptan",
  ],
  openGraph: {
    title: "Next AI Teknoloji — B2B Teknoloji Tedarik & Proje Platformu",
    description: "16+ global markanın yetkili tedarikçisi. Bayi avantajları, proje tasarımı ve teknik danışmanlık.",
    type: "website",
    locale: "tr_TR",
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fa] text-[#0040a4] font-nx-sans">
      <PublicHeaderNext />
      <main className="flex-1 w-full">{children}</main>
      <PublicFooterNext />
      <WhatsAppButton />
      <ChatWidget />
    </div>
  )
}
