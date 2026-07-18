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
    "27+ global markanın yetkili tedarikçisi. CCTV, network, geçiş kontrol, akıllı bina çözümleri. Bayi avantajları, proje tasarımı ve teknik danışmanlık.",
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
    description: "27+ global markanın yetkili tedarikçisi. Bayi avantajları, proje tasarımı ve teknik danışmanlık.",
    type: "website",
    locale: "tr_TR",
    siteName: "Next AI Teknoloji",
    images: [
      {
        url: "/logo.png",
        width: 940,
        height: 400,
        alt: "Next AI Teknoloji",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Next AI Teknoloji — B2B Teknoloji Tedarik & Proje Platformu",
    description: "27+ global markanın yetkili tedarikçisi. Bayi avantajları, proje tasarımı ve teknik danışmanlık.",
    images: ["/logo.png"],
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)] text-[var(--color-primary)] font-nx-sans">
      <PublicHeaderNext />
      <main id="main-content" className="flex-1 w-full">{children}</main>
      <PublicFooterNext />
      <WhatsAppButton />
      <ChatWidget />
    </div>
  )
}
