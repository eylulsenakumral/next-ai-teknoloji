"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminHeaderProps {
  onMenuToggle?: () => void
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-white text-[var(--color-nx-accent)] border-b border-[var(--DTColor_Border)] px-4 md:px-6"
    >
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-[var(--color-nx-accent)] hover:text-[var(--color-nx-dark)]"
        onClick={onMenuToggle}
        aria-label="Menü"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      {/* Placeholder for future user dropdown / notifications */}
    </header>
  )
}
