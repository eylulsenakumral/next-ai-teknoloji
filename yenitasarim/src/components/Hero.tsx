import { useNavigate } from "react-router";
import { IcnZap } from "./Icons";

type Props = { onQuote: () => void };

const stats = [
  ["27+", "Global marka partneri"],
  ["1.800+", "Aktif teknik ürün"],
  ["48 sn", "İlk yanıt SLA"],
  ["12 yıl", "Sektör deneyimi"],
];

// Dashboard mockup — CSS/SVG tabanlı, görsel boşluk yok
function DashboardMockup() {
  const feeds = [
    { label: "GİRİŞ / A1", color: "#0d2a4a", accent: "#1477ff", status: "●" },
    { label: "OTOPARK / B2", color: "#0a1f38", accent: "#22c55e", status: "●" },
    { label: "DEPO / C3", color: "#0f2340", accent: "#1477ff", status: "●" },
    { label: "DIŞ CEPHE / D4", color: "#091a30", accent: "#f59e0b", status: "●" },
  ];

  return (
    <div className="relative w-full max-w-[540px] select-none">
      {/* glow */}
      <div className="absolute -inset-10 rounded-full bg-[#1477ff]/10 blur-3xl" />

      {/* main card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080f1c] shadow-[0_32px_80px_rgba(0,0,0,.6)]">
        {/* title bar */}
        <div className="flex items-center justify-between border-b border-white/8 bg-[#0b1421] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="ml-2 font-mono text-[10px] tracking-[.15em] text-slate-500">NEXTAI MONITOR · LIVE</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            4 KAMERA AKTİF
          </span>
        </div>

        {/* camera grid */}
        <div className="grid grid-cols-2 gap-px bg-white/5 p-px">
          {feeds.map((f) => (
            <div key={f.label} className="relative aspect-video overflow-hidden" style={{ background: f.color }}>
              {/* scan-line overlay */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.04) 4px)" }} />
              {/* lens flare corner */}
              <div className="absolute right-0 top-0 h-12 w-12 rounded-full opacity-10"
                style={{ background: `radial-gradient(circle, ${f.accent}, transparent)` }} />
              {/* silhouette scene hint */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-25"
                style={{ background: `linear-gradient(to top, ${f.accent}33, transparent)` }} />
              {/* label */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <span className="font-mono text-[8px] font-bold tracking-[.12em] text-white/60">{f.label}</span>
              </div>
              {/* status dot */}
              <div className="absolute right-2 top-2 font-mono text-[8px]" style={{ color: f.accent }}>
                {f.status}
              </div>
            </div>
          ))}
        </div>

        {/* bottom status bar */}
        <div className="grid grid-cols-3 divide-x divide-white/8 border-t border-white/8 bg-[#0b1421]">
          {[
            { label: "NVR DEPOLAMA", val: "68%", bar: true },
            { label: "BANT GENİŞLİĞİ", val: "24 Mbps", bar: false },
            { label: "UPTIME", val: "99.97%", bar: false },
          ].map((item) => (
            <div key={item.label} className="px-3 py-2.5">
              <p className="font-mono text-[8px] tracking-[.12em] text-slate-600">{item.label}</p>
              <p className="mt-0.5 font-mono text-xs font-bold text-white">{item.val}</p>
              {item.bar && (
                <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[68%] rounded-full bg-[#1477ff]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* floating alert card */}
      <div className="absolute -right-4 top-8 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0f1e35]/90 px-3.5 py-2.5 backdrop-blur-xl shadow-lg">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff8a1f]/15 text-[#ff8a1f]"><IcnZap className="h-3.5 w-3.5" /></span>
        <div>
          <p className="text-[10px] font-bold text-white">Yeni teklif hazır</p>
          <p className="font-mono text-[8px] text-slate-500">NXT-4268 · 2 dk önce</p>
        </div>
      </div>

      {/* floating brand badge */}
      <div className="absolute -left-4 bottom-12 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0f1e35]/90 px-3 py-2 backdrop-blur-xl shadow-lg">
        <div className="flex -space-x-1">
          {["D", "H", "U"].map((l, i) => (
            <div key={l} className="flex h-6 w-6 items-center justify-center rounded-full border border-[#071426] bg-[#1477ff] font-mono text-[9px] font-bold text-white" style={{ zIndex: 3 - i }}>{l}</div>
          ))}
        </div>
        <span className="text-[10px] font-bold text-slate-300">27+ Global Marka</span>
      </div>
    </div>
  );
}

export default function Hero({ onQuote }: Props) {
  const navigate = useNavigate();
  return (
    <section className="relative isolate overflow-hidden bg-[#071426] px-6 pb-0 pt-32 text-white md:px-10 md:pt-40">
      {/* bg gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 80% 60% at 60% 20%, #1477ff18 0%, transparent 70%), linear-gradient(180deg,#071426 60%,#050d1c)" }} />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.07]"
        style={{ backgroundImage: "linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* left copy */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1477ff]/30 bg-[#1477ff]/10 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1477ff] animate-pulse" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#67abff]">B2B Teknoloji Tedarik Platformu</span>
            </div>
            <h1 className="text-5xl font-bold leading-[.94] tracking-[-0.065em] sm:text-6xl lg:text-[4.25rem]">
              Güvenlik projelerinde{" "}
              <span className="bg-gradient-to-r from-[#80b7ff] to-[#1477ff] bg-clip-text text-transparent">
                global güç,
              </span>{" "}
              yerel uzmanlık.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-slate-400">
              Dahua, Hikvision, Uniview, Ruijie ve daha fazlası — bayi fiyatları, teknik danışmanlık ve proje bazlı teklif akışıyla tek noktada.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/proje-tasarim")}
                className="group flex items-center gap-3 rounded-xl bg-[#1477ff] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1477ff]/25 transition hover:bg-[#2a85ff]"
              >
                Projenizi Tasarlayalım
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs transition group-hover:bg-white/30">↗</span>
              </button>
              <button
                onClick={onQuote}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold transition hover:bg-white/10"
              >
                Proje Teklifi İste
              </button>
            </div>
          </div>

          {/* right visual */}
          <div className="flex justify-center lg:justify-end">
            <DashboardMockup />
          </div>
        </div>

        {/* stats strip */}
        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/5 sm:grid-cols-4">
          {stats.map(([val, label]) => (
            <div key={label} className="bg-[#071426]/60 px-6 py-5 backdrop-blur">
              <strong className="block text-2xl font-extrabold tracking-tight text-white">{val}</strong>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[.14em] text-slate-500">{label}</span>
            </div>
          ))}
        </div>

        {/* brand strip */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 py-7">
          <span className="font-mono text-[9px] uppercase tracking-[.2em] text-slate-600">Tedarik ortaklarımız</span>
          <div className="flex flex-wrap items-center gap-6">
            {["DAHUA", "HIKVISION", "UNV", "RUIJIE", "AJAX", "HONEYWELL", "SEAGATE"].map((b) => (
              <span key={b} className="font-extrabold tracking-[-.04em] text-slate-600 transition hover:text-slate-300">{b}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
