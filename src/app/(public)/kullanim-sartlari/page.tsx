import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kullanım Şartları | Next AI Teknoloji",
  description:
    "Next AI Teknoloji kullanım şartları ve koşulları. İade politikası, garanti bilgisi ve kullanıcı sorumlulukları.",
}

export default function KullanimSartlariPage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1000px] mx-auto px-[var(--DTContainer_Spacing,40px)] py-16">
        <h1 className="text-[var(--DTFontSize_H2,48px)] font-bold text-[#1e1e1e] mb-4">
          Kullanım Şartları ve Koşulları
        </h1>
        <p className="text-[14px] text-[#767676] mb-10">
          Son güncelleme: 1 Ocak 2024
        </p>

        <div className="space-y-10 text-[16px] leading-[1.5em] text-[#1e1e1e]">
          {/* 1. Genel Şartlar */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">1. Genel Şartlar</h2>
            <p>
              Bu kullanım şartları, Next AI Teknoloji web sitesini ve hizmetlerini
              kullanmanıza ilişkin koşulları belirler. Web sitemizi kullanarak bu şartları
              kabul etmiş sayılırsınız. Bu şartları kabul etmiyorsanız lütfen web sitemizi
              kullanmayınız. Next AI Teknoloji, bu şartları önceden haber vermeksizin
              değiştirme hakkını saklı tutar. Güncellenmiş şartlar web sitesinde yayımlandığı
              tarihte yürürlüğe girer.
            </p>
          </section>

          {/* 2. Hesap ve Üyelik */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              2. Hesap ve Üyelik Koşulları
            </h2>
            <p>
              Hizmetlerimizden yararlanmak için bir hesap oluşturmanız gerekmektedir.
              Hesap oluştururken verdiğiniz bilgilerin doğru ve güncel olması zorunludur.
              Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi başkalarıyla paylaşmayın
              ve hesabınızda şüpheli bir aktivite fark ettiğinizde derhal bizi bilgilendirin.
              Next AI Teknoloji, herhangi bir hesabı önceden bildirimde bulunmaksızın
              askıya alma veya kapatma hakkını saklı tutar.
            </p>
          </section>

          {/* 3. Sipariş ve Ödeme */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              3. Sipariş ve Ödeme Koşulları
            </h2>
            <p>
              Tüm fiyatlar Türk Lirası (TRY) cinsinden belirtilmiştir ve KDV dahildir
              (aksi belirtilmedikçe). Sipariş verildikten sonra fiyat değişiklikleri
              mevcut siparişi etkilemez. Ödeme yöntemleri: kredi kartı, banka havalesi/EFT,
              kapıda ödeme (seçili bölgelerde). Sipariş onayından sonra ürün tedarik ve
              kargo süreci başlar. Teslimat süresi ürün durumuna göre 1-7 iş günü arasında
              değişir.
            </p>
          </section>

          {/* 4. İade Politikası */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              4. İade Süreci ve Koşulları
            </h2>
            <p className="mb-4">
              Satın aldığınız ürünleri, teslim aldığınız tarihten itibaren 14 gün
              içinde iade edebilirsiniz. İade için aşağıdaki koşulların sağlanması
              gerekmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ürün orijinal ambalajında ve hasarsız olmalıdır</li>
              <li>Ürün kullanılmamış ve fabrika ayarlarında olmalıdır</li>
              <li>Fatura ve garanti belgesi iade ile birlikte gönderilmelidir</li>
              <li>Özel sipariş ürünleri ve yazılım lisansları iade kapsamında değildir</li>
              <li>Hijyen ürünleri (kulaklık, mikrofon vb.) açılmamış olmalıdır</li>
            </ul>
            <p className="mt-4">
              İade talebinizi müşteri hizmetlerimize bildirmeniz gerekmektedir. Onaylanan
              iadeler için ürün bize ulaştıktan sonra 5 iş günü içinde inceleme yapılır.
              Koşulları sağlayan iadeler için geri ödeme, ödeme yöntemine göre 3-14 iş günü
              içinde gerçekleştirilir. Kredi kartı ile yapılan ödemelerde geri ödeme aynı
              karta yapılır. Havale ile yapılan ödemelerde IBAN numaranıza transfer edilir.
            </p>
          </section>

          {/* 5. Garanti */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              5. Garanti Bilgileri
            </h2>
            <p className="mb-4">
              Satın aldığınız tüm ürünler, üretici firmanın resmi Türkiye garantisi
              altındadır. Garanti süresi ürüne göre değişmekle birlikte, minimum 2 yıl
              yasal garanti hakkınız bulunmaktadır. Garanti kapsamında:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Üretim hataları ve malzeme kusurları karşılanır</li>
              <li>Garanti süresi içinde ücretsiz onarım veya değişim yapılır</li>
              <li>Garanti onarımı için yetkili servis merkezlerine yönlendirme sağlanır</li>
              <li>Kullanıcı hatası, düşme, su hasarı gibi durumlar garanti kapsamında değildir</li>
            </ul>
            <p className="mt-4">
              Garanti haklarınız için ürün ile birlikte teslim edilen garanti belgesini
              saklayınız. Garanti belgesi olmadan garanti taleplerinde fatura tarihinden
              itibaren garanti süresi hesaplanır.
            </p>
          </section>

          {/* 6. Uyuşmazlık Çözümü */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              6. Uyuşmazlık Çözümü ve Hukuki Süreç
            </h2>
            <p>
              Hizmetlerimizle ilgili herhangi bir uyuşmazlık durumunda öncelikle
              müşteri hizmetlerimiz aracılığıyla çözüm aranacaktır. Taraflar arasında
              çözülememesi halinde, Türkiye Cumhuriyeti kanunları uygulanır.
              Tüketici hakem heyetleri ve İstanbul mahkemeleri yetkilidir.
              6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında haklarınız
              saklıdır. Tüketici hakem heyetine başvuru için T.C. Ticaret Bakanlığı
              web sitesinden bilgi alabilirsiniz.
            </p>
          </section>

          {/* 7. Geri Ödeme */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              7. İade Süreci ve Geri Ödeme
            </h2>
            <p>
              Onaylanan iade talepleriniz için geri ödeme süreci aşağıdaki gibidir:
              Kredi kartı ile yapılan ödemelerde geri ödeme 3-7 iş günü içinde aynı karta
              yansır. Banka havalesi ile yapılan ödemelerde geri ödeme 5-14 iş günü içinde
              belirttiğiniz IBAN numarasına yapılır. Kapıda ödeme ile yapılan alışverişlerde
              geri ödeme banka havalesi yoluyla gerçekleştirilir. Kısmi iade durumlarında
              sadece iade edilen ürünün tutarı geri ödenir. Kargo ücreti, ürünün kusurlu
              veya yanlış gönderilmesi haricinde müşteriye aittir.
            </p>
          </section>

          {/* 8. Kullanıcı Sorumlulukları */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              8. Kullanıcı Sorumlulukları ve Yükümlülükleri
            </h2>
            <p className="mb-4">
              Web sitemizi ve hizmetlerimizi kullanırken aşağıdaki sorumluluklara
              uymeniz gerekmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Doğru ve güncel bilgiler sağlamak</li>
              <li>Hesap bilgilerinizin gizliliğini korumak</li>
              <li>Web sitesini yasal amaçlarla kullanmak</li>
              <li>Diğer kullanıcıların haklarını ihlal etmemek</li>
              <li>Fikri mülkiyet haklarına saygi göstermek</li>
              <li>Web sitesinin güvenliğini tehlikeye atacak davranışlardan kaçınmak</li>
              <li>Otomatik veri toplama araçları (bot, scraper vb.) kullanmamak</li>
            </ul>
            <p className="mt-4">
              Bu kurallara aykırı davranış tespitinde hesabınız askıya alınabilir veya
              kalıcı olarak kapatılabilir. Next AI Teknoloji, kuralları ihlal eden
              kullanıcılara karşı yasal haklarını kullanma hakkını saklı tutar.
            </p>
          </section>

          {/* 9. Fikri Mülkiyet */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              9. Fikri Mülkiyet Hakları
            </h2>
            <p>
              Web sitemizdeki tüm içerik, tasarım, logo, grafik, yazı ve diğer materyaller
              Next AI Teknoloji&apos;nin fikri mülkiyeti altındadır ve telif hakları ile
              korunmaktadır. Bu içeriklerin izinsiz kopyalanması, dağıtılması veya
              değiştirilmesi yasaktır. Ürün görselleri ve açıklamaları bilgilendirme
              amacıyla sunulmaktadır ve üretici firmalarının mülkiyetindedir.
            </p>
          </section>

          {/* 10. İletişim */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              10. İletişim
            </h2>
            <p>
              Bu kullanım şartları ile ilgili sorularınız için aşağıdaki kanallardan
              bize ulaşabilirsiniz:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>E-posta: hukuk@next-ai.com.tr</li>
              <li>Telefon: 0 552 989 5959</li>
              <li>Adres: Esentepe Mh. Büyükdere Cd. No:123, Şişli, İstanbul 34394</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
