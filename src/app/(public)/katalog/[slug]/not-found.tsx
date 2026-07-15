import Link from "next/link"
import { PackageSearch, ChevronRight } from "lucide-react"

export default function ProductNotFound() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col items-center justify-center text-center gap-4 rounded-[20px] border border-[#f0f0f0] bg-[#f4f7fa] p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f0f0]">
          <PackageSearch className="h-8 w-8 text-[#64748b]" aria-hidden />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#333333]">
            Ürün Bulunamadı
          </h1>
          <p className="text-sm text-[#64748b] max-w-md">
            Aradığınız ürün mevcut değil, kaldırılmış ya da bağlantı hatalı
            olabilir. Ürün kataloğundan aramaya devam edebilirsiniz.
          </p>
        </div>

        <Link
          href="/katalog"
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#5086a8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5086a8]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5086a8] focus-visible:ring-offset-2"
        >
          Kataloğa Dön
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
