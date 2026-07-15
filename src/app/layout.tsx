import type { Metadata } from "next"
import { Poppins, Outfit, JetBrains_Mono, Manrope, DM_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300"],
  variable: "--font-outfit",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
})

// Yeni (public) tasarım fontları — Manrope + DM Mono
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

export const metadata: Metadata = {
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
      className={`${poppins.variable} ${outfit.variable} ${jetbrainsMono.variable} ${manrope.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
