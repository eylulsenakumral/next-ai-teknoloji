import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Next AI Teknoloji",
  description:
    "Next AI Teknoloji gizlilik politikası. Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi.",
}

export default function GizlilikPolitikasiPage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1000px] mx-auto px-[var(--DTContainer_Spacing,40px)] py-16">
        <h1 className="text-[var(--DTFontSize_H2,48px)] font-bold text-[#1e1e1e] mb-4">
          Gizlilik Politikası
        </h1>
        <p className="text-[14px] text-[#767676] mb-10">
          Son güncelleme: 1 Ocak 2024
        </p>

        <div className="space-y-10 text-[16px] leading-[1.5em] text-[#1e1e1e]">
          {/* 1. Giriş */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">1. Giriş</h2>
            <p>
              Next AI Teknoloji olarak kişisel verilerinizin güvenliğine büyük önem veriyoruz.
              Bu gizlilik politikası, web sitemizi ve hizmetlerimizi kullandığınızda kişisel
              verilerinizin nasıl toplandığı, işlendiği, kullanıldığı ve korunduğu hakkında
              sizi bilgilendirmek amacıyla hazırlanmıştır. Bu politika, 6698 sayılı Kişisel
              Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliğinin Genel Veri Koruma
              Tüzüğü (GDPR) kapsamında haklarınızı ve yükümlülüklerimizi açıklamaktadır.
            </p>
          </section>

          {/* 2. Kişisel Veri Toplama */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              2. Kişisel Veri Toplama ve İşleme
            </h2>
            <p className="mb-4">
              Web sitemizi ziyaret ettiğinizde ve hizmetlerimizden yararlandığınızda aşağıdaki
              kişisel verileri topluyoruz:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kimlik bilgileri: Ad, soyad, firma unvanı</li>
              <li>İletişim bilgileri: E-posta adresi, telefon numarası, posta adresi</li>
              <li>Hesap bilgileri: Kullanıcı adı, şifre (şifrelenmiş olarak)</li>
              <li>İşlem bilgileri: Sipariş geçmişi, ödeme bilgileri, teslimat adresleri</li>
              <li>Teknik bilgiler: IP adresi, tarayıcı tipi, işletim sistemi, erişim zamanları</li>
              <li>Kullanım verileri: Ziyaret edilen sayfalar, tıklamalar, arama sorguları</li>
            </ul>
            <p className="mt-4">
              Bu veriler, sizinle sözleşmemizi yerine getirmek, hizmet kalitemizi artırmak ve
              yasal yükümlülüklerimizi karşılamak amacıyla toplanmaktadır. Veri toplama işleminiz
              her zaman hukuka uygun ve şeffaf bir şekilde gerçekleştirilmektedir.
            </p>
          </section>

          {/* 3. Veri Kullanım Amaçları */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              3. Veri Kullanım Amaçları
            </h2>
            <p className="mb-4">
              Toplanan kişisel veriler aşağıdaki amaçlarla kullanılmaktadır:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sipariş işlemlerinin gerçekleştirilmesi ve takibi</li>
              <li>Müşteri hizmetleri ve teknik destek sağlanması</li>
              <li>Ürün ve hizmet tanıtımlarının yapılması (izniniz dahilinde)</li>
              <li>Web sitesi deneyiminin kişiselleştirilmesi ve iyileştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>Güvenlik önlemlerinin uygulanması ve dolandırıcılık önleme</li>
              <li>İstatistiksel analizler ve pazar araştırmaları</li>
            </ul>
          </section>

          {/* 4. Veri Koruma ve Güvenlik */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              4. Veri Koruma ve Güvenlik Önlemleri
            </h2>
            <p className="mb-4">
              Kişisel verilerinizi korumak için aşağıdaki güvenlik önlemlerini uygulamaktayız:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>256-bit SSL/TLS şifreleme ile veri iletimi</li>
              <li>Veritabanı şifreleme ve erişim kontrolleri</li>
              <li>Düzenli güvenlik denetimleri ve penetrasyon testleri</li>
              <li>Çalışan eğitim programları ve gizlilik sözleşmeleri</li>
              <li>Fiziksel güvenlik önlemleri (sunucu odaları, erişim kartları)</li>
              <li>Yedekleme ve felaket kurtarma planları</li>
            </ul>
            <p className="mt-4">
              Tüm veriler Türkiye sınırlarındaki güvenli sunucularda depolanmaktadır.
              Üçüncü taraflarla veri paylaşımı sadece hizmet sağlanması için zorunlu
              olduğu durumlarda ve gizlilik anlaşması kapsamında gerçekleştirilmektedir.
            </p>
          </section>

          {/* 5. Çerez Politikası */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              5. Çerez (Cookie) Politikası
            </h2>
            <p className="mb-4">
              Web sitemiz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır.
              Çerezler, tarayıcınıza yerleştirilen küçük metin dosyalarıdır. Kullandığımız
              çerez türleri:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Zorunlu çerezler:</strong> Web sitesinin düzgün çalışması için
                gerekli olan çerezler. Oturum yönetimi ve güvenlik amacıyla kullanılır.
              </li>
              <li>
                <strong>Analitik çerezler:</strong> Ziyaretçi davranışlarını anlamak ve
                web sitesini iyileştirmek için kullanılan çerezler (Google Analytics vb.)
              </li>
              <li>
                <strong>Fonksiyonel çerezler:</strong> Kullanıcı tercihlerini hatırlamak
                için kullanılan çerezler (dil tercihi, görünüm ayarları vb.)
              </li>
              <li>
                <strong>Pazarlama çerezleri:</strong> Size ilgili reklamlar göstermek
                amacıyla kullanılan çerezler. Bu çerezler sadece izniniz dahilinde aktif edilir.
              </li>
            </ul>
            <p className="mt-4">
              Tarayıcı ayarlarınızdan çerezleri yönetebilir veya tamamen devre dışı
              bırakabilirsiniz. Ancak bazı çerezlerin devre dışı bırakılması web sitesinin
              işlevselliğini olumsuz etkileyebilir.
            </p>
          </section>

          {/* 6. KVKK ve GDPR Hakları */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              6. KVKK ve GDPR Kapsamındaki Haklarınız
            </h2>
            <p className="mb-4">
              6698 sayılı KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme hakkı</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme hakkı</li>
              <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp
                kullanılmadığını öğrenme hakkı</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü
                kişileri bilme hakkı</li>
              <li>Kişisel verilerin eksik veya yanlış işlenmiş olması halinde bunların
                düzeltilmesini isteme hakkı</li>
              <li>Kişisel verilerin silinmesini veya yok edilmesini isteme hakkı</li>
              <li>İşlemin üçüncü kişilere bildirilmesini isteme hakkı</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz
                edilmesi suretiyle kişi aleyhine bir sonucun ortaya çıkmasına itiraz etme hakkı</li>
              <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara
                uğraması halinde zararın giderilmesini talep etme hakkı</li>
            </ul>
          </section>

          {/* 7. Veri Saklama Süresi */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              7. Veri Saklama Süresi
            </h2>
            <p>
              Kişisel verileriniz, toplama amacının gerektirdiği süre boyunca saklanır.
              Yasal yükümlülükler gereği (vergi mevzuatı, ticaret hukuku vb.) belirli
              veriler daha uzun süre saklanabilir. Saklama süresi sona eren veriler
              güvenli bir şekilde silinir veya anonim hale getirilir. Hesabınızı
              kapatmanız durumunda kişisel verileriniz 30 gün içinde sistemlerimizden
              silinir, ancak yasal yükümlülükler kapsamında tutulan veriler ilgili
              sürelerin sonunda yok edilir.
            </p>
          </section>

          {/* 8. Değişiklikler */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              8. Politika Değişiklikleri
            </h2>
            <p>
              Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler
              yapılması durumunda web sitemiz üzerinden ve/veya e-posta yoluyla sizi
              bilgilendiririz. Güncel politikayı düzenli olarak kontrol etmenizi
              öneririz.
            </p>
          </section>

          {/* 9. İletişim */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              9. Gizlilik ile İlgili İletişim
            </h2>
            <p>
              Kişisel verilerinizle ilgili soru, talep veya şikayetleriniz için aşağıdaki
              kanallardan bize ulaşabilirsiniz:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>E-posta: kvkk@next-ai.com.tr</li>
              <li>Telefon: 0 552 989 5959</li>
              <li>Adres: Esentepe Mh. Büyükdere Cd. No:123, Şişli, İstanbul 34394</li>
            </ul>
            <p className="mt-4">
              Başvurularınız en geç 30 gün içinde cevaplandırılacaktır.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
