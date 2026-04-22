import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Hakkımızda | Next AI Teknoloji",
  description:
    "Next AI Teknoloji hakkında bilgi edinin. Türkiye'nin lider teknoloji bayi portalı olarak misyonumuz, vizyonumuz ve ekibimiz.",
  openGraph: {
    title: "Hakkımızda | Next AI Teknoloji",
    description: "Türkiye'nin lider teknoloji bayi portalı.",
  },
}

const teamMembers = [
  {
    name: "Ahmet Yılmaz",
    title: "Kurucu & CEO",
    bio: "15 yıllık teknoloji sektörü deneyimi ile Next AI Teknoloji'yi kurdu.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80",
  },
  {
    name: "Elif Demir",
    title: "CTO",
    bio: "Yazılım mühendisliği ve sistem mimarisi alanında uzman.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
  },
  {
    name: "Mehmet Kaya",
    title: "Satış Direktörü",
    bio: "B2B satış stratejileri ve bayi ilişkileri yönetimi uzmanı.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
  },
  {
    name: "Zeynep Arslan",
    title: "Operasyon Müdürü",
    bio: "Tedarik zinciri ve lojistik süreçlerinde 10 yıllık deneyim.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
  },
]

const stats = [
  { value: "5.000+", label: "Müşteri" },
  { value: "10.000+", label: "Ürün" },
  { value: "50.000+", label: "Sipariş" },
  { value: "10+", label: "Yıl Hizmet" },
]

export default function HakkindaPage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1000px] mx-auto px-[var(--DTContainer_Spacing,40px)] py-16">
        {/* Header */}
        <h1 className="text-[var(--DTFontSize_H2,48px)] font-bold text-[#1e1e1e] mb-6">
          Hakkımızda
        </h1>

        {/* Company Profile */}
        <section className="space-y-6 mb-16">
          <p className="text-[16px] leading-[1.5em] text-[#1e1e1e]">
            Next AI Teknoloji, 2014 yılında İstanbul&apos;da kurulmuş olup Türkiye&apos;nin
            öncü teknoloji bayi portallarından biridir. Kurulduğumuz günden bu yana,
            işletmelerin teknoloji ihtiyaçlarını en yüksek kalitede ve rekabetçi
            fiyatlarla karşılamayı hedefledik.
          </p>
          <p className="text-[16px] leading-[1.5em] text-[#1e1e1e]">
            <strong>Misyonumuz:</strong> Türkiye&apos;deki işletmelere en geniş ürün yelpazesi,
            en iyi fiyatlar ve en hızlı teslimat ile teknoloji çözümleri sunmak.
            Bayilerimize güçlü bir tedarik zinciri ve profesyonel destek sağlayarak
            iş ortaklarımızın büyümesine katkı sağlamak. Misyon ve vizyon değerlerimiz
            her kararımızda yol göstericidir.
          </p>
          <p className="text-[16px] leading-[1.5em] text-[#1e1e1e]">
            <strong>Vizyonumuz:</strong> Türkiye&apos;nin en büyük ve en güvenilir
            teknoloji dağıtım platformu olmak. Dijital dönüşüm sürecinde işletmelere
            rehberlik ederek, teknolojiye erişimi demokratikleştirmek istiyoruz.
          </p>
          <p className="text-[16px] leading-[1.5em] text-[#1e1e1e]">
            10 yılı aşkın sektörel deneyimimizle, HP, Dell, Lenovo, Cisco, Samsung
            gibi dünya liderlerinin yetkili distribütörlüğünü yapıyoruz. 5.000&apos;den
            fazla kurumsal müşterimize hizmet vermekten gurur duyuyoruz.
          </p>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                data-testid="stat-item"
                className="bg-[#f3f3f3] rounded-[20px] p-6 text-center"
              >
                <p className="text-3xl font-black text-[#0040a4] mb-1">{stat.value}</p>
                <p className="text-[13px] font-semibold text-[#767676] uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[#1e1e1e] mb-8">Ekibimiz</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                data-testid="team-member-card"
                className="bg-[#f9f9f9] rounded-[20px] overflow-hidden text-center"
              >
                <div className="relative w-full aspect-square">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[14px] font-bold text-[#1e1e1e]">{member.name}</p>
                  <p className="text-[12px] font-semibold text-[#0040a4] mb-2">
                    {member.title}
                  </p>
                  <p className="text-[12px] text-[#767676] leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-[#f3f3f3] rounded-[20px] p-10">
          <h2 className="text-2xl font-bold text-[#1e1e1e] mb-4">
            Bizimle Çalışın
          </h2>
          <p className="text-[16px] text-[#555555] mb-6 max-w-md mx-auto leading-relaxed">
            İşletmeniz için en uygun teknoloji çözümlerini birlikte bulalım.
          </p>
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 h-12 px-8 bg-[#0040a4] text-white font-bold text-[14px] rounded-lg hover:bg-[#1e1e1e] transition-all duration-300"
          >
            Bize Ulaşın
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </div>
    </div>
  )
}
