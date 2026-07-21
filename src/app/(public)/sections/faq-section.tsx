import { Plus } from "lucide-react"
import { Reveal } from "../reveal"
import { FAQS } from "../home-content"

export function FaqSection() {
  return (
    <section className="bg-white py-20">
      <Reveal>
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="font-nx-mono text-xs font-bold uppercase tracking-widest text-nx-accent">
            SSS
          </span>
          <h2 className="mt-3 text-3xl font-nx-heading font-extrabold tracking-tight md:text-4xl">
            Sorularınız mı var? Cevabımız var
          </h2>
          <p className="mt-3 text-slate-500">
            Bayilik, teklif süreçi ve teknik destek hakkında sık sorulan sorular.
          </p>
        </div>
        <div className="divide-y divide-slate-100 border-y border-slate-100">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-bold text-slate-900 marker:content-none">
                {f.q}
                <Plus className="h-5 w-5 shrink-0 text-nx-accent transition group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-500">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  )
}
