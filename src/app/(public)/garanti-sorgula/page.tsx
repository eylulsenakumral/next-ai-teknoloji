import type { Metadata } from "next"
import { GarantiSorgula } from "@/components/public/garanti-sorgula"

export const metadata: Metadata = {
  title: "Garanti Sorgula",
  description:
    "Ürün seri numarası veya barkod numarası ile garanti durumunuzu sorgulayın. Garanti başlangıç/bitiş tarihi ve kalan süre bilgileri.",
  alternates: { canonical: "/garanti-sorgula" },
}

export default function GarantiSorgulaPage() {
  return <GarantiSorgula />
}
