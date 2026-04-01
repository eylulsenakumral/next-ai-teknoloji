import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Giriş",
    template: "%s | Next AI Teknoloji",
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
