"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function SifremiUnuttumPage() {
  const [dealerCode, setDealerCode] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Placeholder: henüz backend endpoint'i yok
    // Gelecekte /api/auth/reset-password endpoint'ine istek atılacak
    await new Promise((r) => setTimeout(r, 1500))
    setSubmitted(true)
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* SOL PANEL */}
      <div className="relative flex w-full flex-col bg-white md:w-1/2">
        <div className="h-1 w-full bg-gradient-to-r from-[#5086a8] to-[#5086a8]" />

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Next AI Teknoloji" width={36} height={36} className="rounded-lg" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-[#0e121a]">Next AI</span>
              <span className="-mt-0.5 text-[11px] text-[#6b7280]">Teknoloji</span>
            </div>
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-1 text-xs font-medium text-[#6b7280] transition-colors hover:text-[#5086a8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Giriş Sayfası
          </Link>
        </header>

        {/* Form bölgesi */}
        <main id="main-content" className="flex flex-1 items-center justify-center px-8 py-10">
          <div className="w-full max-w-[370px]">
            {submitted ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-xl font-semibold text-[#0e121a]">
                  Talebiniz Alındı
                </h1>
                <p className="mt-2 text-sm text-[#6b7280]">
                  Eğer bayi kodu ve e-posta adresiniz sistemimizde kayıtlıysa,
                  şifre sıfırlama bağlantısı kısa süre içinde gönderilecektir.
                </p>
                <Link
                  href="/login"
                  className={cn(
                    "mt-6 inline-flex h-11 w-full items-center justify-center",
                    "bg-[#5086a8] text-sm font-semibold uppercase tracking-wide text-white",
                    "transition-colors hover:bg-[#162d4a]"
                  )}
                >
                  Giriş Sayfasına Dön
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7 text-center">
                  <h1 className="text-2xl font-semibold text-[#0e121a]">
                    Şifremi Unuttum
                  </h1>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Şifre sıfırlama bağlantısı için bilgilerinizi girin
                  </p>
                </div>

                {error && (
                  <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="dealerCode"
                      className="text-xs font-medium uppercase tracking-wide text-[#374151]"
                    >
                      Bayi Kodu
                    </label>
                    <input
                      id="dealerCode"
                      name="dealerCode"
                      type="text"
                      placeholder="Örn: BAY001"
                      value={dealerCode}
                      onChange={(e) => setDealerCode(e.target.value.toUpperCase())}
                      required
                      autoComplete="username"
                      autoFocus
                      disabled={isLoading}
                      className={cn(
                        "h-12 w-full border border-[#ccd1db] bg-white px-4 text-sm text-[#0e121a]",
                        "placeholder:text-[#9ca3af] outline-none",
                        "transition-colors focus:border-[#5086a8] focus:ring-2 focus:ring-[#5086a8]/20",
                        "disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="email"
                      className="text-xs font-medium uppercase tracking-wide text-[#374151]"
                    >
                      E-posta
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      placeholder="bayi@firma.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={isLoading}
                      className={cn(
                        "h-12 w-full border border-[#ccd1db] bg-white px-4 text-sm text-[#0e121a] normal-case",
                        "placeholder:text-[#9ca3af] outline-none",
                        "transition-colors focus:border-[#5086a8] focus:ring-2 focus:ring-[#5086a8]/20",
                        "disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                      )}
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "flex h-12 w-full items-center justify-center gap-2",
                        "bg-[#5086a8] text-sm font-semibold uppercase tracking-wide text-white",
                        "transition-colors hover:bg-[#162d4a]",
                        "disabled:cursor-not-allowed disabled:opacity-60"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Gönderiliyor...</span>
                        </>
                      ) : (
                        "Sıfırlama Linki Gönder"
                      )}
                    </button>
                  </div>
                </form>

                <p className="mt-4 text-center text-xs text-[#9ca3af]">
                  <Link
                    href="/login"
                    className="text-[#5086a8] transition-colors hover:text-[#456680]"
                  >
                    Giriş sayfasına geri dön
                  </Link>
                </p>
              </>
            )}
          </div>
        </main>

        <footer className="px-8 pb-6 text-center text-xs text-[#9ca3af]">
          &copy; {new Date().getFullYear()} Next AI Teknoloji. Tüm hakları saklıdır.
        </footer>
      </div>

      {/* SAĞ PANEL */}
      <aside
        className="relative hidden flex-col md:flex md:w-1/2"
        style={{
          background: "linear-gradient(-45deg, #000d5e 0%, #5086a8 50%, #5086a8 100%)",
        }}
        aria-hidden="true"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative flex flex-1 flex-col items-center justify-center px-14">
          <h2 className="mb-3 text-center text-2xl font-bold text-white">
            Şifre Sıfırlama
          </h2>
          <p className="text-center text-base leading-relaxed text-white/75">
            Bayi kodunuzu ve kayıtlı e-posta adresinizi girerek
            şifre sıfırlama bağlantısı talep edebilirsiniz.
          </p>
        </div>
        <div className="relative px-14 pb-8">
          <p className="text-xs text-white/40">
            Next AI Teknoloji B2B Platformu v2.0
          </p>
        </div>
      </aside>
    </div>
  )
}
