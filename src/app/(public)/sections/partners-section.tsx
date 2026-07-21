import { PARTNERS } from "../home-content"

export function PartnersSection() {
  return (
    <section className="border-y border-slate-100 bg-[#F5F5F5] py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center font-nx-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Çözüm Ortaklarımız
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {PARTNERS.map((p) => (
            <img
              key={p.name}
              src={p.img}
              alt={p.name}
              className="h-9 w-auto grayscale opacity-50 transition duration-300 hover:grayscale-0 hover:opacity-100"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
