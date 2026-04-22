"use client"

import { useSession } from "next-auth/react"
import { PublicHeader } from "@/components/public/public-header"
import { DealerFooter } from "@/components/layout/dealer-footer"
import { PublicFooter } from "@/components/public/public-footer"

export function ConditionalHeader() {
  // Always use PublicHeader — NavigationBar inside it switches links based on auth
  return <PublicHeader />
}

export function ConditionalFooter() {
  const { data: session, status } = useSession()

  if (status === "loading") return null

  if (session?.user?.role === "dealer" && session?.user?.status === "APPROVED") {
    return <DealerFooter />
  }

  return <PublicFooter />
}
