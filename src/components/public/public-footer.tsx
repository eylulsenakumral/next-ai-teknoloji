import Link from "next/link"
import { Cpu, Phone, Mail, MapPin, Shield, Award, Users } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Link data                                                           */
/* ------------------------------------------------------------------ */

const categoryLinks = [
  { href: "/katalog?categorySlug=bilgisayar", label: "Bilgisayar" },
  { href: "/katalog?categorySlug=guvenlik-kameralari", label: "Güvenlik Kameraları" },
  { href: "/katalog?categorySlug=network", label: "Network Ürünleri" },
  { href: "/katalog?categorySlug=depolama", label: "Depolama" },
  { href: "/katalog?categorySlug=sunucu", label: "Sunucu & Server" },
  { href: "/katalog?categorySlug=aksesuar", label: "Aksesuar" },
]

const corporateLinks = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/gizlilik", label: "Gizlilik Politikası" },
  { href: "/kullanim", label: "Kullanım Koşulları" },
]

/* ------------------------------------------------------------------ */
/*  Trust Badge                                                         */
/* ------------------------------------------------------------------ */

function TrustBadge({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 h-8 px-3 border border-[#eeeeee] rounded bg-white">
      {icon}
      <span className="text-[11px] font-semibold text-[#555555]">{label}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PublicFooter                                                        */
/* ------------------------------------------------------------------ */

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-[#eeeeee] mt-auto" role="contentinfo">
      {/* İletişim CTA Banner */}
      <div className="bg-[#00179e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-white text-center sm:text-left">
              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Users className="h-6 w-6 text-white" aria-hidden />
              </div>
              <div>
                <p className="font-bold text-[16px]">Bize Ulaşın</p>
                <p className="text-[13px] text-white/70 mt-0.5">
                  5.000+ ürün, en iyi fiyatlar ve hızlı teslimat ile yanınızdayız.
                </p>
              </div>
            </div>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 h-11 px-7 bg-white text-[#00179e] text-[13px] font-bold uppercase tracking-wider hover:bg-white/90 transition-colors shrink-0 whitespace-nowrap"
            >
              İletişime Geç
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Sütun */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Sütun 1 — Hakkımızda + İletişim */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded bg-[#00179e] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" aria-hidden />
              </div>
              <span className="font-extrabold text-[15px] text-[#333333] tracking-tight">
                Next AI Teknoloji
              </span>
            </div>
            <p className="text-[13px] text-[#767676] leading-relaxed mb-5">
              Teknoloji ürünlerinde güvenilir çözüm ortağınız. 5.000+ ürün,
              150+ marka ve rekabetçi fiyatlarla yanınızdayız.
            </p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#00179e] shrink-0 mt-0.5" aria-hidden />
                <span className="text-[12px] text-[#767676]">
                  Esentepe Mh. Sancad Cad. Real Tower Plaza K:2 D:14 Çorlu/Tekirdağ
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#00179e] shrink-0" aria-hidden />
                <a
                  href="tel:+905529895959"
                  className="text-[13px] text-[#767676] hover:text-[#00179e] transition-colors"
                >
                  0 552 989 5959
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#00179e] shrink-0" aria-hidden />
                <a
                  href="mailto:info@next-ai.com.tr"
                  className="text-[13px] text-[#767676] hover:text-[#00179e] transition-colors"
                >
                  info@next-ai.com.tr
                </a>
              </li>
            </ul>
          </div>

          {/* Sütun 2 — Kategoriler */}
          <div>
            <h3 className="font-bold text-[13px] text-[#333333] uppercase tracking-wider mb-4 pb-2 border-b border-[#eeeeee]">
              Ürün Kategorileri
            </h3>
            <ul className="space-y-2.5">
              {categoryLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#767676] hover:text-[#00179e] transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#00179e]/30 group-hover:bg-[#00179e] transition-colors shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sütun 3 — Kurumsal */}
          <div>
            <h3 className="font-bold text-[13px] text-[#333333] uppercase tracking-wider mb-4 pb-2 border-b border-[#eeeeee]">
              Kurumsal
            </h3>
            <ul className="space-y-2.5">
              {corporateLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#767676] hover:text-[#00179e] transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#00179e]/30 group-hover:bg-[#00179e] transition-colors shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sütun 4 — İletişim + Sosyal */}
          <div>
            <h3 className="font-bold text-[13px] text-[#333333] uppercase tracking-wider mb-4 pb-2 border-b border-[#eeeeee]">
              Bize Ulaşın
            </h3>
            <div className="space-y-3">
              <a
                href="tel:+905529895959"
                className="flex items-center gap-2.5 p-3 bg-[#f9f9f9] border border-[#eeeeee] hover:border-[#00179e] hover:bg-white transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-[#00179e]/10 flex items-center justify-center shrink-0">
                  <Phone className="h-3.5 w-3.5 text-[#00179e]" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] text-[#767676] uppercase tracking-wider">Telefon</p>
                  <p className="text-[13px] font-semibold text-[#333333] group-hover:text-[#00179e] transition-colors">
                    0 552 989 5959
                  </p>
                </div>
              </a>
              <a
                href="mailto:info@next-ai.com.tr"
                className="flex items-center gap-2.5 p-3 bg-[#f9f9f9] border border-[#eeeeee] hover:border-[#00179e] hover:bg-white transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-[#00179e]/10 flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5 text-[#00179e]" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] text-[#767676] uppercase tracking-wider">E-Posta</p>
                  <p className="text-[13px] font-semibold text-[#333333] group-hover:text-[#00179e] transition-colors">
                    info@next-ai.com.tr
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Footer */}
      <div className="border-t border-[#eeeeee] bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
            <p className="text-[12px] text-[#767676]">
              &copy; {new Date().getFullYear()} Next AI Teknoloji. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <TrustBadge
                icon={
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-green-600" fill="currentColor" aria-hidden>
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                }
                label="SSL Güvenli"
              />
              <TrustBadge
                icon={<Shield className="h-3.5 w-3.5 text-[#00179e]" aria-hidden />}
                label="Güvenli Alışveriş"
              />
              <TrustBadge
                icon={<Award className="h-3.5 w-3.5 text-amber-500" aria-hidden />}
                label="Güvenilir Satıcı"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
