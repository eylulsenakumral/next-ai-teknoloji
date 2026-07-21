import type { Metadata } from "next"
import { Poppins, Manrope, DM_Mono, Sora, Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

// Poppins (dealer/admin), Manrope (public body+heading), DM Mono (kod/fiyat) — latin-ext Türkçe garanti
const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
})

const dmMono = DM_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

// Sora + Inter — Ceron-inspired vitrin tipografisi
const sora = Sora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://nexadepo.com"),
  title: {
    default: "Next AI Teknoloji",
    template: "%s | Next AI Teknoloji",
  },
  description:
    "Güvenilir teknoloji ürünlerinde bayi portalı — Next AI Teknoloji",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="tr"
      className={`${poppins.variable} ${manrope.variable} ${dmMono.variable} ${sora.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2"
          >
            İçeriğe geç
          </a>
          {children}
        </Providers>
      </body>
    </html>
  )
}
