"use client"

import { useState } from "react"
import Link from "next/link"
import { Cpu, Mail, Phone, MapPin, Send, CreditCard, Banknote, Smartphone } from "lucide-react"

const infoLinks = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/kampanyalar", label: "Kampanyalar" },
  { href: "/gizlilik", label: "Gizlilik Politikası" },
  { href: "/kullanim", label: "Kullanım Koşulları" },
]

const accountLinks = [
  { href: "/siparisler", label: "Siparişlerim" },
  { href: "/cari-hesap", label: "Cari Hesap" },
  { href: "/hesabim", label: "Profilim" },
  { href: "/favoriler", label: "Favorilerim" },
]

const shopLinks = [
  { href: "/urunler", label: "Tüm Ürünler" },
  { href: "/markalar", label: "Markalar" },
  { href: "/urunler?yeni=true", label: "Yeni Ürünler" },
  { href: "/urunler?outlet=true", label: "Outlet" },
]

export function DealerFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail("")
  }

  return (
    <footer className="bg-[#1e1e1e] border-t border-[#333333] mt-auto" role="contentinfo">
      {/* Newsletter Bar */}
      <div className="bg-[#2189ff]">
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-white shrink-0" aria-hidden />
              <div>
                <p className="font-bold text-[15px] text-white leading-tight">
                  Bültenimize abone olun
                </p>
                <p className="text-[12px] text-white/80">
                  Kampanya ve fırsatlardan ilk siz haberdar olun
                </p>
              </div>
            </div>

            {subscribed ? (
              <p className="text-white font-semibold text-[14px] bg-white/20 px-5 py-2.5 rounded">
                Teşekkürler! Abone oldunuz.
              </p>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="flex items-center gap-0 w-full sm:w-auto"
                role="search"
                aria-label="Bülten aboneliği"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  required
                  className="h-11 w-full sm:w-64 px-4 text-[13px] text-[#1e1e1e] bg-white border-0 focus:outline-none focus:ring-0 rounded-l"
                  aria-label="E-posta adresi"
                />
                <button
                  type="submit"
                  className="h-11 px-5 bg-[#1e1e1e] hover:bg-[#000000] text-white text-[12px] font-bold capitalize tracking-wider transition-colors rounded-r shrink-0"
                >
                  Abone Ol
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 4 Sütun */}
      <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Hakkımızda */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded bg-[#2189ff] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-[15px] text-[#f3f3f3] uppercase tracking-tight">
                Next AI Teknoloji
              </span>
            </div>
            <p className="text-[14px] text-[#999999] leading-relaxed">
              Güvenilir teknoloji ürünlerinde bayi çözüm ortağınız. 5.000+ ürün, 150+ marka ve
              rekabetçi fiyatlarla yanınızdayız.
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#2189ff] shrink-0 mt-0.5" aria-hidden />
                <span className="text-[13px] text-[#999999] leading-relaxed">
                  Esentepe Mh. Sancad Cad. Real Tower Plaza K:2 D:14 Çorlu/Tekirdağ
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-[#2189ff] shrink-0 mt-0.5" aria-hidden />
                <div className="space-y-1">
                  <div>
                    <span className="text-[11px] font-semibold text-[#f3f3f3] uppercase tracking-wide">Satış Destek Hattı</span>
                    <br />
                    <a href="tel:+905529895959" className="text-[13px] text-[#999999] hover:text-[#ffffff] transition-colors">
                      0 552 989 5959
                    </a>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#f3f3f3] uppercase tracking-wide">Teknik Destek Hattı</span>
                    <br />
                    <a href="tel:+905529915959" className="text-[13px] text-[#999999] hover:text-[#ffffff] transition-colors">
                      0 552 991 5959
                    </a>
                  </div>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#2189ff] shrink-0" aria-hidden />
                <a
                  href="mailto:info@next-ai.com.tr"
                  className="text-[13px] text-[#999999] hover:text-[#ffffff] transition-colors"
                >
                  info@next-ai.com.tr
                </a>
              </li>
            </ul>
          </div>

          {/* Bilgi */}
          <div>
            <h3 className="font-bold text-[14px] text-[#f3f3f3] uppercase tracking-wider mb-4 pb-2 border-b border-[#333333]">
              Bilgi
            </h3>
            <ul className="space-y-2.5">
              {infoLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[14px] text-[#999999] hover:text-[#ffffff] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mağaza */}
          <div>
            <h3 className="font-bold text-[14px] text-[#f3f3f3] uppercase tracking-wider mb-4 pb-2 border-b border-[#333333]">
              Mağaza
            </h3>
            <ul className="space-y-2.5">
              {shopLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[14px] text-[#999999] hover:text-[#ffffff] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hesabım */}
          <div>
            <h3 className="font-bold text-[14px] text-[#f3f3f3] uppercase tracking-wider mb-4 pb-2 border-b border-[#333333]">
              Hesabım
            </h3>
            <ul className="space-y-2.5">
              {accountLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[14px] text-[#999999] hover:text-[#ffffff] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Alt Footer */}
      <div className="border-t border-[#333333] bg-[#1a1a1a]">
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
            <p className="text-[13px] text-[#999999]">
              &copy; {new Date().getFullYear()} Next AI Teknoloji. Tüm hakları saklıdır.
            </p>
            {/* Ödeme yöntemleri */}
            <div className="flex items-center gap-2" aria-label="Güvenli ödeme yöntemleri">
              {/* SSL */}
              <div className="flex items-center gap-1.5 h-8 px-3 border border-[#444444] rounded bg-[#2a2a2a]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-500" fill="currentColor" aria-hidden>
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                <span className="text-[11px] font-bold text-green-400">SSL</span>
              </div>
              {/* Mastercard */}
              <div className="flex items-center h-8 px-3 border border-[#444444] rounded bg-[#2a2a2a]">
                <svg viewBox="0 0 48 32" className="h-5 w-8" aria-label="Mastercard">
                  <circle cx="16" cy="16" r="12" fill="#EB001B"/>
                  <circle cx="32" cy="16" r="12" fill="#F79E1B"/>
                  <path d="M24 6.8A12 12 0 0 0 20 16a12 12 0 0 0 4 9.2A12 12 0 0 0 28 16a12 12 0 0 0-4-9.2z" fill="#FF5F00"/>
                </svg>
              </div>
              {/* VISA */}
              <div className="flex items-center h-8 px-3 border border-[#444444] rounded bg-[#2a2a2a]">
                <span className="text-[14px] font-extrabold italic text-[#ffffff] tracking-tight">VISA</span>
              </div>
              {/* TROY */}
              <div className="flex items-center h-8 px-3 border border-[#444444] rounded bg-[#2a2a2a]">
                <span className="text-[12px] font-extrabold text-[#00409A] tracking-wide">TROY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
