"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

/** Anasayfa newsletter bandı formu — POST /api/newsletter */
export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === "loading") return
    setState("loading")
    setMessage("")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setState("done")
        setMessage(data.message ?? "Aboneliğiniz alındı.")
        setEmail("")
      } else {
        setState("error")
        setMessage(data.error ?? "Bir hata oluştu.")
      }
    } catch {
      setState("error")
      setMessage("Bağlantı hatası, lütfen tekrar deneyin.")
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 rounded-full bg-nx-accent/15 px-6 py-4 text-sm font-semibold text-nx-accent">
        <CheckCircle2 className="h-5 w-5 shrink-0" /> {message}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-posta adresiniz"
        aria-label="E-posta adresiniz"
        className="h-[52px] flex-1 rounded-full border border-white/20 bg-white/10 px-6 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-nx-accent"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-nx-accent px-7 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-nx-dark disabled:opacity-60"
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Abone Ol <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {state === "error" && (
        <p className="text-sm text-rose-300 sm:absolute sm:mt-16">{message}</p>
      )}
    </form>
  )
}
