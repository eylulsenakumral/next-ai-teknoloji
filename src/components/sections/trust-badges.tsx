import { ShieldCheck, Truck, RotateCcw, Lock } from "lucide-react"

interface Badge {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  subtitle: string
}

const badges: Badge[] = [
  {
    icon: Lock,
    title: "Güvenli Ödeme",
    desc: "256-bit SSL şifreleme",
    subtitle: "Tüm işlemleriniz endüstri standardı şifreleme ile korunmaktadır.",
  },
  {
    icon: Truck,
    title: "Hızlı Teslimat",
    desc: "2-5 iş günü",
    subtitle: "Siparişleriniz en kısa sürede güvenle kapınıza teslim edilir.",
  },
  {
    icon: RotateCcw,
    title: "Kolay İade",
    desc: "15 gün iade garantisi",
    subtitle: "Memnun kalmazsanız, koşulsuz iade hakkınız bulunmaktadır.",
  },
  {
    icon: ShieldCheck,
    title: "Orijinal Ürün",
    desc: "Garantili authentic",
    subtitle: "Sadece orijinal ve garantili ürünler satışa sunulmaktadır.",
  },
]

export function TrustBadges() {
  return (
    <section className="py-12 bg-white/70 backdrop-blur-sm border-y border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {badges.map((badge, idx) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.title}
                className="flex items-start gap-4 animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Icon Circle - gradient background */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[var(--color-primary)]/15 to-[#1a6fe0]/10 shadow-sm">
                  <Icon className="w-7 h-7 text-[var(--color-primary)]" aria-hidden />
                </div>

                {/* Text Content */}
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1 font-medium">
                    {badge.desc}
                  </p>
                  <h3 className="font-bold text-[var(--color-foreground)] text-[15px] mb-1.5">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {badge.subtitle}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
