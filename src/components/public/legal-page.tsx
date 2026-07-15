import type { ReactNode } from "react"

interface LegalSection {
  id?: string
  title: string
  body: ReactNode
}

interface LegalPageProps {
  title: string
  subtitle?: string
  lastUpdated?: string
  intro?: ReactNode
  sections: LegalSection[]
}

/**
 * Ortak legal sayfa şablonu — yeni Figma tasarımıyla uyumlu.
 * Gizlilik politikası, kullanım şartları gibi statik metin sayfaları için.
 */
export function LegalPage({ title, subtitle, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <div className="font-nx-sans">
      {/* Hero */}
      <section className="bg-[#1e3a5f] px-6 py-20 text-white md:px-10 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
            {subtitle ?? "Yasal"}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.055em] md:text-5xl">{title}</h1>
          {lastUpdated && (
            <p className="mt-4 font-nx-mono text-[10px] uppercase tracking-[.14em] text-slate-500">
              Son güncelleme: {lastUpdated}
            </p>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="bg-[#f4f7fa] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-4xl">
          {intro && (
            <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 md:p-8">
              {intro}
            </div>
          )}

          <div className="space-y-4">
            {sections.map((s, i) => (
              <section
                key={i}
                id={s.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8"
              >
                <h2 className="text-lg font-bold tracking-tight text-[#1e3a5f]">{s.title}</h2>
                <div className="mt-3 text-sm leading-7 text-slate-600">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

/** Listeyi yeni tasarıma uygun render eder */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5086a8]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
