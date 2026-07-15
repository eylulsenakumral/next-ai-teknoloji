"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IcnHome, IcnBuilding, IcnFactory, IcnOutdoor, IcnSchool, IcnTool,
  IcnDoor, IcnParking, IcnCorridor, IcnGlobe, IcnLock, IcnCar,
  IcnCamera, IcnCameraGrid, IcnCameraLarge, IcnEnterprise, IcnHelp,
  IcnMoon, IcnFaceId, IcnBell, IcnSmartphone, IcnZap, IcnCheckCircle,
  IcnBudgetS, IcnBudgetM, IcnBudgetL, IcnBudgetXL,
  IcnTarget, IcnMapPin, IcnStar,
} from "@/components/public/icons-next";

type IconComp = React.ComponentType<{ className?: string }>;

// ─── Step data ────────────────────────────────────────────────────────────────
const STEPS: {
  id: string;
  step: number;
  label: string;
  title: string;
  subtitle: string;
  multi: boolean;
  options: { id: string; Icon: IconComp; label: string; desc: string }[];
}[] = [
  {
    id: "type",
    step: 1,
    label: "Proje türü",
    title: "Projeniz hangi ortam için?",
    subtitle: "Kurulum yapılacak mekanın türünü seçin. Doğru çözümü birlikte bulacağız.",
    multi: false,
    options: [
      { id: "konut",  Icon: IcnHome,     label: "Konut / Apartman",       desc: "Villa, daire, site güvenliği" },
      { id: "isyeri", Icon: IcnBuilding, label: "İşyeri / Ofis",          desc: "Mağaza, ofis, alışveriş merkezi" },
      { id: "depo",   Icon: IcnFactory,  label: "Depo / Fabrika",         desc: "Üretim sahası, lojistik merkezi" },
      { id: "acik",   Icon: IcnOutdoor,  label: "Açık Alan",              desc: "Park, otopark, dış çevre" },
      { id: "okul",   Icon: IcnSchool,   label: "Okul / Hastane",         desc: "Eğitim, sağlık, kamu tesisi" },
      { id: "diger",  Icon: IcnHelp,     label: "Diğer / Emin değilim",   desc: "Ekibimiz yardımcı olur" },
    ],
  },
  {
    id: "zones",
    step: 2,
    label: "Kapsama alanları",
    title: "Hangi alanları izlemek istiyorsunuz?",
    subtitle: "Birden fazla seçebilirsiniz. Her alan için doğru kamera tipini önereceğiz.",
    multi: true,
    options: [
      { id: "giris",   Icon: IcnDoor,     label: "Giriş / Çıkış noktaları", desc: "Kapı, turnike, bariyer" },
      { id: "otopark", Icon: IcnParking,  label: "Otopark",                  desc: "Kapalı veya açık otopark" },
      { id: "koridor", Icon: IcnCorridor, label: "İç mekan koridorları",     desc: "Bölüm arası geçişler" },
      { id: "cephe",   Icon: IcnGlobe,    label: "Dış cephe",                desc: "Bina çevresi, bahçe" },
      { id: "ozel",    Icon: IcnLock,     label: "Özel / Hassas alan",       desc: "Kasa odası, sunucu odası" },
      { id: "lpr",     Icon: IcnCar,      label: "Plaka okuma noktası",      desc: "Araç giriş-çıkış kontrolü" },
    ],
  },
  {
    id: "count",
    step: 3,
    label: "Kamera adedi",
    title: "Kaç kamera gerekebilir?",
    subtitle: "Tahmini bir sayı yeterli. İsterlerse teknik ekibimiz sahayı değerlendirerek kesin sayı önerir.",
    multi: false,
    options: [
      { id: "s1",         Icon: IcnCamera,      label: "1 – 8 kamera",   desc: "Küçük ofis, daire, dükkan" },
      { id: "s2",         Icon: IcnCameraGrid,  label: "9 – 16 kamera",  desc: "Orta ölçekli tesis" },
      { id: "s3",         Icon: IcnCameraLarge, label: "17 – 32 kamera", desc: "Büyük işyeri, okul" },
      { id: "s4",         Icon: IcnEnterprise,  label: "32+ kamera",     desc: "Fabrika, kampüs, site" },
      { id: "bilmiyorum", Icon: IcnHelp,        label: "Bilmiyorum",     desc: "Ekibimiz hesaplasın" },
    ],
  },
  {
    id: "features",
    step: 4,
    label: "Özel özellikler",
    title: "Projenizde özel bir ihtiyaç var mı?",
    subtitle: "İlgili tüm özellikleri seçin. Bunlar sistem seçimini doğrudan etkiler.",
    multi: true,
    options: [
      { id: "gece",  Icon: IcnMoon,         label: "Gece görüşü",           desc: "Düşük ışık veya karanlık ortam" },
      { id: "yuz",   Icon: IcnFaceId,       label: "Yüz tanıma",            desc: "AI destekli yüz analizi" },
      { id: "alarm", Icon: IcnBell,         label: "Alarm entegrasyonu",    desc: "Hareket algılama, alarm paneli" },
      { id: "uzak",  Icon: IcnSmartphone,   label: "Uzaktan izleme",        desc: "Telefon / tablet erişimi" },
      { id: "poe",   Icon: IcnZap,          label: "PoE altyapı",           desc: "Cat6 kablo üzerinden güç" },
      { id: "yok",   Icon: IcnCheckCircle,  label: "Standart sistem yeterli", desc: "Temel ihtiyaçlar" },
    ],
  },
  {
    id: "budget",
    step: 5,
    label: "Bütçe",
    title: "Tahmini bütçe aralığınız nedir?",
    subtitle: "Bu bilgi yalnızca size en uygun ürün serisini önermek için kullanılır.",
    multi: false,
    options: [
      { id: "b1",         Icon: IcnBudgetS,  label: "50.000 ₺ altı",        desc: "Temel güvenlik sistemi" },
      { id: "b2",         Icon: IcnBudgetM,  label: "50.000 – 150.000 ₺",   desc: "Orta segment, genişletilebilir" },
      { id: "b3",         Icon: IcnBudgetL,  label: "150.000 – 500.000 ₺",  desc: "Profesyonel, AI özellikli" },
      { id: "b4",         Icon: IcnBudgetXL, label: "500.000 ₺ üzeri",      desc: "Enterprise, çok lokasyonlu" },
      { id: "bfilmiyorum", Icon: IcnHelp,   label: "Henüz bilmiyorum",      desc: "Teklifle karar vereceğim" },
    ],
  },
];

// ─── Option card ───────────────────────────────────────────────────────────────
function OptionCard({
  option,
  selected,
  onClick,
}: {
  option: { Icon: IconComp; label: string; desc: string };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-200 ${
        selected
          ? "border-[#5086a8] bg-[#5086a8]/10 ring-1 ring-[#5086a8]/40"
          : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8"
      }`}
    >
      {selected && (
        <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#5086a8] text-[10px] text-white">
          ✓
        </span>
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
        selected ? "bg-[#5086a8]/20 text-[#8aa8bc]" : "bg-white/10 text-slate-400 group-hover:text-slate-200"
      }`}>
        <option.Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={`text-sm font-bold leading-snug ${selected ? "text-white" : "text-slate-200"}`}>
          {option.label}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{option.desc}</p>
      </div>
    </button>
  );
}

// ─── Result screen ─────────────────────────────────────────────────────────────
function ResultScreen({ answers }: { answers: Record<string, string[]> }) {
  const router = useRouter();

  const brandMap: Record<string, string[]> = {
    lpr: ["Dahua", "Hikvision"],
    yuz: ["Dahua", "Uniview"],
    gece: ["Hikvision", "Dahua"],
    poe: ["Ruijie", "Dahua"],
  };
  const features = answers.features ?? [];
  const brands = [...new Set(features.flatMap((f) => brandMap[f] ?? ["Dahua", "Hikvision"]))].slice(0, 3);

  const typeLabel =
    STEPS[0].options.find((o) => answers.type?.includes(o.id))?.label ?? "Projeniz";

  return (
    <div className="flex flex-col items-center text-center">
      {/* success icon */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#5086a8]/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#5086a8]/30 bg-[#5086a8]/10 text-[#5086a8]">
          <IcnTarget className="h-9 w-9" />
        </div>
      </div>

      <h2 className="mt-7 text-3xl font-bold tracking-tight text-white md:text-4xl">
        Profiliniz hazır.
      </h2>
      <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
        <span className="font-semibold text-white">{typeLabel}</span> için ihtiyaçlarınıza uygun sistem
        önerisi ekibimiz tarafından hazırlanacak. Tahmini dönüş süresi{" "}
        <span className="text-[#ff8a1f]">2–4 saat</span>.
      </p>

      {/* summary cards */}
      <div className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-3 text-left">
        <SumCard
          Icon={IcnMapPin}
          label="Kapsama"
          value={`${answers.zones?.length ?? 0} alan seçildi`}
        />
        <SumCard
          Icon={IcnCamera}
          label="Kamera tahmini"
          value={STEPS[2].options.find((o) => answers.count?.includes(o.id))?.label ?? "—"}
        />
        <SumCard
          Icon={IcnStar}
          label="Önerilen markalar"
          value={brands.join(", ")}
        />
      </div>

      {/* recommended series */}
      <div className="mt-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#5086a8]">Ön öneri</p>
        <div className="mt-4 space-y-3">
          {[
            { name: "IP Kamera Seti", detail: "PoE switch dahil, çoklu çözünürlük seçenekleri", badge: "Popüler" },
            { name: "NVR / Kayıt Ünitesi", detail: "H.265+, 30 gün kayıt kapasitesi", badge: "Dahil" },
            { name: "Yönetim Yazılımı", detail: "Uzaktan erişim, mobil uygulama", badge: "Ücretsiz" },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#5086a8]/40 bg-[#5086a8]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#57a1ff]">
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => router.push("/teklif-iste")}
          className="rounded-xl bg-[#5086a8] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#5086a8]/25 transition hover:bg-[#456680]"
        >
          Resmi Teklif İste →
        </button>
        <button
          onClick={() => router.push("/bayi-giris")}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
        >
          Bayi Girişi Yap
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-600">
        Teknik ekibimiz 2–4 saat içinde sizi arayacak.
      </p>
    </div>
  );
}

function SumCard({
  Icon,
  label,
  value,
}: {
  Icon: IconComp;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5086a8]/10 text-[#5086a8]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-bold leading-snug text-white">{value}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProjectDesign() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState(false);

  const step = STEPS[currentStep];
  const selected = answers[step?.id] ?? [];

  function toggle(optionId: string) {
    const cur = answers[step.id] ?? [];
    if (step.multi) {
      setAnswers((a) => ({
        ...a,
        [step.id]: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId],
      }));
    } else {
      setAnswers((a) => ({ ...a, [step.id]: [optionId] }));
    }
  }

  function next() {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
    else setDone(true);
  }

  function back() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
    else router.push("/");
  }

  const canProceed = selected.length > 0;
  const progress = done ? 100 : (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#453e71] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[#453e71]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <span>←</span>
            <span>Ana Sayfa</span>
          </button>
          <span className="font-mono text-[11px] font-semibold tracking-[.15em] text-[#5086a8]">
            PROJE TASARIM SİHİRBAZI
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            {done ? "Tamamlandı" : `${currentStep + 1} / ${STEPS.length}`}
          </span>
        </div>
        {/* progress bar */}
        <div className="h-0.5 w-full bg-white/5">
          <div
            className="h-full bg-[#5086a8] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-14 md:py-20">
        {!done ? (
          <>
            {/* Step header */}
            <div className="mb-12 text-center">
              <div className="mb-4 flex items-center justify-center gap-2">
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                      i < currentStep
                        ? "bg-[#5086a8] text-white"
                        : i === currentStep
                        ? "border-2 border-[#5086a8] text-[#5086a8]"
                        : "border border-white/15 text-slate-600"
                    }`}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                ))}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#5086a8]">
                Adım {currentStep + 1} · {step.label}
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{step.title}</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">{step.subtitle}</p>
              {step.multi && (
                <span className="mt-3 inline-block rounded-full border border-[#ff8a1f]/30 bg-[#ff8a1f]/10 px-3 py-1 text-[11px] font-semibold text-[#ff8a1f]">
                  Birden fazla seçebilirsiniz
                </span>
              )}
            </div>

            {/* Options grid */}
            <div
              className={`grid gap-3 ${
                step.options.length === 5
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                  : "grid-cols-2 md:grid-cols-3"
              }`}
            >
              {step.options.map((opt) => (
                <OptionCard
                  key={opt.id}
                  option={opt}
                  selected={selected.includes(opt.id)}
                  onClick={() => toggle(opt.id)}
                />
              ))}
            </div>

            {/* Nav */}
            <div className="mt-12 flex items-center justify-between">
              <button onClick={back} className="text-sm text-slate-500 transition hover:text-white">
                ← Geri
              </button>
              <div className="flex items-center gap-3">
                {!canProceed && (
                  <p className="text-xs text-slate-600">Devam etmek için seçim yapın</p>
                )}
                <button
                  onClick={next}
                  disabled={!canProceed}
                  className={`rounded-xl px-7 py-3.5 text-sm font-bold transition-all ${
                    canProceed
                      ? "bg-[#5086a8] text-white shadow-lg shadow-[#5086a8]/25 hover:bg-[#456680]"
                      : "cursor-not-allowed bg-white/5 text-slate-600"
                  }`}
                >
                  {currentStep === STEPS.length - 1 ? "Profilimi Oluştur →" : "Devam Et →"}
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-slate-700">
              Emin olmadığınız sorularda "Bilmiyorum" seçeneğini işaretleyebilirsiniz.
            </p>
          </>
        ) : (
          <ResultScreen answers={answers} />
        )}
      </div>
    </div>
  );
}
