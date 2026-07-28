import Image from "next/image"
import { Check } from "lucide-react"
import { Reveal } from "../reveal"
import { AnimatedCounter } from "@/components/animated-counter"
import { ABOUT_FEATURES, STATS } from "../home-content"

export function AboutSection({ stats: externalStats }: { stats?: [string, string][] }) {
  const stats = externalStats ?? STATS
  return (
    <section className="bg-white py-20">
      <Reveal>
      <div className="mx-auto grid max-w-[1300px] items-center gap-12 px-6 md:grid-cols-2">
        <div className="relative">
          <div className="overflow-hidden rounded-[15px]">
            <Image
              src="/images/cards/about.jpg"
              alt="nexadepo tedarik ve proje ekibi"
              width={1300}
              height={440}
              sizes="(max-width: 768px) 100vw, 650px"
              className="h-[440px] w-full object-cover"
            />
          </div>
        </div>
        <div>
          <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
            Hakkımızda
          </span>
          <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
            Güvenlikle, özenle,{" "}
            <span className="font-nx-serif italic text-nx-accent">uzmanla</span>
          </h2>
          <p className="mt-4 leading-7 text-slate-500">
            nexadepo, güvenlik ve network sistemlerinde global güç ile yerel uzmanlığı
            birleştiren bir B2B tedarik platformudur.
          </p>
          {/* Ceron: 3 özellik — cyan daire check + başlık + desc */}
          <div className="mt-8 space-y-5">
            {ABOUT_FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nx-accent/10 text-nx-accent">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-nx-dark">{f.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Ceron: animasyonlu sayaç satırı */}
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-slate-200 pt-7">
            {STATS.map(([val, label]) => (
              <AnimatedCounter key={label} value={val} label={label} />
            ))}
          </div>
        </div>
      </div>
      </Reveal>
    </section>
  )
}
