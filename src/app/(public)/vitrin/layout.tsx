import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Çözüm Vitrini",
  description:
    "Video güvenlik, ağ altyapısı, geçiş kontrol ve akıllı bina — nexadepo çözümlerini interaktif vitrinde keşfedin.",
  alternates: { canonical: "/vitrin" },
}

export default function VitrinLayout({ children }: { children: React.ReactNode }) {
  return children
}
