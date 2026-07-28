import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Phone, Mail } from "lucide-react"

/**
 * Public Footer — Ceron tasarım dili
 * Koyu lacivert (#0F172A), cyan aksan, 4 kolonlu klasik yapı.
 */

const QUICK_LINKS = [
  { label: "Ürünler", href: "/katalog" },
  { label: "Çözümler", href: "/cozumler" },
  { label: "Markalar", href: "/markalar" },
  { label: "Garanti Sorgula", href: "/garanti-sorgula" },
  { label: "Projenizi Tasarlayalım", href: "/proje-tasarim" },
]

const SOLUTION_LINKS = [
  { label: "Güvenlik Kamerası", href: "/kategoriler/guvenlik-kamerasi" },
  { label: "Yangın İhbar", href: "/kategoriler/yangin-ihbar" },
  { label: "Hırsız Alarm", href: "/kategoriler/hirsiz-alarm" },
  { label: "Ağ / Network", href: "/kategoriler/ag-ve-network" },
  { label: "Plaka Okuma", href: "/kategoriler/plaka-okuma" },
]

export function PublicFooterNext() {
  return (
    <footer className="bg-nx-dark font-nx-sans text-white">
      {/* Ana footer */}
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Logo + açıklama */}
        <div className="space-y-5">
          <Link href="/" aria-label="nexadepo anasayfa">
            <Image
              src="/images/logo-dark.png"
              alt="nexadepo"
              width={2172}
              height={724}
              className="h-10 w-auto"
            />
          </Link>
          <p className="max-w-xs text-sm leading-6 text-slate-400">
            27+ global markanın yetkili tedarikçisi. B2B güvenlik ve network tedarikinde proje odaklı çözüm ortağınız.
          </p>
          <Link
            href="/teklif-iste"
            className="inline-flex items-center gap-2 rounded-full bg-nx-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-nx-dark"
          >
            Teklif İste <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Hızlı linkler */}
        <div>
          <h3 className="font-nx-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            Hızlı Erişim
          </h3>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-nx-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Çözümler */}
        <div>
          <h3 className="font-nx-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            Popüler Çözümler
          </h3>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            {SOLUTION_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-nx-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* İletişim */}
        <div>
          <h3 className="font-nx-mono text-xs font-bold uppercase tracking-widest text-slate-400">
            İletişim
          </h3>
          <ul className="mt-5 space-y-4 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-nx-accent" />
              <span>Nusratiye Mh. Uğur Mumcu Cad. No:23/A Çorlu/Tekirdağ</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-nx-accent" />
              <a href="tel:+905529895959" className="transition hover:text-nx-accent">
                0 552 989 59 59
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-nx-accent" />
              <a href="mailto:info@nexadepo.com" className="transition hover:text-nx-accent">
                info@nexadepo.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Alt bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-[11px] font-semibold text-slate-400 sm:flex-row">
          <span className="font-nx-mono uppercase tracking-[.14em] text-slate-500">
            © {new Date().getFullYear()} Next AI Teknoloji
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/gizlilik-politikasi" className="transition hover:text-nx-accent">
              Gizlilik Politikası
            </Link>
            <Link href="/kullanim-sartlari" className="transition hover:text-nx-accent">
              Kullanım Şartları
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
