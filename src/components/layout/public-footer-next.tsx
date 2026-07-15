import Link from "next/link"

/**
 * Public Footer — Yeni Figma tasarımı (Next.js'e uyarlandı)
 * Minimal, dark background, monospace etiket.
 */
export function PublicFooterNext() {
  return (
    <footer className="bg-[#071426] px-6 py-10 text-white md:px-10 font-nx-sans">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link href="/" className="tracking-[-.08em] text-2xl font-extrabold">
          NEXT<span className="text-[#1477ff]">AI</span>
        </Link>
        <span className="font-nx-mono text-[10px] uppercase tracking-[.18em] text-slate-500">
          B2B teknoloji tedarik ve proje platformu
        </span>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400">
          <Link href="/urunler" className="hover:text-white transition">
            Ürünler
          </Link>
          <Link href="/markalar" className="hover:text-white transition">
            Markalar
          </Link>
          <Link href="/bayi-programi" className="hover:text-white transition">
            Bayi Programı
          </Link>
          <Link href="/bayimiz-olun" className="hover:text-white transition">
            Bayimiz Olun
          </Link>
          <span className="font-nx-mono text-[9px] uppercase tracking-[.14em] text-slate-600">
            © {new Date().getFullYear()} Next AI Teknoloji
          </span>
        </div>
      </div>
    </footer>
  )
}
