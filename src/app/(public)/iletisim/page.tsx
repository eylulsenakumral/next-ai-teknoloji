"use client"

import { useState } from "react"
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
} from "lucide-react"

const socialLinks = [
  { name: "Facebook", href: "https://facebook.com/nextaiteknoloji" },
  { name: "Instagram", href: "https://instagram.com/nextaiteknoloji" },
  { name: "LinkedIn", href: "https://linkedin.com/company/nextaiteknoloji" },
  { name: "Twitter", href: "https://twitter.com/nextaiteknoloji" },
]

export default function IletisimPage() {
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormStatus("sending")
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      })
      if (res.ok) {
        setFormStatus("sent")
      } else {
        setFormStatus("error")
      }
    } catch {
      setFormStatus("error")
    }
  }

  return (
    <div className="bg-white">
      <div className="max-w-[1000px] mx-auto px-[var(--DTContainer_Spacing,40px)] py-16">
        <h1 className="text-[var(--DTFontSize_H2,48px)] font-bold text-[#1e1e1e] mb-10">
          İletişim
        </h1>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-6">Bize Yazın</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="block text-[13px] font-semibold text-[#1e1e1e] mb-1.5">
                  İsim *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  aria-label="İsim"
                  className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[14px] text-[#1e1e1e] focus:outline-none focus:border-[#0040a4] focus:ring-1 focus:ring-[#0040a4]/20"
                  placeholder="Adınız Soyadınız"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-[13px] font-semibold text-[#1e1e1e] mb-1.5">
                  E-posta *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  aria-label="E-posta"
                  className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[14px] text-[#1e1e1e] focus:outline-none focus:border-[#0040a4] focus:ring-1 focus:ring-[#0040a4]/20"
                  placeholder="ornek@firma.com"
                />
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-[13px] font-semibold text-[#1e1e1e] mb-1.5">
                  Telefon
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  aria-label="Telefon"
                  className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[14px] text-[#1e1e1e] focus:outline-none focus:border-[#0040a4] focus:ring-1 focus:ring-[#0040a4]/20"
                  placeholder="05XX XXX XX XX"
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-[13px] font-semibold text-[#1e1e1e] mb-1.5">
                  Konu *
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  required
                  aria-label="Konu"
                  className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[14px] text-[#1e1e1e] focus:outline-none focus:border-[#0040a4] focus:ring-1 focus:ring-[#0040a4]/20"
                  placeholder="Mesajınızın konusu"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-[13px] font-semibold text-[#1e1e1e] mb-1.5">
                  Mesaj *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  aria-label="Mesaj"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-[14px] text-[#1e1e1e] focus:outline-none focus:border-[#0040a4] focus:ring-1 focus:ring-[#0040a4]/20 resize-y"
                  placeholder="Mesajınızı yazın..."
                />
              </div>

              <button
                type="submit"
                disabled={formStatus === "sending"}
                className="inline-flex items-center gap-2 h-12 px-8 bg-[#0040a4] text-white font-bold text-[14px] rounded-lg hover:bg-[#1e1e1e] transition-all duration-300 disabled:opacity-50"
                aria-label="Gönder"
              >
                <Send className="h-4 w-4" aria-hidden />
                {formStatus === "sending" ? "Gönderiliyor..." : "Gönder"}
              </button>

              {formStatus === "sent" && (
                <p className="text-emerald-600 text-sm font-medium">
                  Mesajınız başarıyla gönderildi!
                </p>
              )}
              {formStatus === "error" && (
                <p className="text-red-600 text-sm font-medium">
                  Bir hata oluştu. Lütfen tekrar deneyin.
                </p>
              )}
            </form>
          </section>

          {/* Contact Info */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-6">İletişim Bilgileri</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#0040a4]/10 rounded-lg shrink-0">
                  <MapPin className="h-5 w-5 text-[#0040a4]" aria-hidden />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1e1e1e] mb-1">Adres</p>
                  <p className="text-[14px] text-[#555555] leading-relaxed">
                    Esentepe Mh. Büyükdere Cd. No:123<br />
                    Şişli, İstanbul 34394
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#0040a4]/10 rounded-lg shrink-0">
                  <Phone className="h-5 w-5 text-[#0040a4]" aria-hidden />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1e1e1e] mb-1">Telefon</p>
                  <a href="tel:+905529895959" className="text-[14px] text-[#0040a4] hover:underline">
                    0 552 989 5959
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#0040a4]/10 rounded-lg shrink-0">
                  <Mail className="h-5 w-5 text-[#0040a4]" aria-hidden />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1e1e1e] mb-1">E-posta</p>
                  <a href="mailto:info@next-ai.com.tr" className="text-[14px] text-[#0040a4] hover:underline">
                    info@next-ai.com.tr
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[#0040a4]/10 rounded-lg shrink-0">
                  <Clock className="h-5 w-5 text-[#0040a4]" aria-hidden />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1e1e1e] mb-1">Çalışma Saatleri</p>
                  <p className="text-[14px] text-[#555555]">
                    Pazartesi - Cuma: 09:00 - 18:00
                  </p>
                  <p className="text-[14px] text-[#555555]">
                    Cumartesi - Pazar: Kapalı
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-8">
              <h3 className="text-[13px] font-bold text-[#1e1e1e] mb-3 uppercase tracking-wider">
                Sosyal Medya
              </h3>
              <div className="flex gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="social-link"
                    className="w-10 h-10 flex items-center justify-center bg-[#f3f3f3] rounded-lg text-[#767676] hover:bg-[#0040a4] hover:text-white transition-all text-[12px] font-bold"
                    aria-label={link.name}
                  >
                    {link.name[0]}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
