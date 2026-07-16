import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Giriş",
    template: "%s | Next AI Teknoloji",
  },
  // Login/kayıt/sıfırlama — indexlenmemeli.
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
