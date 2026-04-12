import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Hakkimizda | Next AI Teknoloji",
  description:
    "Next AI Teknoloji hakkinda bilgi edinin. Turkiye'nin lider teknoloji bayi portali olarak misyonumuz, vizyonumuz ve ekibimiz.",
  openGraph: {
    title: "Hakkimizda | Next AI Teknoloji",
    description: "Turkiye'nin lider teknoloji bayi portali.",
  },
}

const teamMembers = [
  {
    name: "Ahmet Yilmaz",
    title: "Kurucu & CEO",
    bio: "15 yillik teknoloji sektoru deneyimi ile Next AI Teknoloji'yi kurdu.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80",
  },
  {
    name: "Elif Demir",
    title: "CTO",
    bio: "Yazilim muhendisligi ve sistem mimarisi alaninda uzman.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
  },
  {
    name: "Mehmet Kaya",
    title: "Satis Direktoru",
    bio: "B2B satis stratejileri ve bayi iliskileri yonetimi uzmani.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
  },
  {
    name: "Zeynep Arslan",
    title: "Operasyon Muduru",
    bio: "Tedarik zinciri ve lojistik sureclerinde 10 yillik deneyim.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
  },
]

const stats = [
  { value: "5.000+", label: "Musteri" },
  { value: "10.000+", label: "Urun" },
  { value: "50.000+", label: "Siparis" },
  { value: "10+", label: "Yil Hizmet" },
]

export default function HakkindaPage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1000px] mx-auto px-[var(--DTContainer_Spacing,40px)] py-16">
        {/* Header */}
        <h1 className="text-[var(--DTFontSize_H2,48px)] font-bold text-[#1e1e1e] mb-6">
          Hakkimizda
        </h1>

        {/* Company Profile */}
        <section className="space-y-6 mb-16">
          <p className="text-[16px] leading-[1.5em] text-[#1e1e1e]">
            Next AI Teknoloji, 2014 yilinda Istanbul&apos;da kurulmus olup Turkiye&apos;nin
            oncu teknoloji bayi portallarindan biridir. Kuruldugumuz gundem bu yana,
            isletmelerin teknoloji ihtiyaclarini en yuksek kalitede ve rekabetci
            fiyatlarla karsilamayi hedefledik.
          </p>
          <p className="text-[16px] leading-[1.5em] text-[#1e1e1e]">
            <strong>Misyonumuz:</strong> Turkiye&apos;deki isletmelere en genis urun yelpazesi,
            en iyi fiyatlar ve en hizli teslimat ile teknoloji cozumleri sunmak.
            Bayilerimize guclu bir tedarik zinciri ve profesyonel destek saglayarak
            is ortaklarimizin buyumesine katki saglamak. Misyon ve vizyon degerlerimiz
            her kararimizda yol gostericidir.
          </p>
          <p className="text-[16px] leading-[1.5em] text-[#1e1e1e]">
            <strong>Vizyonumuz:</strong> Turkiye&apos;nin en buyuk ve en guvenilir
            teknoloji dagitim platformu olmak. Dijital donusum surecinde isletmelere
            rehberlik ederek, teknolojiye erisimi demokratiklestirmek istiyoruz.
          </p>
          <p className="text-[16px] leading-[1.5em] text-[#1e1e1e]">
            10 yili askin sektorel deneyimimizle, HP, Dell, Lenovo, Cisco, Samsung
            gibi dunya liderlerinin yetkili distributorlugunu yapiyoruz. 5.000&apos;den
            fazla kurumsal musterimize hizmet vermekten gurur duyuyoruz.
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
                <p className="text-3xl font-black text-[#2189ff] mb-1">{stat.value}</p>
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
                  <p className="text-[12px] font-semibold text-[#2189ff] mb-2">
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
            Bizimle Calisin
          </h2>
          <p className="text-[16px] text-[#555555] mb-6 max-w-md mx-auto leading-relaxed">
            Isletmeniz icin en uygun teknoloji cozumlerini birlikte bulalim.
          </p>
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 h-12 px-8 bg-[#2189ff] text-white font-bold text-[14px] rounded-lg hover:bg-[#1e1e1e] transition-all duration-300"
          >
            Bize Ulasin
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </div>
    </div>
  )
}
