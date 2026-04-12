import Link from "next/link"

/* ------------------------------------------------------------------ */
/*  Link data                                                          */
/* ------------------------------------------------------------------ */

const quickLinks = [
  { href: "/", label: "Anasayfa" },
  { href: "/hakkimizda", label: "Hakkimizda" },
  { href: "/iletisim", label: "Iletisim" },
]

const categoryLinks = [
  { href: "/katalog?categorySlug=aydinlatma", label: "Aydinlatma" },
  { href: "/katalog?categorySlug=kablolar", label: "Kablolar" },
  { href: "/katalog?categorySlug=sigortalar", label: "Sigortalar" },
  { href: "/katalog?categorySlug=prizler", label: "Prizler & Anahtarlar" },
  { href: "/katalog?categorySlug=panolar", label: "Panolar" },
]

const corporateLinks = [
  { href: "/kullanim", label: "Kullanim Kosullari" },
  { href: "/gizlilik", label: "Gizlilik Politikasi" },
  { href: "/cerez", label: "Cerez Politikasi" },
]

const supportLinks = [
  { href: "/sss", label: "SSS" },
  { href: "/iade", label: "Iade ve Degisim" },
  { href: "/kargo", label: "Kargo Takibi" },
]

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                    */
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
/*  Social Icon SVGs                                                    */
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
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-[var(--DTPrimaryColor)] transition-[var(--DTBaseTransition)]"
      aria-label={label}
    >
      <span className="text-white">
        <Icon />
      </span>
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
    <div>
      <h3 className="font-bold text-sm text-white mb-5">{title}</h3>
      <ul className="space-y-2.5">
        {links.map(({ href, label }) => (
          <li key={href + label}>
            <Link
              href={href}
              className="text-sm text-[#bebebe] hover:text-[#2189ff] transition-[var(--DTBaseTransition)]"
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
/*  PublicFooter                                                        */
/* ------------------------------------------------------------------ */

export function PublicFooter() {
  return (
    <footer
      className="bg-[#1e1e1e] text-white mt-auto"
      style={{ borderRadius: "0px", padding: "0" }}
      role="contentinfo"
    >
      {/* Top section: Logo + Contact */}
      <div
        className="max-w-[var(--DTContainer)] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8"
        style={{ padding: "var(--DTGutter_Width)" }}
      >
        <div className="flex flex-col gap-4 mb-10">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <div
              data-testid="footer-logo"
              className="w-10 h-10 rounded-[20px] bg-[var(--DTPrimaryColor)] flex items-center justify-center"
            >
              <IconZap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Next AI Teknoloji
            </span>
          </div>

          {/* Contact rows */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <IconMapPin className="h-4 w-4 text-[var(--DTPrimaryColor)] shrink-0" />
              <span className="text-sm text-[#bebebe]">
                Esentepe Mh. Sancad Cad. Real Tower Plaza K:2 D:14
                Corlu/Tekirdag
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconPhone className="h-4 w-4 text-[var(--DTPrimaryColor)] shrink-0" />
              <a
                href="tel:+905529895959"
                className="text-sm text-[#bebebe] hover:text-[#2189ff] transition-[var(--DTBaseTransition)]"
              >
                0 552 989 5959
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <IconMail className="h-4 w-4 text-[var(--DTPrimaryColor)] shrink-0" />
              <a
                href="mailto:info@next-ai.com.tr"
                className="text-sm text-[#bebebe] hover:text-[#2189ff] transition-[var(--DTBaseTransition)]"
              >
                info@next-ai.com.tr
              </a>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-2 mt-1">
            {socialLinks.map(({ href, icon, label }) => (
              <SocialIcon key={label} href={href} icon={icon} label={label} />
            ))}
          </div>
        </div>

        {/* 4-column grid */}
        <div className="border-t border-[#e9e9e9]/20 pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <FooterColumn title="Hizli Menu" links={quickLinks} />
            <FooterColumn title="Kategoriler" links={categoryLinks} />
            <FooterColumn title="Kurumsal" links={corporateLinks} />
            <FooterColumn title="Destek" links={supportLinks} />
          </div>
        </div>
      </div>

      {/* Bottom bar: Copyright + Payment */}
      <div className="border-t border-[#e9e9e9]/20">
        <div className="max-w-[var(--DTContainer)] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
            <p className="text-sm text-[#bebebe]">
              &copy; {new Date().getFullYear()} Next AI Teknoloji. Tum haklari
              saklidir.
            </p>

            {/* Payment icons - 6 methods */}
            <div
              className="flex items-center gap-3"
              data-testid="payment-icons"
            >
              {/* Kredi Karti (VISA) */}
              <div className="flex items-center justify-center w-[42px] h-[26px] bg-white rounded-sm">
                <span className="text-[9px] font-bold text-[#1a1f71]">
                  VISA
                </span>
              </div>
              {/* Debit (Mastercard) */}
              <div className="flex items-center justify-center w-[42px] h-[26px] bg-white rounded-sm">
                <span className="text-[8px] font-bold text-[#eb001b]">
                  Mastercard
                </span>
              </div>
              {/* PayPal */}
              <div className="flex items-center justify-center px-1.5 h-[26px] bg-white rounded-sm">
                <span className="text-[8px] font-bold text-[#003087]">
                  PayPal
                </span>
              </div>
              {/* EFT / Havale */}
              <div className="flex items-center justify-center px-1.5 h-[26px] bg-white rounded-sm">
                <span className="text-[8px] font-bold text-[#1e1e1e]">
                  EFT
                </span>
              </div>
              {/* Kapida Odeme */}
              <div className="flex items-center justify-center px-1.5 h-[26px] bg-white rounded-sm">
                <span className="text-[7px] font-bold text-[#1e1e1e]">
                  Kapida
                </span>
              </div>
              {/* Google Pay */}
              <div className="flex items-center justify-center px-1.5 h-[26px] bg-white rounded-sm">
                <span className="text-[8px] font-bold text-[#4285f4]">
                  Google Pay
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
