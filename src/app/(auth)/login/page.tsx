"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Headphones,
} from "lucide-react"

type LoginMode = "dealer" | "admin"

// ----------------------------------------------------------------
// Küçük utility — clsx + tailwind-merge yerine inline kullanım
// ----------------------------------------------------------------
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

const NEXTAUTH_ERROR_MAP: Record<string, string> = {
  CredentialsSignin: "Bayi kodu veya şifre hatalı.",
  SessionRequired: "Bu sayfayı görüntülemek için giriş yapmalısınız.",
  Default: "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const urlError = searchParams.get("error")

  const [mode, setMode] = useState<LoginMode>("dealer")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  // NextAuth redirect ile gelen hataları yakala
  useEffect(() => {
    if (urlError) {
      setError(NEXTAUTH_ERROR_MAP[urlError] ?? NEXTAUTH_ERROR_MAP.Default)
    }
  }, [urlError])

  // Dealer form state
  const [dealerCode, setDealerCode] = useState("")
  const [dealerPassword, setDealerPassword] = useState("")
  const [showDealerPw, setShowDealerPw] = useState(false)

  // Admin form state
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [showAdminPw, setShowAdminPw] = useState(false)

  async function handleDealerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn("dealer-credentials", {
        dealerCode: dealerCode.trim().toUpperCase(),
        password: dealerPassword,
        redirect: false,
        callbackUrl: callbackUrl || "/",
      })


      if (!result) {
        setError("Sunucu yanıt vermedi. Lütfen tekrar deneyin.")
        return
      }

      if (result.error) {
        // next-auth v4 "CredentialsSignin" genel hata döner
        if (result.error === "CredentialsSignin") {
          setError("Bayi kodu veya şifre hatalı.")
        } else {
          setError(result.error)
        }
        return
      }

      // Başarılı - yönlendir
      window.location.href = result.url || callbackUrl || "/"
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn("admin-credentials", {
        email: adminEmail.trim(),
        password: adminPassword,
        redirect: false,
        callbackUrl: "/admin",
      })


      if (!result) {
        setError("Sunucu yanıt vermedi. Lütfen tekrar deneyin.")
        return
      }

      if (result.error) {
        if (result.error === "CredentialsSignin") {
          setError("E-posta veya şifre hatalı.")
        } else {
          setError(result.error)
        }
        return
      }

      window.location.href = result.url || "/admin"
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  function switchMode(newMode: LoginMode) {
    setMode(newMode)
    setError(null)
    setDealerCode("")
    setDealerPassword("")
    setAdminEmail("")
    setAdminPassword("")
    setShowDealerPw(false)
    setShowAdminPw(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* ======================================================
          SOL PANEL — Form
      ====================================================== */}
      <div className="relative flex w-full flex-col bg-white md:w-1/2">
        {/* Üst çizgi aksanı */}
        <div className="h-1 w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]" />

        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Next AI Teknoloji" width={36} height={36} className="rounded-lg" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-[#0e121a]">Next AI</span>
              <span className="-mt-0.5 text-[11px] text-[#6b7280]">Teknoloji</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 sm:flex">
            <Link
              href="/basvuru"
              className="text-xs font-medium text-[#6b7280] transition-colors hover:text-[var(--color-primary)]"
            >
              Bayilik Başvurusu
            </Link>
            <Link
              href="tel:+905529895959"
              className="text-xs font-medium text-[#6b7280] transition-colors hover:text-[var(--color-primary)]"
            >
              İletişim
            </Link>
          </nav>
        </header>

        {/* Form bölgesi — dikey ortalı */}
        <main id="main-content" className="flex flex-1 items-center justify-center px-8 py-10">
          <div className="w-full max-w-[370px]">
            {/* Başlık */}
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-semibold text-[#0e121a]">
                {mode === "dealer"
                  ? "Next AI Teknoloji'ye Hoş Geldiniz"
                  : "Admin Paneline Giriş"}
              </h1>
              <p className="mt-1 text-sm text-[#6b7280]">
                {mode === "dealer" ? "B2B Bayi Portalı" : "Yönetici Girişi"}
              </p>
            </div>

            {/* Hata mesajı */}
            {error && (
              <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* ---- BAYI FORMU ---- */}
            {mode === "dealer" && (
              <form onSubmit={handleDealerSubmit} className="space-y-4">
                {/* Bayi Kodu */}
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
                      "transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
                      "disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                    )}
                  />
                </div>

                {/* Şifre */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="dealerPassword"
                    className="text-xs font-medium uppercase tracking-wide text-[#374151]"
                  >
                    Şifre
                  </label>
                  <div className="relative">
                    <input
                      id="dealerPassword"
                      name="dealerPassword"
                      type={showDealerPw ? "text" : "password"}
                      placeholder="Şifrenizi girin"
                      value={dealerPassword}
                      onChange={(e) => setDealerPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className={cn(
                        "h-12 w-full border border-[#ccd1db] bg-white px-4 pr-12 text-sm text-[#0e121a]",
                        "placeholder:text-[#9ca3af] outline-none",
                        "transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
                        "disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                      )}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowDealerPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#374151]"
                      aria-label={showDealerPw ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showDealerPw ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Beni Hatırla + Şifremi Unuttum */}
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-[#ccd1db] accent-[var(--color-primary)]"
                    />
                    <span className="text-xs text-[#374151]">Beni Hatırla</span>
                  </label>
                  <Link
                    href="/sifremi-unuttum"
                    className="text-xs text-[var(--color-primary)] transition-colors hover:text-[#456680]"
                  >
                    Şifremi Unuttum?
                  </Link>
                </div>

                {/* Buton */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "flex h-12 w-full items-center justify-center gap-2",
                      "bg-[var(--color-primary)] text-sm font-semibold uppercase tracking-wide text-white",
                      "transition-colors hover:bg-[#162d4a]",
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Giriş yapılıyor...</span>
                      </>
                    ) : (
                      "Giriş Yap"
                    )}
                  </button>
                </div>

                {/* Admin toggle */}
                <p className="pt-1 text-center text-xs text-[#9ca3af]">
                  Yönetici misiniz?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("admin")}
                    className="text-[var(--color-primary)] transition-colors hover:text-[#456680]"
                  >
                    Admin Girişi →
                  </button>
                </p>
              </form>
            )}

            {/* ---- ADMİN FORMU ---- */}
            {mode === "admin" && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* E-posta */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="adminEmail"
                    className="text-xs font-medium tracking-wide text-[#374151]"
                  >
                    E-posta
                  </label>
                  <input
                    id="adminEmail"
                    type="email"
                    inputMode="email"
                    placeholder="admin@nextai.com.tr"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus
                    disabled={isLoading}
                    className={cn(
                      "h-12 w-full border border-[#ccd1db] bg-white px-4 text-sm text-[#0e121a] normal-case",
                      "placeholder:text-[#9ca3af] outline-none",
                      "transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
                      "disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                    )}
                  />
                </div>

                {/* Şifre */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="adminPassword"
                    className="text-xs font-medium tracking-wide text-[#374151]"
                  >
                    Şifre
                  </label>
                  <div className="relative">
                    <input
                      id="adminPassword"
                      type={showAdminPw ? "text" : "password"}
                      placeholder="Şifrenizi girin"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className={cn(
                        "h-12 w-full border border-[#ccd1db] bg-white px-4 pr-12 text-sm text-[#0e121a]",
                        "placeholder:text-[#9ca3af] outline-none",
                        "transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
                        "disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                      )}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowAdminPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#374151]"
                      aria-label={showAdminPw ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showAdminPw ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Giriş Butonu */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "flex h-12 w-full items-center justify-center gap-2",
                    "bg-[var(--color-primary)] text-sm font-semibold uppercase tracking-wide text-white",
                    "transition-colors hover:bg-[#162d4a]",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Giriş yapılıyor...</span>
                    </>
                  ) : (
                    "Admin Girişi Yap"
                  )}
                </button>

                {/* Bayi toggle */}
                <p className="pt-1 text-center text-xs text-[#9ca3af]">
                  Bayi girişi için{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("dealer")}
                    className="text-[var(--color-primary)] transition-colors hover:text-[#456680]"
                  >
                    buraya tıklayın →
                  </button>
                </p>
              </form>
            )}


            {/* ---- KATALOG CTA ---- */}
            <div className="mt-6 border-t border-[#e5e7eb] pt-5 text-center">
              <p className="mb-3 text-xs text-[#9ca3af]">
                Giriş yapmadan ürünlerimizi inceleyin
              </p>
              <Link
                href="/katalog"
                className={cn(
                  "inline-flex h-10 w-full items-center justify-center gap-1.5",
                  "border border-[#ccd1db] text-sm font-medium text-[#374151]",
                  "transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                )}
              >
                Ürün Kataloğunu İncele →
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 pb-6 text-center text-xs text-[#9ca3af]">
          &copy; {new Date().getFullYear()} Next AI Teknoloji. Tüm hakları saklıdır.
        </footer>
      </div>

      {/* ======================================================
          SAĞ PANEL — Tanıtım (sadece md+)
      ====================================================== */}
      <aside
        className="relative hidden flex-col md:flex md:w-1/2"
        style={{
          background: "linear-gradient(-45deg, #000d5e 0%, var(--color-primary) 50%, var(--color-primary) 100%)",
        }}
        aria-hidden="true"
      >
        {/* Hafif desen overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* İçerik — dikey ortalı, sola dayalı */}
        <div className="relative flex flex-1 flex-col justify-center px-14 xl:px-20">
          {/* İstatistikler */}
          <div className="mb-12 grid grid-cols-3 gap-6">
            {[
              { value: "5.000+", label: "Ürün Çeşidi" },
              { value: "150+", label: "Marka" },
              { value: "500+", label: "Aktif Bayi" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/60">{label}</p>
              </div>
            ))}
          </div>

          {/* Ana başlık */}
          <h2 className="mb-3 text-3xl font-bold leading-tight text-white">
            Bayimiz Olmak
            <br />
            İster Misiniz?
          </h2>

          <p className="mb-8 text-base leading-relaxed text-white/75">
            Rekabetçi fiyatlar, geniş ürün yelpazesi ve hızlı teslimat.
            Next AI Teknoloji ile işletmenizi büyütün.
          </p>

          {/* CTA */}
          <Link
            href="/basvuru"
            className={cn(
              "inline-flex w-fit items-center justify-center px-8 py-3.5",
              "border-2 border-white text-sm font-semibold uppercase tracking-wide text-white",
              "transition-all hover:bg-white hover:text-[#456680]"
            )}
          >
            Hemen Başvuru Yap
          </Link>

          {/* Özellikler */}
          <div className="mt-12 flex gap-8">
            {[
              { Icon: Truck, text: "Hızlı Teslimat" },
              { Icon: ShieldCheck, text: "Garantili Ürün" },
              { Icon: Headphones, text: "7/24 Destek" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-2">
                <Icon className="h-5 w-5 text-white/50" />
                <span className="text-xs font-medium text-white/50">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ panel footer */}
        <div className="relative px-14 pb-8 xl:px-20">
          <p className="text-xs text-white/40">
            Next AI Teknoloji B2B Platformu v2.0
          </p>
        </div>
      </aside>
    </div>
  )
}
