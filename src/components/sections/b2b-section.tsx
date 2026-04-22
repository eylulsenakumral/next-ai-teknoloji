import Link from "next/link"
import { Building2, BadgePercent, Headphones } from "lucide-react"

interface B2BFeature {
  icon: React.ReactNode
  title: string
  desc: string
}

interface B2BCta {
  label: string
  href: string
}

interface B2BSectionProps {
  heading?: string
  subheading?: string
  features?: B2BFeature[]
  cta?: B2BCta
}

const defaultFeatures: B2BFeature[] = [
  {
    icon: <BadgePercent className="w-8 h-8" aria-hidden />,
    title: "Toptan Fiyatlar",
    desc: "Hacme göre özel fiyatlandırma ve iskonto seçenekleri",
  },
  {
    icon: <Building2 className="w-8 h-8" aria-hidden />,
    title: "Kurumsal Fatura",
    desc: "KDV'li kurumsal fatura ve muhasebe entegrasyonu",
  },
  {
    icon: <Headphones className="w-8 h-8" aria-hidden />,
    title: "Özel Destek Hattı",
    desc: "Bayi müşterilerine öncelikli teknik destek",
  },
]

export function B2BSection({
  heading = "Kurumsal Satın Alma",
  subheading = "Toplu siparişlerde özel fiyatlar ve koşullar",
  features = defaultFeatures,
  cta = { label: "Başvuru Yap", href: "/basvuru" },
}: B2BSectionProps) {
  return (
    <section className="py-16 bg-[#f3f3f3]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#1e1e1e] tracking-tight mb-3">
            {heading}
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">{subheading}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            >
              <div className="flex justify-center mb-4 text-[#0040a4]">{f.icon}</div>
              <h3 className="text-sm font-semibold text-[#1e1e1e] mb-2">{f.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center gap-2 bg-[#0040a4] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#003080] transition-colors duration-200"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
