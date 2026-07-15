"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Building2,
  FileText,
  Truck,
  Users,
  TrendingUp,
  Clock,
  Check,
  ArrowRight,
  Send,
} from "lucide-react"

const benefits = [
  {
    icon: FileText,
    title: "Özel Fiyatlandırma",
    description: "Hacimli alımlarınız için özel kurumsal fiyatlar ve indirimler",
  },
  {
    icon: Truck,
    title: "Öncelikli Teslimat",
    description: "Acil projeleriniz için hızlı kargo ve özel teslimat seçenekleri",
  },
  {
    icon: Users,
    title: "Özel Hesap Yöneticisi",
    description: "Size özel çözüm ortağınız ve 7/24 destek",
  },
  {
    icon: TrendingUp,
    title: "Stok Garantisi",
    description: "Proje ihtiyaçlarınız için stok rezervasyonu ve planlama",
  },
  {
    icon: Clock,
    title: "Vadeli Ödeme",
    description: "Esnek ödeme koşulları ve 30-60-90 gün vade seçenekleri",
  },
  {
    icon: Building2,
    title: "Toplu Sipariş",
    description: "Büyük hacimli siparişler için özel destek ve lojistik",
  },
]

const packages = [
  {
    name: "Başlangıç",
    description: "Küçük işletmeler için",
    minOrder: "5.000₺",
    discount: "%5",
    features: [
      "Özel fiyatlandırma",
      "Standart teslimat",
      "E-posta desteği",
      "Aylık fatura",
    ],
    popular: false,
  },
  {
    name: "Profesyonel",
    description: "Orta ölçekli firmalar için",
    minOrder: "25.000₺",
    discount: "%10",
    features: [
      "Tüm Başlangıç özellikleri",
      "Hesap yöneticisi",
      "Öncelikli teslimat",
      "Telefon desteği",
      "30 gün vade",
      "Stok rezervasyonu",
    ],
    popular: true,
  },
  {
    name: "Kurumsal",
    description: "Büyük organizasyonlar için",
    minOrder: "100.000₺",
    discount: "%15+",
    features: [
      "Tüm Profesyonel özellikleri",
      "Özel fiyat anlaşması",
      "60-90 gün vade",
      "7/24 öncelikli destek",
      "Teknik danışmanlık",
      "Özel lojistik çözümleri",
    ],
    popular: false,
  },
]

function QuoteForm() {
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormStatus("sending")
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.get("companyName"),
          contactName: formData.get("contactName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          sector: formData.get("sector"),
          message: formData.get("message"),
          type: "B2B_QUOTE",
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

  if (formStatus === "sent") {
    return (
      <div className="bg-white border border-[#eeeeee] p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-[18px] font-bold text-[#453e71] mb-2">Talebiniz Alındı!</h3>
        <p className="text-[14px] text-[#64748b]">
          24 saat içinde size özel teklifimizi ileteceğiz.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#eeeeee] p-8">
      <h3 className="text-[20px] font-bold text-[#453e71] mb-6">Teklif Formu</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[#453e71] mb-1.5">
            Şirket Adı *
          </label>
          <input
            name="companyName"
            type="text"
            required
            className="w-full h-11 border border-[#eeeeee] px-4 text-[14px] text-[#453e71] focus:outline-none focus:border-[#5086a8] focus:ring-1 focus:ring-[#5086a8]/20"
            placeholder="Şirketinizin adını girin"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#453e71] mb-1.5">
              Ad Soyad *
            </label>
            <input
              name="contactName"
              type="text"
              required
              className="w-full h-11 border border-[#eeeeee] px-4 text-[14px] text-[#453e71] focus:outline-none focus:border-[#5086a8] focus:ring-1 focus:ring-[#5086a8]/20"
              placeholder="Adınız"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#453e71] mb-1.5">
              Telefon *
            </label>
            <input
              name="phone"
              type="tel"
              required
              className="w-full h-11 border border-[#eeeeee] px-4 text-[14px] text-[#453e71] focus:outline-none focus:border-[#5086a8] focus:ring-1 focus:ring-[#5086a8]/20"
              placeholder="+90 5XX XXX XX XX"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#453e71] mb-1.5">
            E-posta *
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full h-11 border border-[#eeeeee] px-4 text-[14px] text-[#453e71] focus:outline-none focus:border-[#5086a8] focus:ring-1 focus:ring-[#5086a8]/20"
            placeholder="ornek@sirket.com"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#453e71] mb-1.5">
            Sektör
          </label>
          <select
            name="sector"
            className="w-full h-11 border border-[#eeeeee] px-4 text-[14px] text-[#453e71] focus:outline-none focus:border-[#5086a8] focus:ring-1 focus:ring-[#5086a8]/20 bg-white"
          >
            <option value="">Seçiniz</option>
            <option value="imalat">İmalat</option>
            <option value="egitim">Eğitim</option>
            <option value="teknoloji">Teknoloji</option>
            <option value="saglik">Sağlık</option>
            <option value="diger">Diğer</option>
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#453e71] mb-1.5">
            İhtiyaçlarınız *
          </label>
          <textarea
            name="message"
            required
            rows={4}
            className="w-full border border-[#eeeeee] px-4 py-3 text-[14px] text-[#453e71] focus:outline-none focus:border-[#5086a8] focus:ring-1 focus:ring-[#5086a8]/20 resize-none"
            placeholder="Hangi ürünlere ihtiyacınız var? Tahmini sipariş miktarınız nedir?"
          />
        </div>

        {formStatus === "error" && (
          <p className="text-red-600 text-[13px] font-medium">
            Bir hata oluştu. Lütfen tekrar deneyin.
          </p>
        )}

        <button
          type="submit"
          disabled={formStatus === "sending"}
          className="w-full h-12 bg-[#5086a8] text-white font-bold text-[14px] hover:bg-[#453e71] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {formStatus === "sending" ? "Gönderiliyor..." : "Teklif İste"}
        </button>
      </form>
    </div>
  )
}

export default function KurumsalPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#5086a8] to-[#4da6ff] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block px-4 py-2 bg-white/20 text-[13px] font-semibold mb-6">
              Kurumsal Çözümler
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
              İşletmeniz İçin Profesyonel Teknoloji Tedariki
            </h1>
            <p className="text-[17px] text-white/90 mb-8 leading-relaxed">
              5.000'den fazla kurumsal müşterimize özel fiyatlandırma, stok garantisi ve teknik destek sunuyoruz.
            </p>
            <a
              href="#teklif"
              className="inline-flex items-center gap-2 h-12 px-8 bg-white text-[#5086a8] font-bold text-[14px] hover:bg-white/90 transition-colors"
            >
              Hemen Başvur
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[34px] font-black text-[#453e71] mb-4">
              Kurumsal Avantajlar
            </h2>
            <p className="text-[15px] text-[#64748b] max-w-2xl mx-auto">
              İşletmenizin ihtiyaçlarına özel tasarlanmış çözümler
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white border border-[#eeeeee] p-6 hover:border-[#5086a8]/40 hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 bg-[#5086a8]/10 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-[#5086a8]" aria-hidden />
                </div>
                <h3 className="text-[16px] font-bold text-[#453e71] mb-2">{benefit.title}</h3>
                <p className="text-[14px] text-[#64748b] leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-[#f4f7fa]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[34px] font-black text-[#453e71] mb-4">
              Kurumsal Paketler
            </h2>
            <p className="text-[15px] text-[#64748b] max-w-2xl mx-auto">
              İşletmenizin büyüklüğüne uygun paket seçenekleri
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`bg-white p-8 ${
                  pkg.popular
                    ? "border-2 border-[#5086a8] shadow-lg scale-105"
                    : "border border-[#eeeeee]"
                }`}
              >
                {pkg.popular && (
                  <div className="bg-[#5086a8] text-white text-[12px] font-bold px-3 py-1 inline-block mb-4 uppercase tracking-wider">
                    En Popüler
                  </div>
                )}
                <h3 className="text-[22px] font-black text-[#453e71] mb-2">{pkg.name}</h3>
                <p className="text-[14px] text-[#64748b] mb-6">{pkg.description}</p>

                <div className="mb-4">
                  <div className="text-[12px] text-[#64748b] mb-1 uppercase tracking-wider">Minimum Sipariş</div>
                  <div className="text-[28px] font-black text-[#5086a8]">{pkg.minOrder}</div>
                </div>

                <div className="mb-6">
                  <div className="text-[12px] text-[#64748b] mb-1 uppercase tracking-wider">İndirim Oranı</div>
                  <div className="text-[22px] font-black text-[#453e71]">{pkg.discount}</div>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#5086a8] flex-shrink-0 mt-0.5" />
                      <span className="text-[13px] text-[#555555]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#teklif"
                  className={`block w-full h-11 flex items-center justify-center font-bold text-[14px] transition-all duration-200 ${
                    pkg.popular
                      ? "bg-[#5086a8] text-white hover:bg-[#453e71]"
                      : "border-2 border-[#5086a8] text-[#5086a8] hover:bg-[#5086a8]/5"
                  }`}
                >
                  Başvur
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="teklif" className="py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-[28px] sm:text-[34px] font-black text-[#453e71] mb-6">
                Hızlı Teklif Alın
              </h2>
              <p className="text-[16px] text-[#64748b] mb-8 leading-relaxed">
                İhtiyaçlarınızı belirtin, size özel fiyat teklifimizi 24 saat içinde ilelim.
              </p>

              <div className="space-y-4">
                {[
                  "24 saat içinde yanıt",
                  "Ücretsiz danışmanlık",
                  "Özel fiyat teklifi",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#5086a8]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-[#5086a8]" />
                    </div>
                    <span className="text-[15px] text-[#555555]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-[#eeeeee]">
                <p className="text-[13px] text-[#64748b] mb-3">Veya doğrudan ulaşın:</p>
                <Link
                  href="/iletisim"
                  className="inline-flex items-center gap-2 text-[#5086a8] font-semibold text-[14px] hover:underline"
                >
                  İletişim sayfasına git
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <QuoteForm />
          </div>
        </div>
      </section>
    </div>
  )
}
