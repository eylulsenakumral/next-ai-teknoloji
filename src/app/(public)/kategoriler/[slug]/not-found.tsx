import Link from "next/link"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function CategoryNotFound() {
  return (
    <div className="bg-[#f9f9f9] min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-[40px] font-extrabold text-[#2189ff] mb-2">404</p>
        <h1 className="text-[22px] font-extrabold text-[#333333] mb-2">
          Kategori Bulunamadi
        </h1>
        <p className="text-[14px] text-[#767676] leading-relaxed mb-8">
          Aradiginiz kategori mevcut degil veya kaldirilmis olabilir.
          Lutfen kategori listesine donup tekrar deneyin.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/kategoriler"
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#2189ff] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#001489] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kategoriler
          </Link>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 h-11 px-6 border border-[#eeeeee] text-[#333333] text-[13px] font-semibold hover:border-[#2189ff] hover:text-[#2189ff] transition-colors"
          >
            <Search className="h-4 w-4" aria-hidden />
            Katalog
          </Link>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 h-11 px-6 border border-[#eeeeee] text-[#333333] text-[13px] font-semibold hover:border-[#2189ff] hover:text-[#2189ff] transition-colors"
          >
            <Home className="h-4 w-4" aria-hidden />
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  )
}
