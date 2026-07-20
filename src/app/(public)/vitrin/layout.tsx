import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sistem Mimarisi",
  description:
    "Akıllı güvenlik mekanı — kamera, yangın, hırsız algılama, switch, yazılım ve araç kamerası. İnteraktif kurulum haritası.",
  alternates: { canonical: "/vitrin" },
}

export default function VitrinLayout({ children }: { children: React.ReactNode }) {
  return children
}
