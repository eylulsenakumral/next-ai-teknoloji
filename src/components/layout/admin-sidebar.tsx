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
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2" : "",
        active
          ? "bg-[#2189ff] text-white"
          : "text-[#f3f3f3]/80 hover:bg-[#2a2a2a] hover:text-[#f3f3f3]"
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
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-[#1e1e1e] border-r border-[#333333] transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
      aria-label="Admin navigasyon"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-[#333333] px-3 shrink-0",
          collapsed ? "justify-center" : "gap-2"
        )}
      >
        <div className="w-7 h-7 rounded-md bg-[#2189ff] flex items-center justify-center shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-bold text-sm text-[#f3f3f3] truncate">Next AI</span>
            <span className="text-xs text-[#999999]">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Admin badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-2 py-1.5 bg-[#2a2a2a] rounded-md">
          <ShieldCheck className="h-3.5 w-3.5 text-[#2189ff] shrink-0" />
          <span className="text-xs text-[#f3f3f3] font-medium">Yönetici</span>
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

      <Separator className="bg-[#333333]" />

      {/* Alt: kullanıcı bilgisi + çıkış */}
      <div className={cn("p-2 space-y-1 shrink-0", collapsed ? "" : "")}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-2",
            collapsed ? "justify-center" : ""
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-[#2189ff] text-white text-xs font-semibold">
              AD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-semibold text-[#f3f3f3] truncate">
                Admin
              </span>
              <span className="text-[10px] text-[#999999] truncate">
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
                  className="w-full text-[#f3f3f3]/70 hover:text-[#f3f3f3] hover:bg-[#2a2a2a]"
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
            className="w-full justify-start gap-2 text-[#f3f3f3]/70 hover:text-[#f3f3f3] hover:bg-[#2a2a2a]"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="p-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="w-full text-[#f3f3f3]/60 hover:text-[#f3f3f3] hover:bg-[#2a2a2a]"
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
    </aside>
  )
}
