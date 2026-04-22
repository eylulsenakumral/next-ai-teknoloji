import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hakkımızda | Next AI Teknoloji",
  description:
    "Next AI Teknoloji hakkında bilgi. Türkiye'nin önde gelen teknoloji ve B2B çözüm ortağı.",
}

export default function HakkimizdaPage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1000px] mx-auto px-[var(--DTContainer_Spacing,40px)] py-16">
        <h1 className="text-[var(--DTFontSize_H2,48px)] font-bold text-[#1e1e1e] mb-10">
          Hakkımızda
        </h1>

        <div className="space-y-10 text-[16px] leading-[1.5em] text-[#1e1e1e]">
          {/* Giriş */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">Kimdir?</h2>
            <p>
              Next AI Teknoloji, 2024 yılında Türkiye&apos;de kurulan teknoloji ve B2B
              çözüm ortağıdır. Şirketimiz, yerel ve global tedarikçilerle güçlü
              iş birlikleri kurarak, Türk iş dünyasına rekabet avantajı sağlamayı
              hedeflemektedir.
            </p>
          </section>

          {/* Görev */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">Görev</h2>
            <p>
              Görevimiz, Türk iş dünyasının dijital dönüşümüne katkıda bulunmak ve
              sürdürülebilir büyüme sağlamaktır. Bu amaçla, yerel tedarikçilerle
              güçlü iş birlikleri kurarak, ürün ve hizmetlerimizi sunuyoruz.
            </p>
          </section>

          {/* Değerler */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">Değerler</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#f8f8f8] p-6 rounded-lg">
                <h3 className="font-bold text-[#1e1e1e] mb-2">Güvenilirlik</h3>
                <p className="text-[14px] text-[#555555]">
                  Müşterilerimize ve iş ortaklarımıza karşı her zaman şeffaf ve dürüst
                  davranıyoruz.
                </p>
              </div>
              <div className="bg-[#f8f8f8] p-6 rounded-lg">
                <h3 className="font-bold text-[#1e1e1e] mb-2">Kalite</h3>
                <p className="text-[14px] text-[#555555]">
                  Ürün ve hizmetlerimizde en yüksek standartları benimsiyoruz.
                </p>
              </div>
              <div className="bg-[#f8f8f8] p-6 rounded-lg">
                <h3 className="font-bold text-[#1e1e1e] mb-2">İnovasyon</h3>
                <p className="text-[14px] text-[#555555]">
                  Teknoloji trendlerini yakından takip ediyor ve yenilikçi çözümler
                  sunuyoruz.
                </p>
              </div>
              <div className="bg-[#f8f8f8] p-6 rounded-lg">
                <h3 className="font-bold text-[#1e1e1e] mb-2">Müşteri Odaklılık</h3>
                <p className="text-[14px] text-[#555555]">
                  Müşteri memnuniyetini her zaman ön planda tutuyoruz.
                </p>
              </div>
            </div>
          </section>

          {/* Hizmetler */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">Hizmetlerimiz</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="font-bold text-[#1e1e1e] mb-2">B2B Çözümleri</h3>
                <p className="text-[14px] text-[#555555]">
                  İşletmeler için özel teknoloji çözümleri sunuyoruz.
                </p>
              </div>
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="font-bold text-[#1e1e1e] mb-2">Ürün Tedariki</h3>
                <p className="text-[14px] text-[#555555]">
                  Global ve yerel tedarikçilerden ürün temini yapıyoruz.
                </p>
              </div>
              <div className="border border-gray-200 p-6 rounded-lg">
                <h3 className="font-bold text-[#1e1e1e] mb-2">Danışmanlık</h3>
                <p className="text-[14px] text-[#555555]">
                  Teknoloji yatırımlarınız için stratejik danışmanlık sağlıyoruz.
                </p>
              </div>
            </div>
          </section>

          {/* İletişim */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">İletişim</h2>
            <p>
              Daha fazla bilgi için bizimle iletişime geçebilirsiniz:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>E-posta: info@next-ai.com.tr</li>
              <li>Telefon: 0 552 989 5959</li>
              <li>Adres: Esentepe Mh. Büyükdere Cd. No:123, Şişli, İstanbul 34394</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
