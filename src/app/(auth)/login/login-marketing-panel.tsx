"use client"

const ICONS = [
  { icon: "truck", text: "Hızlı Teslimat" },
  { icon: "shield", text: "Garantili Ürün" },
  { icon: "headphones", text: "7/24 Destek" },
]

function IconSvg({ name }: { name: string }) {
  if (name === "truck") {
    return (
      <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    )
  }
  if (name === "shield") {
    return (
      <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  )
}

export function LoginMarketingPanel() {
  const stats = [
    { value: "5.000+", label: "Ürün Çeşidi" },
    { value: "150+", label: "Marka" },
    { value: "500+", label: "Aktif Bayi" },
  ]

  return (
    <aside
      className="relative hidden flex-col md:flex md:w-1/2"
      style={{
        background: "linear-gradient(-45deg, #000d5e 0%, var(--color-primary) 50%, var(--color-primary) 100%)",
      }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px),
                            radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex flex-1 flex-col justify-center px-14 xl:px-20">
        <div className="mb-12 grid grid-cols-3 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/60">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-3 text-3xl font-bold leading-tight text-white">
          Bayimiz Olmak
          <br />
          İster Misiniz?
        </h2>

        <p className="mb-8 text-base leading-relaxed text-white/75">
          Rekabetçi fiyatlar, geniş ürün yelpazesi ve hızlı teslimat.
          Next AI Teknoloji ile işletmenizi büyütün.
        </p>

        <a
          href="/basvuru"
          className="inline-flex w-fit items-center justify-center px-8 py-3.5 border-2 border-white text-sm font-semibold uppercase tracking-wide text-white transition-all hover:bg-white hover:text-[#1E293B]"
        >
          Hemen Başvuru Yap
        </a>

        <div className="mt-12 flex gap-8">
          {ICONS.map(({ icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-2">
              <IconSvg name={icon} />
              <span className="text-xs font-medium text-white/50">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative px-14 pb-8 xl:px-20">
        <p className="text-xs text-white/40">
          Next AI Teknoloji B2B Platformu v2.0
        </p>
      </div>
    </aside>
  )
}