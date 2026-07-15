import { useState } from "react";
import {
  LogoDahua, LogoHikvision, LogoUNV, LogoTtec, LogoReolink, LogoINOX,
  LogoSeagate, LogoWD, LogoToshiba,
  LogoNovato, LogoNinova, LogoAjax,
  LogoHoneywell, LogoSens,
  LogoRuijie, LogoUbiquiti,
} from "../components/BrandLogos";

type Brand = {
  id: string;
  Logo: React.ComponentType<{ className?: string }>;
  name: string;
  desc: string;
  tags: string[];
};

const categories: { id: string; label: string; brands: Brand[] }[] = [
  {
    id: "kamera",
    label: "Kamera Sistemleri",
    brands: [
      { id: "dahua",    Logo: LogoDahua,    name: "Dahua",        desc: "AI analitik, IP kamera, NVR ve akıllı video çözümleri.",     tags: ["AI Video", "4K", "NVR", "PoE"] },
      { id: "hikv",     Logo: LogoHikvision,name: "Hikvision",    desc: "Kurumsal güvenlik sistemlerinde global lider.",               tags: ["IP Kamera", "Termal", "AI"] },
      { id: "unv",      Logo: LogoUNV,      name: "UNV",          desc: "Uniview — yüksek çözünürlüklü IP kamera sistemleri.",        tags: ["4K", "8MP", "NVR"] },
      { id: "ttec",     Logo: LogoTtec,     name: "ttec",         desc: "Kompakt ve uygun fiyatlı güvenlik kamera çözümleri.",         tags: ["IP Kamera", "Dome", "Bullet"] },
      { id: "reolink",  Logo: LogoReolink,  name: "Reolink",      desc: "Kablosuz ve PoE kamera sistemleri.",                         tags: ["PoE", "WiFi", "Outdoor"] },
      { id: "inox",     Logo: LogoINOX,     name: "INOX Digital", desc: "Güvenlik kamerası ve aksesuarları.",                         tags: ["IP Kamera", "HD", "AHD"] },
    ],
  },
  {
    id: "depolama",
    label: "Veri Depolama Sistemleri",
    brands: [
      { id: "seagate",  Logo: LogoSeagate,  name: "Seagate",       desc: "Güvenlik sistemleri için özel tasarlanmış surveillance diskler.", tags: ["Surveillance HDD", "NAS", "7/24"] },
      { id: "wd",       Logo: LogoWD,       name: "Western Digital", desc: "WD Purple serisi — kesintisiz kayıt için optimize.",            tags: ["WD Purple", "Surveillance", "NAS"] },
      { id: "toshiba",  Logo: LogoToshiba,  name: "Toshiba",        desc: "Endüstriyel depolama ve 7/24 çalışma dayanıklılığı.",            tags: ["HDD", "7/24", "Endüstriyel"] },
    ],
  },
  {
    id: "akilli",
    label: "Akıllı Bina Sistemleri",
    brands: [
      { id: "novato",   Logo: LogoNovato,   name: "Novato",        desc: "Akıllı bina otomasyon ve kontrol sistemleri.",                   tags: ["Otomasyon", "KNX", "BMS"] },
      { id: "ninova",   Logo: LogoNinova,   name: "Ninova",        desc: "Ev ve bina otomasyonu — SmartLife ekosistemi.",                  tags: ["SmartLife", "IoT", "Otomasyon"] },
      { id: "ajax",     Logo: LogoAjax,     name: "Ajax",          desc: "Kablosuz alarm ve güvenlik sistemleri, Avrupa'nın lideri.",       tags: ["Kablosuz", "Alarm", "Hareket"] },
    ],
  },
  {
    id: "yangin",
    label: "Yangın Algılama Sistemleri",
    brands: [
      { id: "honeywell", Logo: LogoHoneywell, name: "Honeywell", desc: "Endüstriyel ve kurumsal yangın algılama sistemleri.",            tags: ["Yangın Dedektörü", "Panel", "Kurumsal"] },
      { id: "sens",      Logo: LogoSens,      name: "SENS",      desc: "Yerli üretim yangın algılama ve uyarı sistemleri.",              tags: ["Dedektör", "Alarm Paneli", "Yerli"] },
    ],
  },
  {
    id: "network",
    label: "Network Sistemleri",
    brands: [
      { id: "ruijie",   Logo: LogoRuijie,   name: "Ruijie",    desc: "Enterprise switch, wireless AP ve ağ yönetim platformları.",      tags: ["Switch", "Wi-Fi 6", "Layer 3"] },
      { id: "ubiquiti", Logo: LogoUbiquiti, name: "Ubiquiti",  desc: "UniFi ekosistemi — birleşik ağ yönetim ve erişim noktaları.",     tags: ["UniFi", "Wireless", "PoE Switch"] },
    ],
  },
];

const allCategories = [{ id: "all", label: "Tümü" }, ...categories.map((c) => ({ id: c.id, label: c.label }))];

function BrandCard({ brand, featured }: { brand: Brand; featured?: boolean }) {
  return (
    <div
      className={`group flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 hover:shadow-md ${
        featured
          ? "border-[#1477ff]/30 bg-[#071426] hover:border-[#1477ff]/50"
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      {/* logo area */}
      <div className={`flex h-14 items-center ${featured ? "" : ""}`}>
        <brand.Logo className="h-9 w-auto max-w-[140px]" />
      </div>

      <div className="mt-6">
        <p className={`text-sm leading-6 ${featured ? "text-slate-400" : "text-slate-500"}`}>
          {brand.desc}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {brand.tags.map((t) => (
            <span
              key={t}
              className={`rounded-full px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[.1em] ${
                featured ? "bg-white/8 text-slate-500" : "bg-[#f4f7fa] text-slate-500"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t pt-4 flex items-center justify-between" style={{ borderColor: featured ? "rgba(255,255,255,.06)" : "#f1f5f9" }}>
        <span className={`text-xs font-bold ${featured ? "text-[#1477ff]" : "text-[#1477ff]"}`}>
          Ürünleri gör →
        </span>
      </div>
    </div>
  );
}

export default function Brands() {
  const [activeCategory, setActiveCategory] = useState("all");

  const visibleCategories =
    activeCategory === "all"
      ? categories
      : categories.filter((c) => c.id === activeCategory);

  return (
    <section className="bg-[#f4f7fa] px-6 py-16 md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#1477ff]">
              Kurumsal çözüm ortaklarımız
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.055em] text-[#071426] md:text-5xl">
              Her ihtiyaca doğru<br />teknoloji ortağı.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500">
              Güvenlik sistemlerinden ağ altyapısına, yangın algılamadan akıllı bina çözümlerine kadar 5 kategoride seçkin global markalar.
            </p>
          </div>
          <div className="shrink-0 grid grid-cols-2 gap-3 text-left sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["16+", "Global marka"],
              ["5", "Çözüm kategorisi"],
              ["1.800+", "Teknik ürün"],
              ["12 yıl", "Deneyim"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <strong className="block text-xl font-extrabold text-[#071426]">{v}</strong>
                <span className="font-mono text-[9px] uppercase tracking-[.12em] text-slate-400">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* category filter tabs */}
        <div className="mt-12 flex gap-2 overflow-x-auto border-b border-slate-200 pb-0">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-t-lg px-4 py-2.5 text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? "border border-b-white border-slate-200 bg-white text-[#1477ff] -mb-px"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* brand grids by category */}
        <div className="mt-0 space-y-12 bg-white rounded-b-2xl border border-t-0 border-slate-200 p-6 md:p-8">
          {visibleCategories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="font-mono text-[10px] uppercase tracking-[.2em] text-slate-400">
                  {cat.label}
                </span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>
              <div className={`grid gap-4 ${cat.brands.length <= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {cat.brands.map((brand, i) => (
                  <BrandCard key={brand.id} brand={brand} featured={i === 0 && activeCategory === "all" && cat.id === "kamera"} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* service categories strip */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#1477ff]">
            Çözüm alanlarımız
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              "Güvenlik Sistemleri",
              "Network & Ağ Ürünleri",
              "Yangın Alarm Sistemleri",
              "Hırsız Alarm Sistemleri",
              "Akıllı Bina Sistemleri",
              "Geçiş Kontrol Sistemleri",
              "Personel Devam Kontrol",
              "Kurumsal Yazılım Çözümleri",
            ].map((svc) => (
              <div key={svc} className="flex items-center gap-2 rounded-xl bg-[#f4f7fa] px-3 py-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1477ff]" />
                <span className="text-xs font-semibold text-[#071426]">{svc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
