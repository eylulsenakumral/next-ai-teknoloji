"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Package,
  Tag,
  Bookmark,
  Truck,
  Users,
  ClipboardList,
  ShoppingBag,
  DollarSign,
  MessageCircle,
  Plug,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Megaphone,
  ArrowLeftRight,
  Layers,
  FileText,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/urunler", label: "Ürünler", icon: Package },
  { href: "/admin/kampanyalar", label: "Kampanyalar", icon: Megaphone },
  { href: "/admin/kampanya-setleri", label: "Kampanya Setleri", icon: Layers },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: Tag },
  { href: "/admin/kategori-eslesmesi", label: "Kategori Eşleşmesi", icon: ArrowLeftRight },
  { href: "/admin/markalar", label: "Markalar", icon: Bookmark },
  { href: "/admin/tedarikciler", label: "Tedarikçiler", icon: Truck },
  { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { href: "/admin/basvurular", label: "Başvurular", icon: ClipboardList },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingBag },
  { href: "/admin/teklifler", label: "Teklifler", icon: FileText },
  { href: "/admin/fiyatlandirma", label: "Fiyatlandırma", icon: DollarSign },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/admin/entegrasyonlar", label: "Entegrasyonlar", icon: Plug },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

interface SidebarItemProps {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  collapsed: boolean
  active: boolean
}

function SidebarItem({ href, label, icon: Icon, collapsed, active }: SidebarItemProps) {
  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
        "transition-all duration-300 linear",
        collapsed ? "justify-center px-2" : "",
        active
          ? "bg-[var(--DTPrimaryColor)] text-white"
          : "text-white/80 hover:bg-[rgba(33,137,255,0.1)] hover:text-white"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed && <span>{label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        data-testid="sidebar-logo"
        className={cn(
          "flex items-center shrink-0 p-5 rounded-[var(--DTRadius)]",
          collapsed ? "justify-center" : "gap-2"
        )}
      >
        <div className="w-7 h-7 rounded-md bg-[var(--DTPrimaryColor)] flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-bold text-sm text-white truncate">Next AI</span>
            <span className="text-xs text-white/50">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Admin badge */}
      {!collapsed && (
        <div className="mx-3 mt-1 flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-md">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--DTPrimaryColor)] shrink-0" />
          <span className="text-xs text-white font-medium">Yönetici</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {menuItems.map(({ href, label, icon, exact }) => (
          <SidebarItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            exact={exact}
            collapsed={collapsed}
            active={isActive(pathname, href, exact)}
          />
        ))}
      </nav>

      <Separator className="bg-[var(--DTColor_Border)]/20" />

      {/* Alt: kullanici bilgisi + cikis */}
      <div className={cn("p-2 space-y-1 shrink-0", collapsed ? "" : "")}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-2",
            collapsed ? "justify-center" : ""
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-[var(--DTPrimaryColor)] text-white text-xs font-semibold">
              AD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                Admin
              </span>
              <span className="text-[10px] text-white/50 truncate">
                admin@nextai.com.tr
              </span>
            </div>
          )}
        </div>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-white/70 hover:text-white hover:bg-[rgba(33,137,255,0.1)]"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  aria-label="Çıkış yap"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              }
            />
            <TooltipContent side="right">Çıkış Yap</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-[rgba(33,137,255,0.1)]"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        )}
      </div>

      {/* Collapse toggle - only on desktop */}
      <div className="p-2 shrink-0 hidden md:block">
        <Button
          variant="ghost"
          size="icon"
          className="w-full text-white/60 hover:text-white hover:bg-[rgba(33,137,255,0.1)]"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--DTSecondaryColor)] transition-transform duration-300 md:hidden",
          "w-[var(--sidebar_width)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Admin mobil navigasyon"
      >
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-[rgba(33,137,255,0.1)]"
            onClick={() => setMobileOpen(false)}
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 bg-[var(--DTSecondaryColor)] border-r border-[var(--DTColor_Border)]/20 transition-all duration-300 linear",
          collapsed ? "w-14" : "w-[var(--sidebar_width)]"
        )}
        aria-label="Admin navigasyon"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
