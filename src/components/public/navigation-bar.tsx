"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, LayoutGrid } from "lucide-react"
import { MegaMenuDropdown } from "./mega-menu-dropdown"

const NAV_LINKS = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Urunler", href: "/katalog" },
  { label: "Markalar", href: "/katalog" },
  { label: "Blog", href: "/blog" },
  { label: "Iletisim", href: "/basvuru" },
]

export function NavigationBar() {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)

  return (
    <nav
      id="AccessibleNav"
      role="navigation"
      aria-label="Ana navigasyon"
      className="w-full bg-white border-b border-[var(--DTColor_Border)] sticky top-0 z-40"
    >
      <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-12">
          {/* All Categories - Mega Menu Trigger */}
          <button
            type="button"
            onClick={() => setMegaMenuOpen((prev) => !prev)}
            onBlur={(e) => {
              if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                setMegaMenuOpen(false)
              }
            }}
            className="flex items-center gap-2 px-4 h-full text-[13px] font-semibold text-white bg-[var(--DTPrimaryColor)] hover:bg-[var(--DTSecondaryColor)] transition-colors"
            aria-expanded={megaMenuOpen}
            aria-haspopup="true"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Tum Kategoriler</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${megaMenuOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {/* Menu Items - Desktop */}
          <ul className="hidden md:flex items-center gap-6 flex-1 px-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="text-[13px] font-medium text-[var(--DTColor_Body)] hover:text-[var(--DTPrimaryColor)] transition-colors py-3 block"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              className="text-[13px] text-[var(--DTColor_Body)] hover:text-[var(--DTPrimaryColor)] transition-colors"
            >
              Karsilastir
            </button>
            <span className="text-[var(--DTColor_Border)]">|</span>
            <button
              type="button"
              className="text-[13px] text-[var(--DTColor_Body)] hover:text-[var(--DTPrimaryColor)] transition-colors"
            >
              Favori Listesi
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <MegaMenuDropdown isOpen={megaMenuOpen} />
      </div>
    </nav>
  )
}
