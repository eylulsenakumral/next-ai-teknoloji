import { Star, Quote } from "lucide-react"
import { Reveal } from "../reveal"

export function TestimonialsSection() {
  return (
    <section className="bg-[#EFFAF3] py-20">
      <Reveal>
      <div className="mx-auto max-w-7xl px-6">
      <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
            Referanslar
          </span>
          <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight text-nx-dark md:text-4xl">
            Gerçek sonuçlar, gerçek bayi yorumları
          </h2>
          <p className="mt-3 text-slate-500">340+ aktif bayinin nexadepo deneyiminden öne çıkanlar.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-slate-100 bg-white p-8">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="mt-4 text-4xl font-nx-heading font-extrabold text-nx-dark">4.8/5</p>
            <p className="mt-1 text-sm text-slate-500">Bayi memnuniyet skoru</p>
            <p className="mt-6 text-sm leading-6 text-slate-600">
              340+ aktif bayi ve binlerce proje ile Türkiye genelinde güvenilir tedarik.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-8">
            <Quote className="h-10 w-10 text-nx-accent/40" />
            <p className="mt-4 text-lg leading-8 text-slate-700">
              &ldquo;Proje bazlı teklif süreci çok hızlı. Teknik ekip kamera ve network mimarisini
              baştan tasarladı, aynı gün stoktan sevkiyat yaptılar. Müşterilerimize kurulum
              artık çok daha sorunsuz.&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-nx-accent font-bold text-white">
                MK
              </div>
              <div>
                <p className="font-bold text-nx-dark">Mehmet K.</p>
                <p className="text-xs text-slate-500">Sistem Entegratörü, İstanbul</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Reveal>
    </section>
  )
}
