# nexadepo.com Frontend İnceleme Raporu

> **İnceleyen:** hy3 (Kıdemli Frontend Mühendisi)
> **Tarih:** 2026-07-18
> **Yöntem:** Playwright headless (Chromium) ile canlı site analizi — konsol hataları, network 4xx/5xx, kırık asset, responsive overflow, auth wall, meta SEO.
> **Not:** Bu dosyaya farklı agentlar da kendi bulgularını ekleyecek (hy3 / diğer başlıklar). İnceleme sonunda birleştirilecek.

---

## 1. Önemli Hatalar (Critical)

### 1.1 Ana sayfada RSC fetch `ERR_ABORTED` (sürekli tekrar ediyor)
Her sayfa açılışında `https://nexadepo.com/markalar?_rsc=XXXX` istekleri `net::ERR_ABORTED` ile iptal ediliyor (ana sayfa, iletişim, katalog vb.).
- **Etkisi:** Gereksiz network trafiği, olası hidrasyon/önyükleme gecikmesi.
- **Sebep (tahmini):** `/markalar` rotasına yapılan prefetch/RSC çağrısı bir nedenle iptal ediliyor — muhtemelen route'ta koşullu redirect veya Suspense boundary sorunu.
- **Öneri:** Next.js App Router'da `markalar` route'unun loading/error boundary ve prefetch davranışını gözden geçir; iptal edilen isteğin kaynağını `router.prefetch` veya `<Link>` kullanımında bul.

### 1.2 `/urunler` sayfasında API 401
`/api/catalog/products?sortBy=newest&page=1` → **HTTP 401 (Unauthorized)**.
- Katalog ürünleri auth gerektiriyor olabilir; ancak bu sayfa `/urunler` (public) olarak açılıyor ve ürün verisi çekilemiyor.
- **Etkisi:** Public ürün kataloğu boş/hatalı görünebilir.
- **Öneri:** 401 dönen endpoint'in public mı olması gerektiğini netleştir; public katalog ise token olmadan servis et, değilse sayfayı auth wall'a yönlendir.

### 1.3 `/markalar` sayfasında kırık marka görselliği
`https://nexadepo.com/storage/brands/2cf5cd59-59f0-4ad2-a168-63fb6d4c0e37.jpg` → **HTTP 404**.
- **Etkisi:** Marka logosu kırık görünüyor (broken image).
- **Öneri:** Eksik görseli yükle veya fallback logo (placeholder) ekle; `storage/brands` asset yönetimini kontrol et.

### 1.4 Sistematik auth wall sorunu (nav menüsünün çoğu linki login'e atıyor)
İlk incelemede `/hakkimizda`, `/bayiler` auth wall'a düşüyordu. Derinlemesine taramada **nav menüsündeki 9 linkten yalnızca 3'ü (`/`, `/katalog`, `/markalar`) gerçekten public**; geri kalanları giriş yapmamış kullanıcıyı `/login?callbackUrl=...` adresine yönlendiriyor:
- `/teklif-iste` → login ✅ (Title: `Giriş`)
- `/proje-tasarim` → login ✅
- `/cozumler` → login ✅
- `/bayi-programi` → login ✅ (AMA nav'da "Bayi Programı" public gibi gösteriliyor)
- `/hakkimizda` → login ✅
- `/bayiler` → login ✅
- `/bayimiz-olun` → ✅ public (doğru, başvuru formu açık)
- `/bayi-giris` → ✅ login formu (doğru)
- **Sorun:** Menüde "Çözümler", "Projenizi Tasarlayalım", "Teklif İste", "Bayi Programı", "Hakkımızda", "Bayiler" linklerine tıklayan misafir kullanıcı anında login ekranına savruluyor. Bu kötü bir misafir deneyimi ve dönüşüm kaybı.
- **Öneri:** Bu sayfaların içeriği public olabilecek nitelikte (çözüm tanıtımları, proje tasarım aracı, teklif formu). Mümkünse public'e aç; ya da menüde "Giriş gerekli" rozeti / hover tooltip ile beklenti yönetimi yap. En azından `/bayi-programi` ile `/bayi-giris` karışıklığını çöz (ikisi de aynı login formu gösteriyor).

### 1.5 🔴 KRİTİK: Ürün görselleri `402 Payment Required` (b2bdepo.com kaynaklı)
`/katalog` ve ürün detay sayfalarında ürün fotoğrafları `https://www.b2bdepo.com/images/UrunResimleri/...` adresinden Next.js image optimizer (`/_next/image?url=...b2bdepo.com...`) üzerinden çekiliyor ve **HTTP 402 (Payment Required) dönüyor**.
- `/katalog`: **11 adet 402** görsel hatası (konsol dolu).
- Ürün detay (ASUS Monitor): **14/15 görsel 402** — galeri neredeyse tamamen kırık.
- HDD ürününde ise 4/4 görsel **200** (çalışıyor). Yani sorun ürün bazlı değişken: bazı b2bdepo.com görselleri 402, bazıları OK.
- **Etkisi:** Ürün kartları ve detay galerileri boş/kırık görünüyor → satış dönüşümü doğrudan etkilenir. Ayrıca LCP metriği 402 görsel yüzünden ölçülemiyor (LCP 0 geliyor).
- **Kök neden (tahmini):** `b2bdepo.com` üzerinde görsel başına quota/ücretli erişim veya token eksikliği; ya da o domain için Next image optimizer'ın remote pattern izni/ücretlendirme sorunu.
- **Öneri:**
  1. `b2bdepo.com` görsel erişim/quota durumunu acil kontrol et (402 = ödeme/limit).
  2. Görselleri nexadepo.com'a mirror'la (`/storage/products/...`) veya CDN'e taşı; `next.config` remotePatterns'ı güncelle.
  3. Görsel yüklenemezse `onError` fallback (placeholder) ekle.

### 1.6 `/urunler` + `/katalog` ikilemi ve 401
- `/urunler` → `/api/catalog/products` **401** (public katalog boş).
- `/katalog` → 200 ve içerik var, ama görselleri 402 (bkz. 1.5).
- **Öneri:** `/urunler`'i `/katalog`'a 301 yönlendir; `/katalog` API'sinin public çalıştığından emin ol.

---

## 2. Uyumsuzluklar (Inconsistencies)

### 2.1 Çift ürün rotası
- Navigasyon `/katalog` linkini kullanıyor.
- Ancak `/urunler` de 200 dönüyor ve "ÜRÜN KATALOĞU" başlıklı ayrı bir sayfa.
- **Risk:** Duplicate content (SEO), kullanıcı kafa karışıklığı, bakım yükü.
- **Öneri:** Tek rotaya yönlendir (örn. `/urunler` → `/katalog` 301 redirect), ya da hangisi aktifse diğerini kaldır.

### 2.2 Title / Meta tutarsızlığı
| Sayfa | Title | Meta Description |
|---|---|---|
| `/` | Next AI Teknoloji — Güvenlik & Network... | ✅ detaylı, iyi |
| `/urunler` | Bayi Portalı | ❌ Generic, katalog için alakasız |
| `/markalar` | Markalar — 27+ Global... | ✅ iyi |
| `/hakkimizda`, `/bayiler` | Giriş | ❌ login başlığı sızmış |
| `/kategori` | Ürün Kategorileri | ✅ |

- **Öneri:** Her route için özelleştirilmiş, anahtar kelime odaklı title/meta üret (özellikle `/urunler` "Bayi Portalı" yerine katalog odaklı olmalı).

### 2.3 Ana sayfada ürün/kategori kart linki yok
Ana sayfa sadece 10 benzersiz link içeriyor; kategori (`/kategoriler/*`) ve ürün (`/urun*`) linki hiç yok.
- **Etkisi:** Ana sayfadan derinlikli gezinme kopuk; SEO internal linking zayıf.
- **Öneri:** Ana sayfaya popüler kategoriler / öne çıkan ürünler bölümü ekle.

### 2.4 Mobil hamburger menü tespit edilemedi
390px viewport'ta horizontal overflow yok (iyi) ama hamburger/`menu` butonu DOM'da bulunamadı.
- **Risk:** Mobilde navigasyon erişilemez olabilir (linkler ya gizli ya da dokunmatik olarak zor).
- **Öneri:** Mobil nav davranışını manuel test et; hamburger toggle'ın `aria-label` ve erişilebilirliğini doğrula.

---

## 3. Eksikler (Gaps)

- **404 sayfası yok:** `/sayfa-yok-xyz` → 200 dönüyor (login benzeri içerik). Bilinmeyen route'lar düzgün 404 vermeli (`not-found.tsx`).
- **Lazy/placeholder görseller:** `/kategori` 15 görsel içeriyor, hepsi yüklü; LCP için `priority`/`loading="lazy"` ve `width/height` optimizasyonu doğrulanmalı. (Ayrıca bkz. 1.5 — görseller 402)
- **SEO canonical/sitemap:** `robots.txt` ve `sitemap.xml` varlığı kontrol edilmedi — production SEO için gerekli.
- **Structured data (JSON-LD):** Ürün/marka sayfalarında `Product`/`Organization` schema eksik görünüyor.
- **OpenGraph/Twitter Card:** Sosyal paylaşım etiketleri test edilmedi.
- **Ölü ürün linkleri:** `/katalog/dahua-hac-hfw-1200t-s3-...` slug'ı → "Ürün Bulunamadı" (HTTP 200 ama içerik yok). Katalogda eski/geçersiz slug'lar olabilir; 410/redirect gerekir.
- **Ürün detayda eylem butonu yok:** Misafir kullanıcıda "Sepete Ekle" / "Teklif İste" butonu görünmüyor (fiyat "Özel Fiyatlar İçin Bayi Girişi"). Satın alma hunisi kırık.

---

## 4. Pozitifler (İyi Çalışanlar)

- ✅ Ana sayfa, markalar, kategori, iletişim: **HTTP 200**, **konsol hatası yok**, **pageerror yok**.
- ✅ Mobil (390px) horizontal overflow = **0px** (layout sızıntısı yok).
- ✅ Ana sayfa meta description kaliteli ve anahtar kelime odaklı.
- ✅ `/markalar` zengin içerik: 296 link, 119 görsel (sadece 1 kırık).
- ✅ `/kategori` 23 kategori RSC isteği yapıyor (dinamik içerik akışı çalışıyor).
- ✅ Performansın temeli iyi: TTFB ~220-380ms, FCP 700ms-1.6s (ANA/KATALOG/MARKA), CLS ~0 (görsel 402'ler düzelince LCP de sağlıklı gelecek).
- ✅ Auth API sağlam: `/api/auth/session` 200, login formu (`/bayi-giris`) düzgün render, alanlar `required` ve placeholder'lı.

---

## 5. Performans Ölçümleri (Playwright)

| Sayfa | TTFB | DCL | FCP | LCP* | CLS | Resources |
|---|---|---|---|---|---|---|
| `/` | 219ms | 643ms | 716ms | 0** | 0.000 | 64 |
| `/katalog` | 248ms | 697ms | 920ms | 0** | 0.012 | 100 |
| `/markalar` | 220ms | 1398ms | 1648ms | 0** | 0.000 | 196 |
| `/kategori` | 378ms | 1335ms | 1508ms | 0** | 0.000 | 106 |

`*` LCP 0 = ürün görselleri 402 ile kırıldığı için largest-contentful-paint event'i tetiklenmiyor (bkz. 1.5). Görsel sorunu çözülünce tekrar ölçülmeli.
`**` Marka sayfasında 366 script / 2130 DOM node — ağır; mobilde ilk etkileşim gecikebilir.

---

## 6. Öncelikli Aksiyon Listesi

| # | Sorun | Öncelik | Tahmini Effort |
|---|---|---|---|
| 1 | 🔴 Ürün görselleri 402 (b2bdepo.com) — satışı doğrudan vurur | 🔴 Kritik | M |
| 2 | 🔴 Sistematik auth wall (6 nav linki login'e atıyor) | 🔴 Kritik | L |
| 3 | `/urunler` API 401 (public katalog boş) | 🔴 Kritik | M |
| 4 | `/markalar` kırık logo (404) | 🟠 Yüksek | S |
| 5 | `markalar?_rsc` ERR_ABORTED tekrarı | 🟠 Yüksek | M |
| 6 | Ölü ürün slug'ları ("Ürün Bulunamadı") | 🟠 Yüksek | M |
| 7 | Ürün detayda eylem butonu (misafir) eksik | 🟠 Yüksek | M |
| 8 | Çift ürün rotası (/katalog + /urunler) | 🟡 Orta | S |
| 9 | 404 sayfası eksik | 🟡 Orta | S |
| 10 | Title/meta tutarsızlıkları | 🟡 Orta | M |
| 11 | Ana sayfa internal linking zayıf | 🟢 Düşük | M |
| 12 | Mobil hamburger erişilebilirlik | 🟢 Düşük | S |
| 13 | Marka sayfası ağır (366 script) — lazy/bölme | 🟢 Düşük | M |

*(S = <2saat, M = 0.5-1 gün, L = >1 gün)*

---
*Rapora ekleme yapacak diğer agentlar: kendi başlıklarıyla (örn. `## [agent-adı]`) yeni bölüm ekleyebilir. Çakışan bulgularda bu hy3 raporu referans alınır.*
