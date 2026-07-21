import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Reveal } from "../reveal"
import { WHY } from "../home-content"

export function WhySection() {
  return (
    <section className="bg-white py-20">
      <Reveal>
      <div className="mx-auto grid max-w-[1300px] gap-[15px] px-6 lg:grid-cols-2">
        {/* Sol: görsel kart + başlık */}
        <div className="relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[15px] p-8">
          <Image
            src="/images/cards/why.jpg"
            alt="nexadepo depo ve lojistik"
            fill
            sizes="(max-width: 1024px) 100vw, 650px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(15,23,42,0.75)_0%,transparent_55%)]" />
          <div className="relative">
            <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
              Neden nexadepo?
            </span>
            <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight text-white md:text-4xl">
              Tedarikçiden fazlası — güçlü bir iş ortağı
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
              Hassasiyet, özen ve projenize özel modern tedarik çözümleriyle kusursuz sonuçlar.
            </p>
          </div>
        </div>
        {/* Sağ: 2x2 pastel kartlar */}
        <div className="grid gap-[15px] sm:grid-cols-2">
          {WHY.map((w) => (
            <div key={w.title} className={`rounded-[15px] p-[30px] ${w.bg}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-nx-accent shadow-sm">
                <w.Icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-nx-dark">{w.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{w.desc}</p>
              <Link
                href="/teklif-iste"
                className="mt-5 inline-flex items-center gap-1 border-b border-nx-dark pb-1 text-xs font-bold uppercase tracking-wider text-nx-dark transition hover:border-nx-accent hover:text-nx-accent"
              >
                İletişime Geç <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  )
}
