"use client"

import { useState } from "react"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("loading")

    try {
      // TODO: Wire to real /api/newsletter/subscribe endpoint
      // Currently stubbed for demo
      await new Promise<void>((resolve) => setTimeout(resolve, 1000))
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  return (
    <section className="py-16 bg-[var(--color-background)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--color-background)] rounded-lg p-12">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-2">Bültenimize Abone Olun</h2>
              <p className="text-gray-600">Yeni ürünler ve özel teklifler hakkında güncel kalın</p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-[var(--color-primary)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#1a6fd4] transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
                >
                  {status === "loading" ? "Kaydediliyor..." : "Abone Ol"}
                </button>
              </form>
              {status === "success" && (
                <p className="text-emerald-600 text-sm">Abone olduğunuz için teşekkürler!</p>
              )}
              {status === "error" && (
                <p className="text-red-500 text-sm">Bir hata oluştu. Lütfen tekrar deneyin.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
