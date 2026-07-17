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

### 1.4 `/hakkimizda` ve `/bayiler` auth wall'a düşüyor
Bu iki route, giriş yapmamış kullanıcıda **login ekranına yönleniyor** (body içeriği Next.js theme script + login formu, "Giriş" H1'ı).
- Title: `Giriş | Next AI Teknologi`.
- **Sorun:** Footer/nav'da "Hakkımızda" / "Bayiler" gibi public görünen linkler aslında auth gerektiriyor. Kullanıcı tıklayınca login'e düşüyor — kötü UX.
- **Öneri:** Bu içerikler gerçekten gizli mi? Değilse public sayfa oluştur. Gizliyse nav/footer'da linki gösterme veya "Giriş gerekli" rozeti ekle.

---

## 2. Uyumsuzlıklar (Inconsistencies)

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
- **Lazy/placeholder görseller:** `/kategori` 15 görsel içeriyor, hepsi yüklü; LCP için `priority`/`loading="lazy"` ve `width/height` optimizasyonu doğrulanmalı.
- **SEO canonical/sitemap:** `robots.txt` ve `sitemap.xml` varlığı kontrol edilmedi — production SEO için gerekli.
- **Structured data (JSON-LD):** Ürün/marka sayfalarında `Product`/`Organization` schema eksik görünüyor.
- **OpenGraph/Twitter Card:** Sosyal paylaşım etiketleri test edilmedi.

---

## 4. Pozitifler (İyi Çalışanlar)

- ✅ Ana sayfa, markalar, kategori, iletişim: **HTTP 200**, **konsol hatası yok**, **pageerror yok**.
- ✅ Mobil (390px) horizontal overflow = **0px** (layout sızıntısı yok).
- ✅ Ana sayfa meta description kaliteli ve anahtar kelime odaklı.
- ✅ `/markalar` zengin içerik: 296 link, 119 görsel (sadece 1 kırık).
- ✅ `/kategori` 23 kategori RSC isteği yapıyor (dinamik içerik akışı çalışıyor).

---

## 5. Öncelikli Aksiyon Listesi

| # | Sorun | Öncelik | Tahmini Effort |
|---|---|---|---|
| 1 | `/urunler` API 401 (public katalog boş) | 🔴 Kritik | M |
| 2 | `/hakkimizda`, `/bayiler` auth wall'a düşüyor | 🔴 Kritik | M |
| 3 | `/markalar` kırık logo (404) | 🟠 Yüksek | S |
| 4 | `markalar?_rsc` ERR_ABORTED tekrarı | 🟠 Yüksek | M |
| 5 | Çift ürün rotası (/katalog + /urunler) | 🟡 Orta | S |
| 6 | 404 sayfası eksik | 🟡 Orta | S |
| 7 | Title/meta tutarsızlıkları | 🟡 Orta | M |
| 8 | Ana sayfa internal linking zayıf | 🟢 Düşük | M |
| 9 | Mobil hamburger erişilebilirlik | 🟢 Düşük | S |

*(S = <2saat, M = 0.5-1 gün, L = >1 gün)*

---
*Rapora ekleme yapacak diğer agentlar: kendi başlıklarıyla (örn. `## [agent-adı]`) yeni bölüm ekleyebilir. Çakışan bulgularda bu hy3 raporu referans alınır.*
