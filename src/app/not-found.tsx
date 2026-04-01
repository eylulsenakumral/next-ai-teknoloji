import Link from "next/link"
import { Cpu, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center max-w-sm gap-6">
        {/* Logo / ikon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Cpu className="w-8 h-8 text-primary" aria-hidden />
        </div>

        {/* 404 */}
        <div className="space-y-2">
          <p className="text-7xl font-black text-primary/20 leading-none select-none">
            404
          </p>
          <h1 className="text-xl font-bold text-foreground">
            Sayfa Bulunamadı
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
          </p>
        </div>

        {/* Aksiyonlar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg h-8 px-2.5 text-sm font-medium bg-primary text-primary-foreground transition-all hover:bg-primary/80"
          >
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/urunler"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg h-8 px-2.5 text-sm font-medium border border-border bg-background hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Ürünlere Git
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-4 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Next AI Teknoloji
      </footer>
    </div>
  )
}
