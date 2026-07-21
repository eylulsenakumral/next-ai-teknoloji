import Link from "next/link"
import Image from "next/image"

/**
 * Public Footer — Ceron tasarım dili
 * Koyu lacivert (#0F172A), cyan aksan, monospace etiket.
 */
export function PublicFooterNext() {
  return (
    <footer className="bg-nx-dark border-t border-white/10 px-6 py-10 text-white md:px-10 font-nx-sans">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link href="/" aria-label="nexadepo anasayfa">
          <Image
            src="/images/logo-dark.png"
            alt="nexadepo"
            width={2172}
            height={724}
            className="h-10 w-auto"
          />
        </Link>
        <span className="font-nx-mono text-[10px] uppercase tracking-[.18em] text-slate-400">
          B2B teknoloji tedarik ve proje platformu
        </span>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400">
          <Link href="/katalog" className="hover:text-nx-accent transition">
            Ürünler
          </Link>
          <Link href="/markalar" className="hover:text-nx-accent transition">
            Markalar
          </Link>
          <Link href="/bayi-programi" className="hover:text-nx-accent transition">
            Bayi Programı
          </Link>
          <Link href="/bayimiz-olun" className="hover:text-nx-accent transition">
            Bayimiz Olun
          </Link>
          <span className="font-nx-mono text-[9px] uppercase tracking-[.14em] text-slate-500">
            © {new Date().getFullYear()} Next AI Teknoloji
          </span>
        </div>
      </div>
    </footer>
  )
}
