import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kullanim Sartlari | Next AI Teknoloji",
  description:
    "Next AI Teknoloji kullanim sartlari ve kosullari. Iade politikasi, garanti bilgisi ve kullanici sorumluluklari.",
}

export default function KullanimSartlariPage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1000px] mx-auto px-[var(--DTContainer_Spacing,40px)] py-16">
        <h1 className="text-[var(--DTFontSize_H2,48px)] font-bold text-[#1e1e1e] mb-4">
          Kullanim Sartlari ve Kosullari
        </h1>
        <p className="text-[14px] text-[#767676] mb-10">
          Son guncelleme: 1 Ocak 2024
        </p>

        <div className="space-y-10 text-[16px] leading-[1.5em] text-[#1e1e1e]">
          {/* 1. Genel Sartlar */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">1. Genel Sartlar</h2>
            <p>
              Bu kullanim sartlari, Next AI Teknoloji web sitesini ve hizmetlerini
              kullanmaniza iliskin kosullari belirler. Web sitemizi kullanarak bu sartlari
              kabul etmis sayilirsiniz. Bu sartlari kabul etmiyorsaniz lutfen web sitemizi
              kullanmayiniz. Next AI Teknoloji, bu sartlari onceden haber vermeksizin
              degistirme hakkini sakli tutar. Guncellenmis sartlar web sitesinde yayinlandigi
              tarihte yururluge girer.
            </p>
          </section>

          {/* 2. Hesap ve Uyelik */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              2. Hesap ve Uyelik Kosullari
            </h2>
            <p>
              Hizmetlerimizden yararlanmak icin bir hesap olusturmaniz gerekmektedir.
              Hesap olustururken verdginiz bilgilerin dogru ve guncel olmasi zorunludur.
              Hesabinizin guvenliginden siz sorumlusunuz. Sifrenizi baskalaryla paylasmayin
              ve hesabinizda suphetci bir aktivite farkedtiginde derhal bizi bilgilendirin.
              Next AI Teknoloji, herhangi bir hesabi onceden bildirimde bulunmaksizin
              askiya alma veya kapatma hakkini sakli tutar.
            </p>
          </section>

          {/* 3. Siparis ve Odeme */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              3. Siparis ve Odeme Kosullari
            </h2>
            <p>
              Tum fiyatlar Turk Lirasi (TRY) cinsinden belirtilmistir ve KDV dahildir
              (aksi belirtilmedikce). Siparis verildikten sonra fiyat degisiklikleri
              mevcut siparisi etkilemez. Odeme yontemleri: kredi karti, banka havalesi/EFT,
              kapida odeme (secili bolgelerde). Siparis onayindan sonra urun tedarik ve
              kargo sureci baslar. Teslimat suresi urun durumuna gore 1-7 is gunu arasinda
              degisir.
            </p>
          </section>

          {/* 4. Iade Politikasi */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              4. Iade Sureci ve Kosullari
            </h2>
            <p className="mb-4">
              Satin aldiginiz urunleri, teslim aldaginiz tarihten itibaren 14 gun
              icinde iade edebilirsiniz. Iade icin asagidaki kosullarin saglanmasi
              gerekmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Urun orijinal ambalajinda ve hasarsiz olmalidir</li>
              <li>Urun kullanilmamis ve fabrika ayarlarinda olmalidir</li>
              <li>Fatura ve garanti belgesi iade ile birlikte gonderilmelidir</li>
              <li>Ozel siparis urunleri ve yazilim lisanslari iade kapsaminda degildir</li>
              <li>Hijyen urunleri (kulaklik, mikrofon vb.) acilmamis olmalidir</li>
            </ul>
            <p className="mt-4">
              Iade talebinizi musteri hizmetlerimize bildirmeniz gerekmektedir. Onaylanan
              iadeler icin urun bize ulastiktan sonra 5 is gunu icinde inceleme yapilir.
              Kosullari saglayan iadeler icin geri odeme, odeme yontemine gore 3-14 is gunu
              icinde gerceklestirilir. Kredi karti ile yapilan odemelerde geri odeme ayni
              karta yapilir. Havale ile yapilan odemelerde IBAN numaraniza transfer edilir.
            </p>
          </section>

          {/* 5. Garanti */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              5. Garanti Bilgileri
            </h2>
            <p className="mb-4">
              Satin aldiginiz tum urunler, uretici firmanin resmi Turkiye garantisi
              altindadir. Garanti suresi urune gore degismekle birlikte, minimum 2 yil
              yasal garanti hakkiniz bulunmaktadir. Garanti kapsaminda:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uretim hatalari ve malzeme kusurlari karsilanir</li>
              <li>Garanti suresi icinde ucretsiz onarim veya degisim yapilir</li>
              <li>Garanti onarimi icin yetkili servis merkezlerine yonlendirme saglanir</li>
              <li>Kullanici hatasi, durusme, su hasari gibi durumlar garanti kapsaminda degildir</li>
            </ul>
            <p className="mt-4">
              Garanti haklariniz icin urun ile birlikte teslim edilen garanti belgesini
              saklayiniz. Garanti belgesi olmadan garanti taleplerinde fatura tarihinden
              itibaren garanti suresi hesaplanir.
            </p>
          </section>

          {/* 6. Uyusmazlik Cozumu */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              6. Uyusmazlik Cozumu ve Hukuki Surec
            </h2>
            <p>
              Hizmetlerimizle ilgili herhangi bir uyusmazlik durumunda oncelikle
              musteri hizmetlerimiz araciligiyla cozum aranacaktir. Taraflar arasinda
              cozume ulaSilamamasi halinde, Turkiye Cumhuriyeti kanunlari uygulanir.
              Tuketici hakem heyetleri ve Istanbul mahkemeleri yetkilidir.
              6502 sayili Tuketicinin Korunmasi Hakkinda Kanun kapsaminda haklariniz
              saklidir. Tuketici hakem heyetine basvuru icin T.C. Ticaret Bakanligi
              web sitesinden bilgi alabilirsiniz.
            </p>
          </section>

          {/* 7. Geri Odeme */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              7. Iade Sureci ve Geri Odeme
            </h2>
            <p>
              Onaylanan iade talepleriniz icin geri odeme sureci asagidaki gibidir:
              Kredi karti ile yapilan odemelerde geri odeme 3-7 is gunu icinde ayni karta
              yansir. Banka havalesi ile yapilan odemelerde geri odeme 5-14 is gunu icinde
              belirttiginiz IBAN numarasina yapilir. Kapida odeme ile yapilan alisverislerde
              geri odeme banka havalesi yoluyla gerceklestirilir. Kismi iade durumlarinda
              sadece iade edilen urunun tutari geri odenir. Kargo ucreti, urunun kusurlu
              veya yanlis gonderilmesi haricinde musteriye aittir.
            </p>
          </section>

          {/* 8. Kullanici Sorumluluklari */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              8. Kullanici Sorumluluklari ve Yukumlulukleri
            </h2>
            <p className="mb-4">
              Web sitemizi ve hizmetlerimizi kullanirken asagidaki sorumluluklara
              uymaniz gerekmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dogru ve guncel bilgiler saglamak</li>
              <li>Hesap bilgilerinizin gizliligini korumak</li>
              <li>Web sitesini yasal amaclarla kullanmak</li>
              <li>Diger kullanicilarin haklarini ihlal etmemek</li>
              <li>Fikri mulkiyet haklarina saygi gostermek</li>
              <li>Web sitesinin guvenligini tehlikeye atacak davranislardan kacinmak</li>
              <li>Otomatik veri toplama araclari (bot, scraper vb.) kullanmamak</li>
            </ul>
            <p className="mt-4">
              Bu kurallara aykiri davranis tespitinde hesabiniz askiya alinabilir veya
              kalici olarak kapatilabilir. Next AI Teknoloji, kurallari ihlal eden
              kullanicilara karsi yasal haklarini kullanma hakkini sakli tutar.
            </p>
          </section>

          {/* 9. Fikri Mulkiyet */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              9. Fikri Mulkiyet Haklari
            </h2>
            <p>
              Web sitemizdeki tum icerik, tasarim, logo, grafik, yazi ve diger materyaller
              Next AI Teknoloji&apos;nin fikri mulkiyeti altindadir ve telif haklari ile
              korunmaktadir. Bu iceriklerin izinsiz kopyalanmasi, dagitilmasi veya
              degistirilmesi yasaktir. Urun gorselleri ve aciklamalari bilgilendirme
              amaciyla sunulmaktadir ve uretici firmalarinin mulkiyetindedir.
            </p>
          </section>

          {/* 10. Iletisim */}
          <section>
            <h2 className="text-xl font-bold text-[#1e1e1e] mb-4">
              10. Iletisim
            </h2>
            <p>
              Bu kullanim sartlari ile ilgili sorulariniz icin asagidaki kanallardan
              bize ulasabilirsiniz:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>E-posta: hukuk@next-ai.com.tr</li>
              <li>Telefon: 0 552 989 5959</li>
              <li>Adres: Esentepe Mh. Buyukdere Cd. No:123, Sisli, Istanbul 34394</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
