"use client"

import { useState } from "react"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("loading")

    try {
      // TODO: Replace with actual API endpoint
      await new Promise<void>((resolve) => setTimeout(resolve, 1000))
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  return (
    <section className="py-16 bg-[#1e1e1e]">
      <div className="max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">Bültenimize Abone Olun</h2>
          <p className="text-white/60 mb-8 text-sm leading-relaxed">
            Yeni ürünler ve özel teklifler hakkında güncel kalın
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-3 rounded-lg bg-white text-[#1e1e1e] placeholder:text-[#1e1e1e]/40 focus:outline-none focus:ring-2 focus:ring-[#2189ff]"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-3 bg-[#2189ff] text-white rounded-lg font-semibold hover:bg-[#1471dd] transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
            >
              {status === "loading" ? "Kaydediliyor..." : "Abone Ol"}
            </button>
          </form>

          {status === "success" && (
            <p className="text-emerald-400 mt-4 text-sm">Abone olduğunuz için teşekkürler!</p>
          )}
          {status === "error" && (
            <p className="text-red-400 mt-4 text-sm">Bir hata oluştu. Lütfen tekrar deneyin.</p>
          )}
        </div>
      </div>
    </section>
  )
}
