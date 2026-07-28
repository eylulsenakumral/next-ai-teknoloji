import type { Metadata } from "next"
import { LegalPage, LegalList } from "@/components/public/legal-page"

export const metadata: Metadata = {
  title: "Kullanım Şartları & Bayi Sözleşmesi | Next AI Teknoloji",
  description:
    "Next AI Teknoloji bayi portalı kullanım şartları. Bayi sözleşmesi, sipariş ve ödeme koşulları, iade politikası, garanti ve sorumluluklar. B2B tedarik.",
  alternates: { canonical: "/kullanim-sartlari" },
}

export default function KullanimSartlariPage() {
  return (
    <LegalPage
      title="Kullanım Şartları & Bayi Sözleşmesi"
      subtitle="B2B Tedarik"
      lastUpdated="22 Temmuz 2026"
      intro={
        <p>
          Bu kullanım şartları, Next AI Teknoloji bayi portalını ve hizmetlerini kullanmanıza ilişkin koşulları
          belirler. Platform bir <strong>B2B (işletmeden işletmeye) tedarik platformudur</strong>; tüketiciler
          için tasarlanmamıştır. Bayi hesabınızı kullanarak bu şartları kabul etmiş sayılırsınız.
        </p>
      }
      sections={[
        {
          title: "1. Genel Şartlar",
          body: (
            <p>
              Bu şartlar, Next AI Teknoloji web sitesini ve hizmetlerini kullanmanıza ilişkin koşulları
              belirler. Web sitemizi kullanarak bu şartları kabul etmiş sayılırsınız. Bu şartları kabul
              etmiyorsanız lütfen web sitemizi kullanmayınız. Next AI Teknoloji, bu şartları önceden haber
              vermeksizin değiştirme hakkını saklı tutar. Güncellenmiş şartlar web sitesinde yayımlandığı
              tarihte yürürlüğe girer.
            </p>
          ),
        },
        {
          title: "2. Bayi Hesabı ve Onay",
          body: (
            <>
              <p>
                Hizmetlerimizden yararlanmak için bayi başvurusu yapmanız ve onay almanız gerekmektedir.
                Başvurunuz, firma bilgileri ve ticari belgelerin incelenmesinin ardından değerlendirilir.
                Onaylanmış bayilerimiz için:
              </p>
              <LegalList
                items={[
                  "Vergi levhası ve imza sirküleri zorunludur",
                  "Bayi kodu ve şifre ile giriş yapılır",
                  "Hesap güvenliğinden bayi sorumludur",
                  "Hesap bilgilerinin başkalarıyla paylaşılmaması gerekir",
                  "Şüpheli aktivitede derhal bildirim zorunluluğu",
                ]}
              />
              <p className="mt-4">
                Next AI Teknoloji, herhangi bir bayi hesabını önceden bildirimde bulunmaksızın askıya alma veya
                kapatma hakkını saklı tutar.
              </p>
            </>
          ),
        },
        {
          title: "3. Sipariş ve Ödeme Koşulları",
          body: (
            <>
              <p>
                Tüm fiyatlar Türk Lirası (TRY) cinsinden belirtilir, KDV hariç (aksi belirtilmedikçe). USD
                fiyatlı ürünler sipariş anındaki kur üzerinden TRY&apos;ye çevrilir. Ödeme yöntemleri:
              </p>
              <LegalList
                items={[
                  <><strong>Vadeli cari hesap:</strong> Onaylı kredi limiti dahilinde vade-li ödeme</>,
                  <><strong>Banka havalesi / EFT:</strong> Sipariş onayı sonrası 24 saat içinde</>,
                  <><strong>Online ödeme:</strong> Kredi kartı ile anlık ödeme (NomuPay POS)</>,
                  <><strong>Proje bazlı özel ödeme:</strong> Sözleşmeyle belirlenen plan</>,
                ]}
              />
              <p className="mt-4">
                Sipariş onayından sonra ürün tedarik ve kargo süreci başlar. Stoklu ürünlerde aynı gün kargo,
                özel siparişlerde tedarik süresi 7-30 iş günü arasında değişir. Proje siparişlerinde teslim
                tarihi teklif aşamasında belirtilir.
              </p>
              <p className="mt-4">
                <strong>Vadeli ödemelerde gecikme:</strong> Onaylı cari hesap vadesinde yapılmayan ödemeler
                için, vade tarihinden itibaren aylık %5 gecikme faizi (BK md.120) ve gecikme bedeli tahakkuk
                eder. Ödemenin 15 günü aşan gecikmesi halinde sipariş/sevkiyat askıya alınabilir ve cari hesap
                limiti yeniden değerlendirilir. Yazılı ihtara rağmen 30 gün içinde ödenmeyen tutarlar için
                icra ve hukuki takip başlatılma hakkı saklıdır.
              </p>
            </>
          ),
        },
        {
          title: "4. İade ve Cayma Hakkı",
          body: (
            <>
              <p>
                <strong>B2B tedarik kapsamında 6502 sayılı Tüketicinin Korunması Hakkında Kanun&apos;un mesafeli
                sözleşmeler hükümleri uygulanmaz.</strong> Ticari işletmeler arası işlemlerde cayma hakkı
                sınırlıdır. Aşağıdaki koşullarda iade kabul edilir:
              </p>
              <LegalList
                items={[
                  "Ürün sevkıyatında üretim/teslimat hatası olması",
                  "Arızalı veya hasarlı ürün teslimatı (3 gün içinde bildirim şartı)",
                  "Yanlış ürün gönderilmesi",
                  "Sözleşmede aksi kararlaştırılmadıkça, özel sipariş/ihracat ürünleri iade edilmez",
                  "Yazılım lisansları, activation kodları iade kapsamı dışındadır",
                ]}
              />
              <p className="mt-4">
                İade talepleri yazılı olarak (e-posta) iletilmelidir. Onaylanan iadeler ürün bize ulaştıktan
                sonra 5 iş günü içinde incelenir. Koşulları sağlayan iadeler cari hesaba mahsup edilir veya
                IBAN&apos;a 7-14 iş günü içinde iade edilir.
              </p>
            </>
          ),
        },
        {
          title: "5. Garanti Bilgileri",
          body: (
            <>
              <p>
                Satın aldığınız tüm ürünler, üretici firmanın resmi Türkiye distribütör garantisi altındadır.
                Garanti süresi ürune göre değişmekle birlikte, minimum 2 yıl garanti hakkınız bulunmaktadır.
                Garanti kapsamında:
              </p>
              <LegalList
                items={[
                  "Üretim hataları ve malzeme kusurları karşılanır",
                  "Garanti süresi içinde ücretsiz onarım veya değişim yapılır",
                  "Yetkili servis merkezlerine yönlendirme sağlanır",
                  "Kullanıcı hatası, düşme, su hasarı, aşırı gerilim gibi durumlar kapsam dışıdır",
                  "Kurulum hatası kaynaklı arızalar garanti kapsamında değildir",
                ]}
              />
              <p className="mt-4">
                Garanti haklarınız için ürün ile birlikte teslim edilen garanti belgesini ve faturayı
                saklayınız. Garanti taleplerinde fatura tarihi esas alınır.
              </p>
            </>
          ),
        },
        {
          title: "6. Teslimat ve Lojistik",
          body: (
            <>
              <p>Teslimat koşulları ürün durumuna göre değişir:</p>
              <LegalList
                items={[
                  <><strong>Stoklu ürünler:</strong> İstanbul/Mersin/Bursa depolarından aynı gün kargo</>,
                  <><strong>Proje siparişleri:</strong> Lojistik koordinasyonu tarafımızca yapılır</>,
                  <><strong>Özel sipariş/ithalat:</strong> Tahmini teslim tarihi teklifte belirtilir</>,
                  "Teslimat anında ürün sayım/kontrol kontrolü bayiye aittir",
                  "Hasarlı/eksik teslimat 3 gün içinde bildirilmelidir",
                ]}
              />
              <p className="mt-4">
                <strong>Taşıma sigortası ve risk geçişi:</strong> Kargo taşımada ürün hasarı/ziyaa karşı
                nakliye sigortası tarafımızca yaptırılır; hasar halinde kargo firmasına rücu edilir.
                <strong> Teslim anı risk geçişi:</strong> ürünlerin bayiye (veya bayinin belirttiği adrese)
                teslimi ile mülkiyet ve risk bayiye geçer (TK md.188). Bayi, teslim aldığı ürünleri teslim
                anında kontrol etmekle ve olası hasarı 3 iş günü içinde yazılı bildirmekle yükümlüdür; bu
                süre içinde bildirilmeyen hasarlardan bayi sorumludur. Sevkıyat sonrası depolama/çalışma
                koşullarından kaynaklı hasarlarda üretici/garanti hükümleri geçerlidir.
              </p>
            </>
          ),
        },
        {
          title: "7. Uyuşmazlık Çözümü ve Hukuki Süreç",
          body: (
            <p>
              Hizmetlerimizle ilgili herhangi bir uyuşmazlık durumunda öncelikle müşteri hizmetlerimiz
              aracılığıyla çözüm aranacaktır. Taraflar arasında çözülememesi halinde, Türkiye Cumhuriyeti
              kanunları uygulanır. İstanbul (Çağlayan) Mahkemeleri ve Ticaret Mahkemeleri yetkilidir. 6102
              sayılı Türk Ticaret Kanunu hükümleri geçerlidir. Tüketici hakem heyeti, yalnızca tüketici
              sıfatıyla yapılan işlemler için yetkilidir — bayi siparişleri bu kapsamda değildir.
            </p>
          ),
        },
        {
          title: "8. Bayi Sorumlulukları",
          body: (
            <>
              <p>Bayi olarak aşağıdaki sorumluluklara uymak zorunludur:</p>
              <LegalList
                items={[
                  "Ticari bilgilerin güncel ve doğru olması",
                  "Bayi hesabı bilgilerinin gizliliğini korumak",
                  "Platformu yalnızca ticari tedarik amacıyla kullanmak",
                  "Diğer bayilerin ve firmaların haklarını ihlal etmemek",
                  "Fikri mülkiyet haklarına (marka, telif) saygı göstermek",
                  "Otomatik veri toplama araçları (bot, scraper) kullanmamak",
                  "Bayi fiyatlarını nihai tüketiciye doğrudan paylaşmamak",
                ]}
              />
              <p className="mt-4">
                Bu kurallara aykırı davranış tespitinde hesap askıya alınabilir veya kalıcı olarak
                kapatılabilir. Next AI Teknoloji yasal haklarını saklı tutar.
              </p>
            </>
          ),
        },
        {
          title: "9. Fikri Mülkiyet Hakları",
          body: (
            <p>
              Web sitemizdeki tüm içerik, tasarım, logo, grafik, yazı ve diğer materyaller Next AI
              Teknoloji&apos;nin fikri mülkiyeti altındadır ve telif hakları ile korunmaktadır. Bu içeriklerin
              izinsiz kopyalanması, dağıtılması veya değiştirilmesi yasaktır. Ürün görselleri ve açıklamaları
              bilgilendirme amacıyla sunulmaktadır ve üretici firmaların mülkiyetindedir.
            </p>
          ),
        },
        {
          title: "10. Mücbir Sebep (Force Majeure)",
          body: (
            <p>
              Taraflardan hiçbirinin kontrolü dışında oluşan, öngörülemez ve kaçınılamaz olaylar — doğal
              afetler (deprem, sel, yangın), salgın hastalıklar, savaş, terör, isyan, resmi makamların
              kararları (ithalat/ihracat yasakları, kısıtlamaları), telekomünikasyon/altyapı kesintileri,
              küresel tedarik ve lojistik durmaları — mücbir sebep (6098 sayılı BK md.136) sayılır. Bu
              durumlarda tarafların edimleri mücbir sebebin devam süresince askıya alınır; etkilenen taraf
              durumu öğrenmesinden itibaren 5 iş günü içinde yazılı olarak diğer tarafa bildirmekle yükümlüdür.
              Mücbir sebep 30 günü aşarsa, taraflardan her biri ilgili sipariş/sözleşmeyi feshetme hakkına
              sahiptir; bu halde önceden yapılan ödemeler mahsup edilerek iade edilir.
            </p>
          ),
        },
        {
          title: "11. İletişim",
          body: (
            <>
              <p>Bu kullanım şartları ile ilgili sorularınız için:</p>
              <LegalList
                items={[
                  <><strong>E-posta:</strong> hukuk@next-ai.com.tr</>,
                  <><strong>Telefon:</strong> 0 552 989 5959</>,
                  <><strong>Adres:</strong> Esentepe Mh. Büyükdere Cd. No:123, Şişli, İstanbul 34394</>,
                ]}
              />
            </>
          ),
        },
      ]}
    />
  )
}
