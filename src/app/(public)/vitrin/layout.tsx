import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "nexadepo — Güvenlik & Network Sistemleri",
  description:
    "B2B güvenlik ve network tedarik platformu. Güvenlik kamerası, ağ altyapısı, alarm sistemleri, switch ve yazılım. Proje bazlı teklif, bayi avantajları.",
  alternates: { canonical: "/vitrin" },
}

export default function VitrinLayout({ children }: { children: React.ReactNode }) {
  return children
}
