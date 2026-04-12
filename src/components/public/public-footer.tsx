import Link from "next/link"
import { Cpu, Phone, Mail, MapPin } from "lucide-react"

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

const quickLinks = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/sss", label: "Sıkça Sorulan Sorular" },
]

const socialLinks = [
  { href: "#", icon: Mail, label: "Email" },
  { href: "#", icon: Phone, label: "Phone" },
]

/* ------------------------------------------------------------------ */
/*  Social Icon                                                         */
/* ------------------------------------------------------------------ */

function SocialIcon({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-[#2189ff] transition-colors group"
      aria-label={label}
    >
      <Icon className="h-4 w-4 text-white group-hover:text-white" aria-hidden />
    </a>
  )
}

/* ------------------------------------------------------------------ */
/*  PublicFooter                                                        */
/* ------------------------------------------------------------------ */

export function PublicFooter() {
  return (
    <footer className="bg-[#1e1e1e] text-[#f3f3f3] mt-auto" role="contentinfo">
      {/* Footer Top - 4 Columns */}
      <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Column 1 — Logo + Contact Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-lg bg-[#2189ff] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" aria-hidden />
              </div>
              <span className="font-bold text-[16px] text-white tracking-tight">
                Next AI Teknoloji
              </span>
            </div>
            <p className="text-[13px] text-[#999999] leading-relaxed mb-5">
              Teknoloji ürünlerinde güvenilir çözüm ortağınız. 5.000+ ürün,
              150+ marka ve rekabetçi fiyatlarla yanınızdayız.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#2189ff] shrink-0 mt-0.5" aria-hidden />
                <span className="text-[13px] text-[#999999] leading-relaxed">
                  Esentepe Mh. Sancad Cad. Real Tower Plaza K:2 D:14 Çorlu/Tekirdağ
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#2189ff] shrink-0" aria-hidden />
                <a
                  href="tel:+905529895959"
                  className="text-[13px] text-[#999999] hover:text-white transition-colors"
                >
                  0 552 989 5959
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#2189ff] shrink-0" aria-hidden />
                <a
                  href="mailto:info@next-ai.com.tr"
                  className="text-[13px] text-[#999999] hover:text-white transition-colors"
                >
                  info@next-ai.com.tr
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2 — Hızlı Menü */}
          <div>
            <h3 className="font-bold text-[14px] text-white uppercase tracking-wider mb-5">
              Hızlı Menü
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#999999] hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Kategoriler */}
          <div>
            <h3 className="font-bold text-[14px] text-white uppercase tracking-wider mb-5">
              Kategoriler
            </h3>
            <ul className="space-y-2.5">
              {categoryLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#999999] hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Kurumsal */}
          <div>
            <h3 className="font-bold text-[14px] text-white uppercase tracking-wider mb-5">
              Kurumsal
            </h3>
            <ul className="space-y-2.5 mb-6">
              {corporateLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] text-[#999999] hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Media Icons */}
            <div className="flex items-center gap-2">
              {socialLinks.map(({ href, icon, label }) => (
                <SocialIcon key={label} href={href} icon={icon} label={label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom - Copyright + Payment */}
      <div className="border-t border-white/10 bg-[#121212]">
        <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
            <p className="text-[13px] text-[#999999]">
              &copy; {new Date().getFullYear()} Next AI Teknoloji. Tüm hakları saklıdır.
            </p>

            {/* Payment Method Icons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center px-3 py-1.5 bg-white rounded">
                <span className="text-[10px] font-bold text-[#1a1f71]">VISA</span>
              </div>
              <div className="flex items-center justify-center px-3 py-1.5 bg-white rounded">
                <span className="text-[10px] font-bold text-[#eb001b]">MasterCard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
