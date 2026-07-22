"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
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
  Coins,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Cpu,
  Megaphone,
  ArrowLeftRight,
  Layers,
  FileText,
  Percent,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// ----------------------------------------------------------------------------
// Tip ve veri
// ----------------------------------------------------------------------------

interface MenuItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

interface MenuGroup {
  id: string
  label: string
  items: MenuItem[]
}

/** Tüm menü grupları — mantıksal kategorilere ayrılmış */
const menuGroups: MenuGroup[] = [
  {
    id: "genel",
    label: "Genel Bakış",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    id: "katalog",
    label: "Katalog",
    items: [
      { href: "/admin/urunler", label: "Ürünler", icon: Package },
      { href: "/admin/kategoriler", label: "Kategoriler", icon: Tag },
      { href: "/admin/kategori-eslesmesi", label: "Kategori Eşleşmesi", icon: ArrowLeftRight },
      { href: "/admin/markalar", label: "Markalar", icon: Bookmark },
      { href: "/admin/tedarikciler", label: "Tedarikçiler", icon: Truck },
    ],
  },
  {
    id: "satis",
    label: "Satış",
    items: [
      { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingBag },
      { href: "/admin/teklifler", label: "Teklifler", icon: FileText },
      { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
      { href: "/admin/basvurular", label: "Başvurular", icon: ClipboardList },
    ],
  },
  {
    id: "site",
    label: "Site Yönetimi",
    items: [
      { href: "/admin/site/anasayfa", label: "Anasayfa", icon: LayoutDashboard },
      { href: "/admin/site/cozumler", label: "Çözümler", icon: Package },
      { href: "/admin/site/hakkimizda", label: "Hakkımızda", icon: Users },
      { href: "/admin/site/blog", label: "Blog", icon: FileText },
      { href: "/admin/icerik", label: "Tüm İçerik", icon: Layers },
    ],
  },
  {
    id: "pazarlama",
    label: "Pazarlama",
    items: [
      { href: "/admin/kampanyalar", label: "Kampanyalar", icon: Megaphone },
      { href: "/admin/kampanya-setleri", label: "Kampanya Setleri", icon: Layers },
    ],
  },
  {
    id: "fiyatlandirma",
    label: "Fiyatlandırma",
    items: [
      { href: "/admin/kar-marji", label: "Kar Marjı", icon: Percent },
      { href: "/admin/doviz-kuru", label: "Döviz Kuru", icon: Coins },
      { href: "/admin/fiyatlandirma", label: "Fiyatlandırma", icon: DollarSign },
    ],
  },
  {
    id: "sistem",
    label: "Sistem",
    items: [
      { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/admin/entegrasyonlar", label: "Entegrasyonlar", icon: Plug },
      { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings },
    ],
  },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname.startsWith(href)
}

/** Bir gruptaki herhangi bir item aktif mi? */
function groupHasActive(
  pathname: string,
  items: MenuItem[]
): boolean {
  return items.some((it) => isActive(pathname, it.href, it.exact))
}

// ----------------------------------------------------------------------------
// Item
// ----------------------------------------------------------------------------

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
        collapsed ? "justify-center px-2" : "pl-9", // grup başlığıyla hizala
        active
          ? "bg-[var(--color-nx-dark)] text-white"
          : "text-white hover:bg-white/10 hover:text-white"
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

// ----------------------------------------------------------------------------
// Grup
// ----------------------------------------------------------------------------

interface MenuGroupProps {
  group: MenuGroup
  collapsed: boolean
  pathname: string
  forceOpen: boolean // aktif grup veya küçük ekran → zorla açık
}

function MenuGroupSection({ group, collapsed, pathname, forceOpen }: MenuGroupProps) {
  const hasActive = groupHasActive(pathname, group.items)
  // Default: tüm gruplar kapalı başlar.
  // forceOpen (örn. "genel") ve aktif grup açık başlar.
  const [open, setOpen] = useState<boolean>(hasActive || forceOpen)

  // Aktif gruba düştüğünde otomatik aç (route değişimiyle)
  if (hasActive && !open) {
    setOpen(true)
  }
  const effectiveOpen = collapsed ? true : open

  if (collapsed) {
    // Daraltılmış mod: grup başlığı gösterme, item'ları düz liste gibi göster
    return (
      <div className="space-y-0.5">
        {group.items.map((it) => (
          <SidebarItem
            key={it.href}
            href={it.href}
            label={it.label}
            icon={it.icon}
            exact={it.exact}
            collapsed
            active={isActive(pathname, it.href, it.exact)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={effectiveOpen}
        className="w-full flex items-center justify-between gap-2 px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
      >
        <span>{group.label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            effectiveOpen ? "rotate-180" : ""
          )}
          aria-hidden
        />
      </button>
      {effectiveOpen &&
        group.items.map((it) => (
          <SidebarItem
            key={it.href}
            href={it.href}
            label={it.label}
            icon={it.icon}
            exact={it.exact}
            collapsed={false}
            active={isActive(pathname, it.href, it.exact)}
          />
        ))}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Sidebar
// ----------------------------------------------------------------------------

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const adminEmail = (session?.user as { email?: string })?.email ?? "admin"
  const adminInitials = adminEmail.substring(0, 2).toUpperCase()

  // Tüm item'ları düz liste olarak tut (gelecekteki kullanımlar için)
  const allItems = useMemo(
    () => menuGroups.flatMap((g) => g.items),
    []
  )
  // allItems referansını kullanmadan tut (lint için)
  void allItems

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
        <div className="w-7 h-7 rounded-md bg-[var(--color-nx-dark)] flex items-center justify-center shrink-0">
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
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-nx-dark)] shrink-0" />
          <span className="text-xs text-white font-medium">Yönetici</span>
        </div>
      )}

      {/* Nav — kategori bazlı gruplar */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0">
        {menuGroups.map((group) => (
          <MenuGroupSection
            key={group.id}
            group={group}
            collapsed={collapsed}
            pathname={pathname}
            forceOpen={group.id === "genel"}
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
            <AvatarFallback className="bg-[var(--color-nx-dark)] text-white text-xs font-semibold">
              {adminInitials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                Admin
              </span>
              <span className="text-[10px] text-white/50 truncate">
                {adminEmail}
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
                  className="w-full text-white hover:text-white hover:bg-white/10"
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
            className="w-full justify-start gap-2 text-white hover:text-white hover:bg-white/10"
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
          className="w-full text-white hover:text-white hover:bg-white/10"
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
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#155bfe] transition-transform duration-300 md:hidden",
          "w-[var(--sidebar_width)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Admin mobil navigasyon"
      >
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-white hover:bg-white/10"
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
          "hidden md:flex flex-col h-screen sticky top-0 bg-[#155bfe] border-r border-white/10 transition-all duration-300 linear",
          collapsed ? "w-14" : "w-[var(--sidebar_width)]"
        )}
        aria-label="Admin navigasyon"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
