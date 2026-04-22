import Image from "next/image"
import Link from "next/link"

/* ------------------------------------------------------------------ */
/*  Link data                                                          */
/* ------------------------------------------------------------------ */

const knowUsLinks = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/kariyer", label: "Kariyer" },
  { href: "/blog", label: "Blog" },
  { href: "/iletisim", label: "İletişim" },
]

const policyLinks = [
  { href: "/gizlilik", label: "Gizlilik Politikası" },
  { href: "/kullanim", label: "Kullanım Koşulları" },
  { href: "/iade", label: "İade Politikası" },
  { href: "/sss", label: "SSS" },
]

const supportLinks = [
  { href: "/kargo", label: "Kargo Takibi" },
  { href: "/favoriler", label: "Favoriler" },
  { href: "/siparisler", label: "Siparişlerim" },
  { href: "/katalog", label: "Tüm Ürünler" },
  { href: "/kampanyalar", label: "Kampanyalar" },
]

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                   */
/* ------------------------------------------------------------------ */

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconZap({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Social Icon SVGs                                                   */
/* ------------------------------------------------------------------ */

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconTwitter() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const socialLinks = [
  { href: "#", icon: IconFacebook, label: "Facebook" },
  { href: "#", icon: IconTwitter, label: "Twitter" },
  { href: "#", icon: IconInstagram, label: "Instagram" },
  { href: "#", icon: IconYouTube, label: "YouTube" },
  { href: "#", icon: IconLinkedIn, label: "LinkedIn" },
]

/* ------------------------------------------------------------------ */
/*  SocialIcon                                                         */
/* ------------------------------------------------------------------ */

function SocialIcon({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType
  label: string
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-[#1e1e1e] hover:bg-gradient-to-r hover:from-[#0040a4] hover:to-[#1a6fe0] hover:text-white hover:scale-110 transition-all duration-300"
      aria-label={label}
    >
      <Icon />
    </a>
  )
}

/* ------------------------------------------------------------------ */
/*  FooterColumn                                                       */
/* ------------------------------------------------------------------ */

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div className="section-accent">
      <h3 className="font-bold text-sm text-[#1e1e1e] mb-5 uppercase tracking-[0.1em]">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map(({ href, label }) => (
          <li key={href + label}>
            <Link
              href={href}
              className="text-sm text-[#1e1e1e] hover:text-[var(--DTPrimaryColor)] transition-[var(--DTBaseTransition)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  PublicFooter                                                       */
/* ------------------------------------------------------------------ */

export function PublicFooter() {
  return (
    <footer
      className="bg-white"
      role="contentinfo"
    >
      {/* Gradient Divider */}
      <div className="gradient-divider" />
      {/* Main section: 4-column grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Brand + Description + Social */}
          <div className="flex flex-col gap-4">
            {/* Logo + Brand */}
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Next AI Teknoloji"
                width={240}
                height={80}
                className="h-20 w-auto object-contain"
                data-testid="footer-logo"
              />
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 leading-relaxed">
              Teknoloji ve yeniliğe dayalı çözümler sunan, müşteri memnuniyetini
              önceliklendiren güvenilir teknoloji partneriniz.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ href, icon, label }) => (
                <SocialIcon key={label} href={href} icon={icon} label={label} />
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <FooterColumn title="Bizi Tanıyın" links={knowUsLinks} />

          {/* Column 3: Customer Service */}
          <FooterColumn title="Müşteri Hizmetleri" links={supportLinks} />

          {/* Column 4: Contact Info */}
          <div className="section-accent">
            <h3 className="font-bold text-sm text-[#1e1e1e] mb-5 uppercase tracking-[0.1em]">
              İletişim Bilgileri
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <IconMapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--DTPrimaryColor)]" />
                <span className="text-sm text-gray-600">
                  Esentepe Mh. Sancad Cad. Real Tower Plaza K:2 D:14
                  Corlu/Tekirdag
                </span>
              </li>
              <li className="flex items-center gap-2">
                <IconPhone className="w-5 h-5 flex-shrink-0 text-[var(--DTPrimaryColor)]" />
                <a
                  href="tel:+905529895959"
                  className="text-sm text-gray-600 hover:text-[var(--DTPrimaryColor)] transition-[var(--DTBaseTransition)]"
                >
                  0 552 989 5959
                </a>
              </li>
              <li className="flex items-center gap-2">
                <IconMail className="w-5 h-5 flex-shrink-0 text-[var(--DTPrimaryColor)]" />
                <a
                  href="mailto:info@next-ai.com.tr"
                  className="text-sm text-gray-600 hover:text-[var(--DTPrimaryColor)] transition-[var(--DTBaseTransition)]"
                >
                  info@next-ai.com.tr
                </a>
              </li>
              <li className="flex items-start gap-2">
                <IconClock className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--DTPrimaryColor)]" />
                <span className="text-sm text-gray-600">
                  Pzt - Cum: 09:00 - 18:00
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar: Copyright + Legal */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              &copy; {new Date().getFullYear()} Next AI Teknoloji. Tüm hakları
              saklıdır.
            </p>
            <div className="flex gap-6">
              {policyLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="hover:text-[var(--DTPrimaryColor)] transition-[var(--DTBaseTransition)]"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Payment icons */}
            <div className="flex items-center gap-3" data-testid="payment-icons">
              <Image src="/payment/visa.svg" alt="Visa" width={24} height={24} className="h-6" />
              <Image src="/payment/mastercard.svg" alt="Mastercard" width={24} height={24} className="h-6" />
              <Image src="/payment/amex.svg" alt="Amex" width={24} height={24} className="h-6" />
              <Image src="/payment/paypal.svg" alt="PayPal" width={24} height={24} className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
