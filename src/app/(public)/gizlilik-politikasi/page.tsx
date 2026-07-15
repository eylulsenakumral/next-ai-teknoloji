import type { Metadata } from "next"
import { LegalPage, LegalList } from "@/components/public/legal-page"

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Next AI Teknoloji",
  description:
    "Next AI Teknoloji gizlilik politikası. Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi. KVKK ve GDPR uyumlu.",
  alternates: { canonical: "/gizlilik-politikasi" },
}

export default function GizlilikPolitikasiPage() {
  return (
    <LegalPage
      title="Gizlilik Politikası"
      subtitle="KVKK & GDPR"
      lastUpdated="15 Temmuz 2026"
      intro={
        <p>
          Next AI Teknoloji olarak kişisel verilerinizin güvenliğine büyük önem veriyoruz. Bu gizlilik
          politikası, web sitemizi ve hizmetlerimizi kullandığınızda kişisel verilerinizin nasıl toplandığı,
          işlendiği, kullanıldığı ve korunduğu hakkında sizi bilgilendirmek amacıyla hazırlanmıştır. Bu
          politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliğinin Genel Veri
          Koruma Tüzüğü (GDPR) kapsamında haklarınızı ve yükümlülüklerimizi açıklamaktadır.
        </p>
      }
      sections={[
        {
          title: "1. Kişisel Veri Toplama ve İşleme",
          body: (
            <>
              <p>
                Web sitemizi ziyaret ettiğinizde ve hizmetlerimizden yararlandığınızda aşağıdaki kişisel
                verileri topluyoruz:
              </p>
              <LegalList
                items={[
                  <><strong>Kimlik bilgileri:</strong> Ad, soyad, firma unvanı</>,
                  <><strong>İletişim bilgileri:</strong> E-posta adresi, telefon numarası, posta adresi</>,
                  <><strong>Hesap bilgileri:</strong> Kullanıcı adı, şifre (şifrelenmiş olarak)</>,
                  <><strong>İşlem bilgileri:</strong> Sipariş geçmişi, ödeme bilgileri, teslimat adresleri</>,
                  <><strong>Teknik bilgiler:</strong> IP adresi, tarayıcı tipi, işletim sistemi, erişim zamanları</>,
                  <><strong>Kullanım verileri:</strong> Ziyaret edilen sayfalar, tıklamalar, arama sorguları</>,
                ]}
              />
              <p className="mt-4">
                Bu veriler, sizinle sözleşmemizi yerine getirmek, hizmet kalitemizi artırmak ve yasal
                yükümlülüklerimizi karşılamak amacıyla toplanmaktadır.
              </p>
            </>
          ),
        },
        {
          title: "2. Veri Kullanım Amaçları",
          body: (
            <LegalList
              items={[
                "Sipariş işlemlerinin gerçekleştirilmesi ve takibi",
                "Müşteri hizmetleri ve teknik destek sağlanması",
                "Ürün ve hizmet tanıtımlarının yapılması (izniniz dahilinde)",
                "Web sitesi deneyiminin kişiselleştirilmesi ve iyileştirilmesi",
                "Yasal yükümlülüklerin yerine getirilmesi",
                "Güvenlik önlemlerinin uygulanması ve dolandırıcılık önleme",
                "İstatistiksel analizler ve pazar araştırmaları",
              ]}
            />
          ),
        },
        {
          title: "3. Veri Koruma ve Güvenlik Önlemleri",
          body: (
            <>
              <p>Kişisel verilerinizi korumak için aşağıdaki güvenlik önlemlerini uygulamaktayız:</p>
              <LegalList
                items={[
                  "256-bit SSL/TLS şifreleme ile veri iletimi",
                  "Veritabanı şifreleme ve erişim kontrolleri",
                  "Düzenli güvenlik denetimleri ve penetrasyon testleri",
                  "Çalışan eğitim programları ve gizlilik sözleşmeleri",
                  "Fiziksel güvenlik önlemleri (sunucu odaları, erişim kartları)",
                  "Yedekleme ve felaket kurtarma planları",
                ]}
              />
              <p className="mt-4">
                Tüm veriler Türkiye sınırlarındaki güvenli sunucularda depolanmaktadır. Üçüncü taraflarla
                veri paylaşımı sadece hizmet sağlanması için zorunlu olduğu durumlarda ve gizlilik anlaşması
                kapsamında gerçekleştirilmektedir.
              </p>
            </>
          ),
        },
        {
          title: "4. Çerez (Cookie) Politikası",
          body: (
            <>
              <p>
                Web sitemiz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır. Kullandığımız
                çerez türleri:
              </p>
              <LegalList
                items={[
                  <><strong>Zorunlu çerezler:</strong> Web sitesinin düzgün çalışması için gerekli. Oturum yönetimi ve güvenlik.</>,
                  <><strong>Analitik çerezler:</strong> Ziyaretçi davranışlarını anlamak ve siteyi iyileştirmek (Google Analytics vb.)</>,
                  <><strong>Fonksiyonel çerezler:</strong> Kullanıcı tercihlerini hatırlamak (dil, görünüm ayarları)</>,
                  <><strong>Pazarlama çerezleri:</strong> İlgili reklamlar göstermek — sadece izninizle aktif edilir.</>,
                ]}
              />
              <p className="mt-4">
                Tarayıcı ayarlarınızdan çerezleri yönetebilir veya devre dışı bırakabilirsiniz. Ancak bazı
                çerezlerin devre dışı bırakılması site işlevselliğini olumsuz etkileyebilir.
              </p>
            </>
          ),
        },
        {
          title: "5. KVKK ve GDPR Kapsamındaki Haklarınız",
          body: (
            <LegalList
              items={[
                "Kişisel verilerinizin işlenip işlenmediğini öğrenme hakkı",
                "İşlenmişse buna ilişkin bilgi talep etme hakkı",
                "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
                "Yurt içinde veya dışında verilerin aktarıldığı üçüncü kişileri bilme",
                "Eksik veya yanlış işlenen verilerin düzeltilmesini isteme",
                "Kişisel verilerin silinmesini veya yok edilmesini isteme",
                "İşlemin üçüncü kişilere bildirilmesini isteme",
                "Otomatik sistemler vasıtasıyla kişi aleyhine sonuca itiraz etme",
                "Kanuna aykırı işleme sebebiyle zararın giderilmesini talep etme",
              ]}
            />
          ),
        },
        {
          title: "6. Veri Saklama Süresi",
          body: (
            <p>
              Kişisel verileriniz, toplama amacının gerektirdiği süre boyunca saklanır. Yasal yükümlülükler
              gereği (vergi mevzuatı, ticaret hukuku vb.) belirli veriler daha uzun süre saklanabilir. Saklama
              süresi sona eren veriler güvenli bir şekilde silinir veya anonim hale getirilir. Hesabınızı
              kapatmanız durumunda kişisel verileriniz 30 gün içinde sistemlerimizden silinir, yasal
              yükümlülükler kapsamında tutulan veriler ilgili sürelerin sonunda yok edilir.
            </p>
          ),
        },
        {
          title: "7. Politika Değişiklikleri",
          body: (
            <p>
              Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler yapılması durumunda web
              sitemiz üzerinden ve/veya e-posta yoluyla sizi bilgilendiririz. Güncel politikayı düzenli olarak
              kontrol etmenizi öneririz.
            </p>
          ),
        },
        {
          title: "8. Gizlilik ile İlgili İletişim",
          body: (
            <>
              <p>
                Kişisel verilerinizle ilgili soru, talep veya şikayetleriniz için aşağıdaki kanallardan bize
                ulaşabilirsiniz:
              </p>
              <LegalList
                items={[
                  <><strong>E-posta:</strong> kvkk@next-ai.com.tr</>,
                  <><strong>Telefon:</strong> 0 552 989 5959</>,
                  <><strong>Adres:</strong> Esentepe Mh. Büyükdere Cd. No:123, Şişli, İstanbul 34394</>,
                ]}
              />
              <p className="mt-4">Başvurularınız en geç 30 gün içinde cevaplandırılacaktır.</p>
            </>
          ),
        },
      ]}
    />
  )
}
