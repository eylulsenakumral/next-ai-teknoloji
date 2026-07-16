import Link from "next/link"
import {
  IcnCamera,
  IcnNetwork,
  IcnAccessControl,
  IcnSmartHome,
  IcnTarget,
  IcnBriefcase,
  IcnBox,
  IcnTool,
} from "@/components/public/icons-next"

export const metadata = {
  title: "Çözümler — CCTV, Network, Geçiş Kontrol, Akıllı Bina",
  description:
    "Video güvenlik, ağ altyapısı, geçiş kontrol ve akıllı bina çözümleri. Proje bazlı sistem tasarımı, teknik danışmanlık ve bayi avantajları.",
  alternates: { canonical: "/cozumler" },
}

const solutions = [
  {
    number: "01",
    Icon: IcnCamera,
    title: "Video Güvenlik",
    tagline: "CCTV / IP Kamera / NVR",
    desc: "IP kamera, NVR, analitik yazılım ve montaj ekipmanlarıyla uçtan uca görüntü güvenlik sistemleri. AI tabanlı yüz/motorlu taşıt tanıma,_plate recognition ve davranış analitiği entegrasyonu.",
    features: [
      "4K / 8MP / 12MP yüksek çözünürlük",
      "AI analitik (yüz, plaka, davranış)",
      "Edge & cloud depolama (NVR/CVR)",
      "PoE — tek kablo ile güç + veri",
      "Mobile & web izleme",
      "Heat mapping & people counting",
    ],
    brands: ["Dahua", "Hikvision", "UNV", "Reolink"],
    dark: true,
  },
  {
    number: "02",
    Icon: IcnNetwork,
    title: "Ağ Altyapısı",
    tagline: "Switch / Wi-Fi / Fiber",
    desc: "Yönetilen switch, wireless AP ve fiber omurga ile yüksek performanslı, güvenli ve ölçeklenebilir bağlantı altyapısı. Kurumsal kampüs ve veri merkezi projeleri.",
    features: [
      "Layer 2/3 yönetilen switch",
      "Wi-Fi 6 / 6E access point",
      "Fiber OM3/OM4 backbone",
      "VLAN & QoS konfigürasyonu",
      "24/7 monitoring",
      "DDoS koruması & firewall",
    ],
    brands: ["Ruijie", "TP-Link Omada", "Ubiquiti", "Cisco"],
    dark: false,
  },
  {
    number: "03",
    Icon: IcnAccessControl,
    title: "Geçiş Kontrol",
    tagline: "Kart / Biometrik / Bariyer",
    desc: "Kart okuyucu, bariyer, turnike ve biometrik sistemlerle kritik erişim noktalarının yönetimi. IP tabanlı, merkezi yönetilebilir, raporlanabilir sistemler.",
    features: [
      "Biyometrik (parmak izi, yüz, iris)",
      "OSDP v2 protokolü",
      "IP tabanlı merkezi yönetim",
      "Turnike, bariyer, speed gate",
      "Ziyaretçi yönetim sistemi",
      "Anti-passback & zaman dilimi",
    ],
    brands: ["Hikvision", "Dahua", "ZKTeco", "Suprema"],
    dark: false,
  },
  {
    number: "04",
    Icon: IcnSmartHome,
    title: "Akıllı Bina & IoT",
    tagline: "Alarm / Interkom / Otomasyon",
    desc: "Alarm, interkom, otomasyon ve izleme sistemlerini tek platformdan yönetin. KNX, Modbus ve IP tabanlı entegrasyonla bina yönetim sistemi (BMS).",
    features: [
      "Video interkom (IP & analog)",
      "Alarm & yangın entegrasyonu",
      "KNX home/building automation",
      "Energy monitoring",
      "Mobile app & sesli kontrol",
      "API & third-party entegrasyon",
    ],
    brands: ["Ajax", "Honeywell", "Commax", "KNX partnerleri"],
    dark: false,
  },
]

const valueProps = [
  { Icon: IcnTarget, title: "Saha analizi", desc: "Ücretsiz keşif ve ihtiyaç analizi" },
  { Icon: IcnBriefcase, title: "Sistem tasarımı", desc: "Marka & mimari önerisi" },
  { Icon: IcnBox, title: "Tedarik", desc: "Stoklu ürünlerde aynı gün" },
  { Icon: IcnTool, title: "Teknik destek", desc: "7/24 uzaktan yardım" },
]

export default function CozumlerPage() {
  return (
    <div className="font-nx-sans">
      {/* Hero */}
      <section className="bg-[var(--color-primary)] px-6 py-24 text-white md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="font-nx-mono text-[10px] uppercase tracking-[.2em] text-[#8aa8bc]">
            Çözüm alanları
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.055em] md:text-6xl">
            Projenizin tüm teknoloji katmanları için
            <span className="text-[#a8c4d4]"> tek nokta çözümü.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400">
            CCTV görüntülemeden ağ omurgasına, geçiş kontrolden akıllı bina otomasyonuna — tüm sistemleri
            tek bir entegre mimari altında tasarlıyor ve tedarik ediyoruz.
          </p>
        </div>
      </section>

      {/* Solution blocks */}
      {solutions.map((s, idx) => (
        <section
          key={s.number}
          className={idx % 2 === 0 ? "bg-white px-6 py-20 md:px-10" : "bg-[var(--color-background)] px-6 py-20 md:px-10"}
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
              {/* Left — header */}
              <div className={s.dark ? "rounded-3xl bg-[var(--color-primary)] p-8 text-white md:p-10" : ""}>
                <div className="flex items-center gap-4">
                  <span className="font-nx-mono text-[10px] font-bold tracking-[.18em] text-[var(--color-primary)]">
                    {s.number}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    <s.Icon className="h-5 w-5" />
                  </div>
                </div>
                <h2 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">{s.title}</h2>
                <p className="mt-2 font-nx-mono text-[10px] uppercase tracking-[.18em] text-slate-400">
                  {s.tagline}
                </p>
                <p className={`mt-6 text-sm leading-7 ${s.dark ? "text-slate-400" : "text-slate-600"}`}>
                  {s.desc}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {s.brands.map((b) => (
                    <span
                      key={b}
                      className={`rounded-full px-3 py-1 font-nx-mono text-[10px] font-bold uppercase tracking-wider ${
                        s.dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right — features */}
              <div className="grid gap-3 sm:grid-cols-2">
                {s.features.map((f) => (
                  <div
                    key={f}
                    className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 transition"
                  >
                    <p className="text-sm font-semibold text-[var(--color-primary)]">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Value props */}
      <section className="bg-[var(--color-primary)] px-6 py-20 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((v) => (
              <div key={v.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-[#8aa8bc]">
                  <v.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
    </div>
  )
}
