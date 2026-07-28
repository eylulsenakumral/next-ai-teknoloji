import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import { Reveal } from "../reveal"
import { PROCESS } from "../home-content"

export function ProcessSection() {
  return (
    <section className="bg-[#F0F5FF] py-20">
      <Reveal>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2">
        {/* Sol: başlık + buton + görsel üstünde beyaz pill'ler */}
        <div>
          <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
            Süreç
          </span>
          <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
            Güvenli alana giden basit adımlar
          </h2>
          <p className="mt-3 max-w-md text-slate-500">
            İhtiyaç analizinden kurulum sonrası desteğe kadar uçtan uca proje takibi.
          </p>
          <Link
            href="/teklif-iste"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-nx-accent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-nx-dark"
          >
            Hemen Başla <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="relative mt-8 flex min-h-[350px] flex-col justify-end overflow-hidden rounded-[15px]">
            <Image
              src="/images/cards/process.jpg"
              alt="Saha kurulum ve sistem entegrasyonu"
              fill
              sizes="(max-width: 1024px) 100vw, 650px"
              className="object-cover"
            />
            <div className="relative flex flex-wrap gap-[10px] p-5">
              {["Aynı Gün Sevkiyat", "Sertifikalı Teknik Ekip", "Garanti Takibi"].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 rounded-full bg-white py-[5px] pl-[3px] pr-[10px] text-sm text-nx-dark"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nx-accent/10 text-nx-accent">
                    <Check className="h-4 w-4" />
                  </span>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Sağ: Ceron dashed-border adım kartları + outline numara */}
        <div className="flex flex-col gap-5">
          {PROCESS.map((p) => (
            <div
              key={p.n}
              className="relative flex-1 rounded-[15px] border border-dashed border-slate-300 bg-white p-7 transition-colors duration-300 hover:border-nx-dark"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-7 top-5 font-nx-heading text-[80px] font-extrabold leading-[0.8] text-transparent nx-outline-num"
              >
                {p.n}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-nx-accent/10 text-nx-accent">
                <p.Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-lg font-bold">{p.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  )
}
