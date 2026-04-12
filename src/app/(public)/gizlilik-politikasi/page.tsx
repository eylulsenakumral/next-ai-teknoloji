import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gizlilik Politikasi | Next AI Teknoloji",
  description:
    "Next AI Teknoloji gizlilik politikasi. Kisisel verilerinizin nasil toplandigi, kullanildigi ve korundugu hakkinda bilgi.",
}

export default function GizlilikPolitikasiPage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1000px] mx-auto px-[var(--DTContainer_Spacing,40px)] py-16">
        <h1 className="text-[var(--DTFontSize_H2,48px)] font-bold text-[#1e1e1e] mb-4">
          Gizlilik Politikasi
        </h1>
        <p className="text-[14px] text-[#767676] mb-10">
          Son guncelleme: 1 Ocak 2024
        </p>

        <div className="space-y-10 text-[16px] leading-[1.5em] text-[#1e1e1e]">
          {/* 1. Giris */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">1. Giris</h2>
            <p>
              Next AI Teknoloji olarak kisisel verilerinizin guvenligine buyuk onem veriyoruz.
              Bu gizlilik politikasi, web sitemizi ve hizmetlerimizi kullandiginizda kisisel
              verilerinizin nasil toplandigi, islendigi, kullanildigi ve korundugu hakkinda
              sizi bilgilendirmek amaciyla hazirlanmistir. Bu politika, 6698 sayili Kisisel
              Verilerin Korunmasi Kanunu (KVKK) ve Avrupa Birliginin Genel Veri Koruma
              Tuzugu (GDPR) kapsaminda haklarinizi ve yuku mluluklerimizi aciklamaktadir.
            </p>
          </section>

          {/* 2. Kisisel Veri Toplama */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              2. Kisisel Veri Toplama ve Isleme
            </h2>
            <p className="mb-4">
              Web sitemizi ziyaret ettiginizde ve hizmetlerimizden yararlandiginizda asagidaki
              kisisel verileri topluyoruz:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kimlik bilgileri: Ad, soyad, firma unvani</li>
              <li>Iletisim bilgileri: E-posta adresi, telefon numarasi, posta adresi</li>
              <li>Hesap bilgileri: Kullanici adi, sifre (sifrelenmis olarak)</li>
              <li>Islem bilgileri: Siparis gecmisi, odeme bilgileri, teslimat adresleri</li>
              <li>Teknik bilgiler: IP adresi, tarayici tipi, isletim sistemi, erisim zamanlari</li>
              <li>Kullanim verileri: Ziyaret edilen sayfalar, tiklamalar, arama sorgulari</li>
            </ul>
            <p className="mt-4">
              Bu veriler, sizinle sozlesmemizi yerine getirmek, hizmet kalitemizi artirmak ve
              yasal yukumluluklerimizi karsilamak amaciyla toplanmaktadir. Veri toplama islemimiz
              her zaman hukuka uygun ve seffaf bir sekilde gerceklestirilmektedir.
            </p>
          </section>

          {/* 3. Veri Kullanim Amaclari */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              3. Veri Kullanim Amaclari
            </h2>
            <p className="mb-4">
              Toplanan kisisel veriler asagidaki amaclarla kullanilmaktadir:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Siparis islemlerinin gerceklestirilmesi ve takibi</li>
              <li>Musteri hizmetleri ve teknik destek saglanmasi</li>
              <li>Urun ve hizmet tanitimlarinin yapilmasi (izniniz dahilinde)</li>
              <li>Web sitesi deneyiminin kisiselleStirilmesi ve iyileStirilmesi</li>
              <li>Yasal yukumluluklerin yerine getirilmesi</li>
              <li>Guvenlik onlemlerinin uygulanmasi ve dolandiricilik onleme</li>
              <li>Istatistiksel analizler ve pazar arastirmalari</li>
            </ul>
          </section>

          {/* 4. Veri Koruma ve Guvenlik */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              4. Veri Koruma ve Guvenlik Onlemleri
            </h2>
            <p className="mb-4">
              Kisisel verilerinizi korumak icin asagidaki guvenlik onlemlerini uygulamaktayiz:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>256-bit SSL/TLS sifreleme ile veri iletimi</li>
              <li>Veritabani sifreleme ve erisim kontrolleri</li>
              <li>Duzebli guvenlik denetimleri ve penetrasyon testleri</li>
              <li>Calisan egitim programlari ve gizlilik sozlesmeleri</li>
              <li>Fiziksel guvenlik onlemleri (sunucu odalari, erisim kartlari)</li>
              <li>Yedekleme ve felaket kurtarma planlari</li>
            </ul>
            <p className="mt-4">
              Tum veriler Turkiye sinirlarindaki guvenli sunucularda depolanmaktadir.
              Ucuncu taraflarla veri paylasimi sadece hizmet saglanmasi icin zorunlu
              oldugu durumlarda ve gizlilik anlasmasi kapsaminda gerceklestirilmektedir.
            </p>
          </section>

          {/* 5. Cerez Politikasi */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              5. Cerez (Cookie) Politikasi
            </h2>
            <p className="mb-4">
              Web sitemiz, kullanici deneyimini iyilestirmek icin cerezler kullanmaktadir.
              Cerezler, tarayiciniza yerlestirileb kucuk metin dosyalaridir. Kullandigimiz
              cerez turleri:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Zorunlu cerezler:</strong> Web sitesinin duzgun calismasi icin
                gerekli olan cerezler. Oturum yonetimi ve guvenlik amaciyla kullanilir.
              </li>
              <li>
                <strong>Analitik cerezler:</strong> Ziyaretci davranislarini anlamak ve
                web sitesini iyilestirmek icin kullanilan cerezler (Google Analytics vb.)
              </li>
              <li>
                <strong>Fonksiyonel cerezler:</strong> Kullanici tercihlerini hatirlamak
                icin kullanilan cerezler (dil tercihi, gorunum ayarlari vb.)
              </li>
              <li>
                <strong>Pazarlama cerezleri:</strong> Size ilgili reklamlar gostermek
                amaciyla kullanilan cerezler. Bu cerezler sadece izniniz dahilinde aktif edilir.
              </li>
            </ul>
            <p className="mt-4">
              Tarayici ayarlarinizdan cerezleri yonetebilir veya tamamen devre disi
              birakabilirsiniz. Ancak bazi cerezlerin devre disi birakilmasi web sitesinin
              islevselligini olumsuz etkileyebilir.
            </p>
          </section>

          {/* 6. KVKK ve GDPR Haklari */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              6. KVKK ve GDPR Kapsamindaki Haklariniz
            </h2>
            <p className="mb-4">
              6698 sayili KVKK ve GDPR kapsaminda asagidaki haklara sahipsiniz:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kisisel verilerinizin islenip islenmedigini ogrenme hakki</li>
              <li>Kisisel verileriniz islenmisse buna iliskin bilgi talep etme hakki</li>
              <li>Kisisel verilerin islenmne amacini ve bunlarin amacina uygun kullanilip
                kullanilmadigini ogrenme hakki</li>
              <li>Yurt icinde veya yurt disinda kisisel verilerin aktarildigi ucuncu
                kisileri bilme hakki</li>
              <li>Kisisel verilerin eksik veya yanlis islenmis olmasi halinde bunlarin
                duzeltilmesini isteme hakki</li>
              <li>Kisisel verilerin silinmesini veya yok edilmesini isteme hakki</li>
              <li>Islemin ucuncu kisilere bildirilmesini isteme hakki</li>
              <li>Islenen verilerin munhasiran otomatik sistemler vasitasiyla analiz
                edilmesi suretiyle kisi aleyhine bir sonucun ortaya cikmasina itiraz etme hakki</li>
              <li>Kisisel verilerin kanuna aykiri olarak islenmesi sebebiyle zarara
                ugramasi halinde zararin giderilmesini talep etme hakki</li>
            </ul>
          </section>

          {/* 7. Veri Saklama Suresi */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              7. Veri Saklama Suresi
            </h2>
            <p>
              Kisisel verileriniz, toplama amacinin gerektirdigi sure boyunca saklanir.
              Yasal yukumlulukler geregi (vergi mevzuati, ticaret hukuku vb.) belirli
              veriler daha uzun sure saklanabilir. Saklama suresi sona eren veriler
              guvenli bir sekilde silinir veya anonim hale getirilir. Hesabinizi
              kapatmaniz durumunda kisisel verileriniz 30 gun icinde sistemlerimizden
              silinir, ancak yasal yukumlulukler kapsaminda tutulan veriler ilgili
              surelerin sonunda yok edilir.
            </p>
          </section>

          {/* 8. Degisiklikler */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              8. Politika Degisiklikleri
            </h2>
            <p>
              Bu gizlilik politikasi zaman zaman guncellenebilir. Onemli degisiklikler
              yapilmasi durumunda web sitemiz uzerinden ve/veya e-posta yoluyla sizi
              bilgilendiririz. Guncel politikayi duzenli olarak kontrol etmenizi
              oneririz.
            </p>
          </section>

          {/* 9. Iletisim */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              9. Gizlilik ile Ilgili Iletisim
            </h2>
            <p>
              Kisisel verilerinizle ilgili soru, talep veya sikayetleriniz icin asagidaki
              kanallardan bize ulasabilirsiniz:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>E-posta: kvkk@next-ai.com.tr</li>
              <li>Telefon: 0 552 989 5959</li>
              <li>Adres: Esentepe Mh. Buyukdere Cd. No:123, Sisli, Istanbul 34394</li>
            </ul>
            <p className="mt-4">
              Basvurulariniz en gec 30 gun icinde cevaplandirilacaktir.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
