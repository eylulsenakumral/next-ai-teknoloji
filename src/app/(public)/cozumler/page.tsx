import Link from "next/link"
import { Plus, Shield, Truck, Headphones } from "lucide-react"
import type { ComponentType } from "react"
import {
  IcnCamera,
  IcnNetwork,
  IcnAccessControl,
  IcnSmartHome,
  IcnTarget,
  IcnBriefcase,
  IcnBox,
  IcnTool,
  IcnBuilding,
  IcnFactory,
  IcnSchool,
  IcnHome,
  IcnEnterprise,
  IcnDoor,
  IcnCorridor,
  IcnOutdoor,
  IcnCheckCircle,
  IcnCar,
  IcnCameraGrid,
  IcnFaceId,
  IcnCameraLarge,
  IcnSmartphone,
  IcnBell,
} from "@/components/public/icons-next"
import { Reveal } from "../reveal"
import { getLiveCounts } from "@/lib/settings"
import { getSolutions, getSectors, getReferenceProjects, getFaqs } from "@/lib/content"

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  IcnCamera, IcnNetwork, IcnAccessControl, IcnSmartHome,
  IcnTarget, IcnBriefcase, IcnBox, IcnTool,
  IcnBuilding, IcnFactory, IcnSchool, IcnHome,
  IcnEnterprise, IcnDoor, IcnCorridor, IcnOutdoor,
  IcnCheckCircle, IcnCar, IcnCameraGrid, IcnFaceId,
  IcnCameraLarge, IcnSmartphone, IcnBell,
}

const icon = (name: string) => iconMap[name] ?? IcnTarget

export const metadata = {
  title: "Çözümler — CCTV, Network, Geçiş Kontrol, Akıllı Bina",
  description:
    "Video güvenlik, ağ altyapısı, geçiş kontrol ve akıllı bina çözümleri. Proje bazlı sistem tasarımı, teknik danışmanlık ve bayi avantajları.",
  alternates: { canonical: "/cozumler" },
}

const valueProps = [
  { Icon: IcnTarget, title: "Saha analizi", desc: "Ücretsiz keşif ve ihtiyaç analizi" },
  { Icon: IcnBriefcase, title: "Sistem tasarımı", desc: "Marka & mimari önerisi" },
  { Icon: IcnBox, title: "Tedarik", desc: "Stoklu ürünlerde aynı gün" },
  { Icon: IcnTool, title: "Teknik destek", desc: "7/24 uzaktan yardım" },
]

export default async function CozumlerPage() {
  const [liveCounts, mainSolutions, analyticsSolutions, sectorSolutions, referenceProjects, faqs] =
    await Promise.all([
      getLiveCounts().catch(() => null),
      getSolutions("MAIN").catch(() => []),
      getSolutions("ANALYTICS").catch(() => []),
      getSectors().catch(() => []),
      getReferenceProjects().catch(() => []),
      getFaqs("COZUMLER").catch(() => []),
    ])

  const brandCount = liveCounts ? `${liveCounts.brandCount}+` : "27+"
  const customerCount = liveCounts ? `${liveCounts.customerCount}+` : "340+"

  return (
    <div className="font-nx-sans">
      {/* ─── HERO ─── */}
      <Reveal>
        <section className="relative overflow-hidden border-b border-[#E9F1FC] bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#E9F1FC] via-[#F4F9FE] to-white" />
          <div aria-hidden className="pointer-events-none absolute -top-40 right-[15%] h-[450px] w-[450px] rounded-full bg-[#1852ac]/[0.06] blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-32 h-[350px] w-[350px] rounded-full bg-nx-accent/[0.05] blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              {/* Left — content */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#1852ac]/15 bg-white px-4 py-1.5 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-nx-accent animate-pulse" />
                  <span className="font-nx-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#1852ac]">
                    Çözüm alanları
                  </span>
                </div>

                <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-[#1852ac] md:text-6xl md:leading-[1.05]">
                  Projenizin tüm teknoloji katmanları için
                  <span className="relative ml-2 inline-block bg-gradient-to-r from-[#1852ac] to-[#06B6D4] bg-clip-text text-transparent">
                    tek nokta
                    <svg aria-hidden className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" preserveAspectRatio="none">
                      <path d="M0 4 Q 50 8 100 4" fill="none" stroke="#06B6D4" strokeWidth="2" opacity="0.5" />
                    </svg>
                  </span>
                  <span className="text-[#1852ac]"> çözümü.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">
                  CCTV görüntülemeden ağ omurgasına, geçiş kontrolden akıllı bina otomasyonuna — tüm sistemleri
                  tek bir entegre mimari altında tasarlıyor ve tedarik ediyoruz.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/proje-tasarim"
                    className="group rounded-xl bg-gradient-to-r from-[#1852ac] to-[#06B6D4] px-6 py-4 text-sm font-bold text-white shadow-md shadow-[#1852ac]/20 transition hover:from-[#12408a] hover:to-[#0891B2] hover:shadow-lg hover:shadow-[#1852ac]/25"
                  >
                    Projenizi Tasarlayalım
                    <span aria-hidden className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>
                  <Link
                    href="/teklif-iste"
                    className="rounded-xl border-2 border-[#1852ac]/15 px-6 py-4 text-sm font-bold text-[#1852ac] transition hover:border-[#1852ac]/30 hover:bg-[#1852ac]/[0.03]"
                  >
                    Proje Teklifi İste
                  </Link>
                </div>
              </div>

              {/* Right — solution icon grid */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {mainSolutions.map((s, i) => {
                  const SIcon = icon(s.icon)
                  return (
                  <div
                    key={s.id}
                    className="group relative overflow-hidden rounded-2xl border border-[#E9F1FC] bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:border-[#1852ac]/20"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1852ac]/[0.03] via-transparent to-[#06B6D4]/[0.03] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative flex items-center gap-4">
                      <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-md transition-transform duration-500 group-hover:scale-110`}>
                        <SIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#1852ac]">{s.title}</p>
                        <p className="mt-0.5 font-nx-mono text-[9px] uppercase tracking-[.12em] text-slate-400">
                          {s.tagline}
                        </p>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom — trust cards */}
            <div className="mt-14 grid gap-4 pt-8 border-t border-[#E9F1FC] sm:grid-cols-3">
              <div className="group relative overflow-hidden rounded-2xl border border-[#E9F1FC] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#1852ac]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1852ac]/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1852ac] to-[#06B6D4] text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#1852ac]">{brandCount} Global Marka</p>
                    <p className="text-sm text-slate-500">Yetkili tedarikçi</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-[#E9F1FC] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#1852ac]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1852ac]/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1852ac] to-[#06B6D4] text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#1852ac]">Aynı Gün Sevkiyat</p>
                    <p className="text-sm text-slate-500">Stoklu ürünlerde</p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-[#E9F1FC] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#1852ac]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1852ac]/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1852ac] to-[#06B6D4] text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#1852ac]">7/24 Teknik Destek</p>
                    <p className="text-sm text-slate-500">Uzaktan yardım</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─── SOLUTION BLOCKS ─── */}
      {mainSolutions.map((s, idx) => {
        const SIcon = icon(s.icon)
        return (
        <Reveal key={s.id} delay={idx * 100}>
          <section
            className={
              idx % 2 === 0
                ? "bg-white px-6 py-20 md:px-10"
                : "bg-[var(--color-background)] px-6 py-20 md:px-10"
            }
          >
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white shadow-lg`}>
                      <SIcon className="h-6 w-6" />
                    </span>
                    <span className="font-nx-mono text-[10px] font-bold tracking-[.18em] text-slate-400">
                      {s.number}
                    </span>
                  </div>
                  <h2 className="mt-6 text-3xl font-bold tracking-tight text-[var(--color-primary)] md:text-4xl">
                    {s.title}
                  </h2>
                  <p className="mt-2 font-nx-mono text-[10px] uppercase tracking-[.18em] text-slate-400">
                    {s.tagline}
                  </p>
                  <p className="mt-6 text-sm leading-7 text-slate-600">{s.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {s.brands.map((b) => (
                      <span
                        key={b}
                        className="rounded-full bg-slate-100 px-3 py-1 font-nx-mono text-[10px] font-bold uppercase tracking-wider text-slate-600"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/teklif-iste"
                    className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary)]/90"
                  >
                    Bu Çözüm İçin Teklif Al
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {s.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.03] hover:shadow-sm"
                    >
                      <IcnCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      <p className="text-sm font-semibold text-[var(--color-primary)]">{f}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </Reveal>
        )
      })}

      {/* ─── İLERİ ANALİTİK ÇÖZÜMLER ─── */}
      <Reveal>
        <section className="bg-[#F0F5FF] px-6 py-20 md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[var(--color-primary)]">
                İleri analitik çözümler
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Güvenliği <span className="text-[var(--color-primary)]">akılla</span> buluşturuyoruz.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Standart güvenlik sistemlerinin ötesinde — AI tabanlı plaka tanıma, kişi sayma, yüz tanıma ve
                davranış analitiği ile projelerinizi akıllandırıyoruz.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {analyticsSolutions.map((a) => {
                const AIcon = icon(a.icon)
                return (
                <div
                  key={a.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[var(--color-primary)]/20 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${a.gradient} text-white shadow-md`}>
                      <AIcon className="h-6 w-6" />
                    </span>
                    <h3 className="text-base font-bold leading-snug text-[var(--color-primary)]">
                      {a.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-500">{a.description}</p>
                  <Link
                    href="/teklif-iste"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] transition group-hover:text-[var(--color-primary)]/70"
                  >
                    Teklif Al <span aria-hidden>→</span>
                  </Link>
                </div>
                )
              })}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─── SEKTÖREL ÇÖZÜMLER ─── */}
      <Reveal>
        <section className="bg-[var(--color-primary)] px-6 py-20 text-white md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
                Sektörel çözümler
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Her sektöre özel
                <span className="text-[#a8c4d4]"> tasarım.</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Çözümlerimizi sektörünüze özel ihtiyaçlara göre uyarlıyoruz. Her proje için saha analizi yapıyor,
                sektör standartlarına uygun sistem mimarisi tasarlıyoruz.
              </p>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sectorSolutions.map((sec) => {
                const SecIcon = icon(sec.icon)
                return (
                <div
                  key={sec.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10 hover:border-white/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#8aa8bc]">
                    <SecIcon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold">{sec.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{sec.description}</p>
                </div>
                )
              })}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─── REFERANS PROJELER ─── */}
      <Reveal>
        <section className="bg-white px-6 py-20 md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[var(--color-primary)]">
                Referans projeler
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Türkiye genelinde
                <span className="text-[var(--color-primary)]"> {customerCount} başarılı proje.</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Havalimanından üniversite kampüsüne, otomotiv fabrikasından zincir otellere — her ölçekte
                güvenlik ve network projesini başarıyla teslim ettik.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {referenceProjects.map((p) => {
                const PIcon = icon(p.icon)
                return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[var(--color-primary)]/30 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    <PIcon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[var(--color-primary)]/5 px-2.5 py-0.5 font-nx-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-3 text-sm font-bold leading-snug text-[var(--color-primary)]">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{p.description}</p>
                </div>
                )
              })}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/teklif-iste"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)]/20 px-6 py-4 text-sm font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/5"
              >
                Sizin İçin de Proje Tasarlayalım
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─── VALUE PROPS ─── */}
      <Reveal>
        <section className="bg-[var(--color-primary)] px-6 py-20 text-white md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
                Nasıl çalışıyoruz?
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                İhtiyaçtan teslimata
                <span className="text-[#a8c4d4]"> 4 adım.</span>
              </h2>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {valueProps.map((v) => (
                <div key={v.title}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#8aa8bc]">
                    <v.Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{v.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─── SSS ─── */}
      <Reveal>
        <section className="bg-white px-6 py-20 md:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[var(--color-primary)]">
                SSS
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Çözümler hakkında
                <span className="text-[var(--color-primary)]"> merak edilenler.</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                En sık sorulan sorular ve cevapları. Aklınıza takılan başka bir şey varsa bizimle iletişime geçin.
              </p>
              <Link
                href="/teklif-iste"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary)]/90"
              >
                Bize Ulaşın
              </Link>
            </div>
            <div className="divide-y divide-slate-100 border-y border-slate-100">
              {faqs.map((f) => (
                <details key={f.id} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-bold text-slate-900 marker:content-none">
                    {f.question}
                    <Plus className="h-5 w-5 shrink-0 text-[var(--color-primary)] transition group-open:rotate-45" />
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─── CTA ─── */}
      <Reveal>
        <section className="bg-[var(--color-primary)] px-6 py-20 text-white md:px-10">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-3xl font-bold tracking-[-0.055em] md:text-5xl">
              Projenizi birlikte planlayalım.
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-sm leading-7 text-blue-100">
              2–4 saat içinde teknik ekibimiz size geri döner. Projenizi ücretsiz analiz eder, marka ve ürün
              önerisi hazırlar.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/proje-tasarim"
                className="rounded-xl bg-white px-6 py-4 text-sm font-bold text-[var(--color-primary)] transition hover:bg-blue-50"
              >
                Projenizi Tasarlayalım
              </Link>
              <Link
                href="/teklif-iste"
                className="rounded-xl border border-white/35 px-6 py-4 text-sm font-bold transition hover:bg-white/10"
              >
                Proje Teklifi İste
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  )
}