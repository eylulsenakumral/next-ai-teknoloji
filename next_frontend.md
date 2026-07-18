# Front-End İnceleme Raporu — nexadepo.com

---

## 🔵 QWEN — Kıdemli Front-End Mühendisi İncelemesi
**Tarih:** 2026-07-18 | **Rol:** Kıdemli Front-End Mühendisi | **Kapsam:** Ana sayfa, SEO, CSS mimarisi, erişilebilirlik, performans, uyumsuzluklar

---

### 1. 🚨 KRİTİK HATALAR

| # | Dosya | Sorun | Öneri |
|---|-------|-------|-------|
| 1 | `src/app/sitemap.ts:6` | `BASE_URL` yanlış domain: `next-ai-teknoloji.com` — canlı site `nexadepo.com` olmalı | `process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexadepo.com"` olarak değiştir |
| 2 | `src/app/layout.tsx:48-49` | `suppressHydrationWarning` hem `html` hem `body`'de tanımlı. Gereksiz; sadece `html` yeterli | body'den kaldır |
| 3 | `src/app/not-found.tsx:47` | `new Date().getFullYear()` SSR/CSR mismatch — sunucuda ve istemcide farklı yıl render edilebilir | Sabit yıl yaz veya `useEffect` içinde hesapla |
| 4 | `src/app/sitemap.ts` | Canlıda `/sitemap.xml` erişilemiyor (404 veya boş yanıt); `robots.txt` da yok | Deploy'da route'ların çalıştığını doğrula; `public/robots.txt` ekle |

### 2. 🔶 SEO EKSİKLİKLERİ

| # | Sorun | Dosya/Etiket | Çözüm |
|---|-------|-------------|-------|
| 1 | `og:image` eksik | `<head>` meta | 1200×630 OG image tasarla ve `<meta property="og:image" />` ekle — sosyal paylaşımda önizleme çıkmıyor |
| 2 | `robots` meta tag'i yok | `<head>` | `<meta name="robots" content="index, follow" />` ekle |
| 3 | JSON-LD structured data yok | Sayfa kaynak | `Organization`, `LocalBusiness`, `Product` şemalarını ekle (Google zengin sonuçlar için kritik) |
| 4 | Sitemap'te eksik sayfalar | `sitemap.ts` | `/markalar`, `/cozumler`, `/proje-tasarim`, `/teklif-iste`, `/bayimiz-olun`, `/bayi-programi`, `/kampanya` gibi public sayfalar sitemap'e kayıtlanmamış |
| 5 | Canonical URL uyumsuzluğu | sitemap.ts | BASE_URL yanlış olduğu için sitemap XML'inde tüm URL'ler yanlış domain'e işaret ediyor |
| 6 | `title` çok uzun | Ana sayfa `<title>` | "Next AI Teknoloji — Güvenlik & Network Sistemleri Bayi Platformu | Next AI Teknoloji" = 78 karakter. Google ~60 karakterde keser. "Next AI Teknoloji | 27+ Marka Güvenlik & Network Tedarikçisi" önerisi |

### 3. 🎨 CSS MİMARİSİ & UYUMSUZLUKLAR

| # | Dosya | Sorun | Öneri |
|---|-------|-------|-------|
| 1 | `globals.css` (630 satır) | 3 ayrı tasarım sistemi iç içe: 1) `--color-nx-*` (public), 2) shadcn/ui vars, 3) `--DT*` (dt-elektrix). Çakışma ve bakım yükü çok yüksek | Tek semantic token katmanı oluştur; eski DT* değişkenlerini phased deprecate et |
| 2 | `globals.css` satırları arası | `#0040a4` rengi 30+ kez hardcoded tekrarlanmış | `var(--color-primary)` kullan, tekrarları kaldır |
| 3 | `globals.css:121-124` | `--brand-primary` ve `--brand-accent` aynı renk (`#0040a4`) — accent'in anlamı yok | Accent'i farklı renge (`#ff9b43` gibi nx-accent var) ata veya kullanmaktan vazgeç |
| 4 | `globals.css:406-413` | `h1-h6` base layer'da **px font-size** tanımlı (60px, 48px, 36px...). Mobilde taşma yapar | `rem` veya Tailwind responsive sınıflara (`text-4xl md:text-6xl`) çevir |
| 5 | `globals.css:295` | `--primary-rgb: 33, 137, 255` ama `--primary: #0040a4` (= `0, 64, 164`). **RGB değerleri renk eşleşmiyor** | `0, 64, 164` olarak düzelt veya değişkeni kaldır |
| 6 | `globals.css:212-213` | `--DT_Success_Color: var(--color-success)` ve `--DT_discount_color: var(--color-price)` — circular reference riski | Değerleri doğrudan tanımla |
| 7 | Dark mode | Dark mode tokenları tanımlı ama görünürde public'ta toggle yok | Ya dark mode trigger'ı ekle ya da dead code olarak temizle |
| 8 | Public vs Admin renk çakışması | `--color-primary` hem semantic token olarak `#0040a4`, hem public hero'da `--color-nx-dark: #0040a4` | İsimleri net ayır: `--nx-primary` vs `--admin-primary` |

### 4. ♿ ERİŞİLEBİLİRLİK (a11y)

| # | Sorun | Etki | Çözüm |
|---|-------|------|-------|
| 1 | ARIA attribute'ları minimum düzeyde | Screen reader kullanıcıları için yetersiz | Tüm interaktif elementlere `aria-label`, `aria-describedby` ekle |
| 2 | Skip-to-content link'i var ama sadece tek link | Yetersiz | Form alanları, dropdown'lar, modal'lar için de focus management ekle |
| 3 | Marka logoları inline SVG — `aria-label` yok | Screen reader "image" olarak okumaz veya boş okur | Her logo SVG'sine `<title>` ve `aria-label="Dahua logo"` ekle |
| 4 | Kamera güvenlik görselleri (hero kartları) | `role="img"` ve `aria-label` eksik | Decorative ise `aria-hidden="true"`, aksi halde label ekle |
| 5 | Navigation menüsü | Keyboard navigasyon ve focus-visible stili yetersiz | `:focus-visible` stili tanımla, menü öğelerine tabIndex ve role ekle |
| 6 | Form elementleri | Teklif/Proje formlarında label-input association kontrolü gerekli | `<label htmlFor>` ve `aria-required` doğrula |

### 5. ⚡ PERFORMANS

| # | Sorun | Etki | Öneri |
|---|-------|------|-------|
| 1 | 3 Google font ailesi yükleniyor: Poppins (7 weight), Manrope (5 weight), DM Mono (2 weight) | ~14 font weight = ciddi FCP etkisi | Poppins weight'larını 400/500/700/800'e düşür; Manrope'u body için varsayılan yap, Poppins'i sadece admin'de kullan |
| 2 | `font-display: swap` kullanılmış ✓ | İyi | Flash of Invisible Text (FOIT) önlenmiş |
| 3 | Inline SVG logolar | Tekrar kullanılabilirlik düşük | `<defs>` + `<use>` pattern'ına geç veya sprite sheet kullan |
| 4 | Hero bölümünde CSS animasyonlar (float, pulse, shimmer...) | 6 farklı keyframe animasyonu sürekli çalışıyor | `prefers-reduced-motion` media query ekle; CPU kullanımı yüksek |
| 5 | next.config'te `images.optimization` ayarları kontrol edilmeli | Image optimization kritik | `next/image` kullanımını doğrula, `AVIF/WebP` format desteği konfigüre et |
| 6 | Bundle boyutu riski | 3 font + lucide-react + shadcn/ui | `lucide-react` tree-shaking doğrula; kullanılmayan icon'ları temizle |

### 6. 🏗️ YAPI & MİMARİ ÖNERİLERİ

| # | Öneri | Gerekçe |
|---|-------|---------|
| 1 | `(public)` route grubunda `layout.tsx` var ama header/footer yapısı kontrol edilmeli | Tutarlı navigasyon ve footer tüm public sayfalarda olmalı |
| 2 | `static-pages.test.tsx` dosyası (public) içine konmuş | Test dosyaları `__tests__/` veya `src/__tests__/` dizinine taşınmalı |
| 3 | `loading.tsx` global loading güzel ✓ | Route segment'lerde de local loading.tsx olmalı (katalog, kategoriler gibi veri-heavy sayfalar) |
| 4 | `global-error.tsx` mevcut ✓ | Error boundary yapısı iyi |
| 5 | Sitemap'te `deletedAt: null, isActive: true` filtresi ✓ | Soft-delete ve deaktif ürünler sitemap'e girmiyor, iyi |
| 6 | `robots.txt` dosyası `public/` dizininde yok | `src/app/robots.ts` (Next.js 14+ route handler) oluştur |

### 7. 📱 MOBİL UYUMLULUK

| # | Sorun | Öneri |
|---|-------|-------|
| 1 | `h1-h6` px bazlı font-size mobilde taşma yapar | Tailwind responsive veya `clamp()` kullan |
| 2 | Breakpoint'ler Tailwind varsayılan değil: xs:576, sm:768, md:992, lg:1200, xl:1541 | Bootstrap breakpoint'leri; Tailwind ekibinin önerdiği sm:640, md:768, lg:1024, xl:1280'den farklı — tutarsızlık riski |
| 3 | `min-h-screen` (not-found) mobilde adres çubuğu sorunu | `min-h-[100dvh]` kullan |

### 8. 📝 ÖNCELİK SIRALI AKSİYON PLANI

| Öncelik | İş | Tahmini Süre |
|---------|-----|--------------|
| **P0** | sitemap BASE_URL düzelt (`nexadepo.com`) | 1 dk |
| **P0** | `robots.txt` + sitemap erişim doğrulaması | 15 dk |
| **P1** | `--primary-rgb` renk mismatch düzelt | 5 dk |
| **P1** | `og:image` ekle | 30 dk (tasarım + kod) |
| **P1** | JSON-LD structured data ekle | 1 saat |
| **P2** | globals.css refactor — hardcoded renkleri CSS variable'a çevir | 2-3 saat |
| **P2** | h1-h6 responsive font-size geçişi | 1 saat |
| **P2** | Font weight azaltma (Poppins 7→4) | 30 dk |
| **P3** | ARIA labels ve a11y audit | 3-4 saat |
| **P3** | Brand accent renk düzelt (veya kullanımdan kaldır) | 15 dk |
| **P3** | Dark mode dead code temizliği (ya implement ya kaldır) | 1 saat |

---

## 🔴 Kimi — Canlı Site Ölçüm & Tarayıcı Testi

**Tarih:** 2026-07-18 | **Rol:** Kıdemli Front-End Mühendisi | **Yöntem:** Playwright (Chromium) ile gerçek tarayıcı testi, HTTP bağlantı/link doğrulaması, statik HTML analizi.

### 1. 🚨 Canlı Ortamda Tespit Edilen Kritik Hatalar

| # | Sorun | Etki | Kanıt |
|---|-------|------|-------|
| 1.1 | **Sitemap ve `robots.txt` yanlış domain gösteriyor** | Google `nexadepo.com` yerine `next-ai-teknoloji.com` domainini indekslemeye çalışır. | `Sitemap: https://next-ai-teknoloji.com/sitemap.xml`; tüm `\<loc\>` etiketleri `https://next-ai-teknoloji.com/...` |
| 1.2 | **Public menü linkleri login duvarına çarpıyor** | Kullanıcı deneyimi ve SEO "soft 404" üretiyor. | `/cozumler`, `/proje-tasarim`, `/teklif-iste`, `/bayi-programi`, `/kampanya`, `/kurumsal`, `/hakkinda` → `307` → `/login?callbackUrl=...` |
| 1.3 | **`/manifest.json` login gerektiriyor** | PWA kurulumu / icon/uygulama manifesti çalışmaz. | `manifest.json` → `307` → `/login` |
| 1.4 | **SSR HTML'sinde `\<h1\>` eksik** | Tarayıcıda hydration sonrası h1 görünse de, Google crawler ve ekran okuyucular ilk yükte h1 göremeyebilir. | Ana sayfa, `/markalar`, `/katalog` statik HTML'inde h1 yok; Playwright ile h1 sayısı 1. |
| 1.5 | **`/katalog` SSR HTML içeriği boş** | Ürünler client-side JS ile yükleniyor; Google ürünleri göremeyebilir. | HTML'de ürün kartı, resim, ürün adı yok; JS ile 36 img oluşuyor. |
| 1.6 | **Katalog, ürün detay ve kategori resimleri `402` hatası dönüyor** | Ürün görselleri yüklenmiyor. | `https://nexadepo.com/_next/image?url=https%3A%2F%2Fwww.b2bdepo.com%2Fimages%2F...` → `HTTP 402` (örnek: `/kategoriler/dizustu-bilgisayarlar` 14 adet) |
| 1.7 | **Markalar sayfasında 404 logo** | Bir marka logosu boş kutu olarak görünüyor. | `https://nexadepo.com/storage/brands/2cf5cd59-59f0-4ad2-a168-63fb6d4c0e37.jpg` → `404` |
| 1.8 | **`/bayi-giris` 308 ile `/login`e yönlendiriyor** | Gereksiz yönlendirme zinciri. | `308` → `https://nexadepo.com/login` |
| 1.9 | **Olmayan route'lar bile `/login`e yönlendiriliyor** | Gerçek 404 mekanizması yok; SEO açısından yıkıcı. | `/nonexistent-page` → `/login?callbackUrl=...` (status 200, title "Giriş") |
| 1.10 | **`/iletisim` ana sayfaya yönlendiriliyor** | Sitemap'de iletişim sayfası var ama içerik yok; kullanıcı ulaşamaz. | `/iletisim` → `https://nexadepo.com/` |
| 1.11 | **Ürün detay URL'leri `/urun/...` yerine `/katalog/...`e yönlendiriliyor** | Sitemap'de `/urun/...` URL'leri kayıtlı ama canlıda `/katalog/...` açılıyor. | `/urun/...` → `200` (final URL `/katalog/...`) — 308 yönlendirme olabilir |
| 1.12 | **Service worker dosyası yok** | PWA offline/cache özelliği çalışmaz. | `/sw.js` → `404` |
| 1.13 | **`/api/products` public değil** | Anonim kullanıcı ürün listesi API'sine erişemiyor; katalog boş kalabilir. | `/api/products` → `401` |

### 2. ⚡ Performans Ölçümleri (Playwright, networkidle)

| Sayfa | TTFB | FCP | DCL | Load | Yükleme Süresi | Not |
|-------|------|-----|-----|-----|----------------|-----|
| `/` | 276 ms | 1.408 ms | 1.129 ms | 1.372 ms | ~3.9 s | 21 font preload, 54 script etiketi |
| `/markalar` | 62 ms | 2.524 ms | 2.408 ms | 2.763 ms | ~4.7 s | 119 eşzamanlı resim isteği, lazy-loading yok |
| `/katalog` | 62 ms | 376 ms | 155 ms | 247 ms | ~6.7 s | 36 img; resimler `402`; ağır JS fetch |
| `/kategoriler` | 62 ms | — | — | — | ~5.5 s | 15 img, lazy-loading yok |
| `/kategoriler/dizustu-bilgisayarlar` | 62 ms | — | — | — | ~5.0 s | 40 img, 14 adet `402` hatalı resim |
| `/urun/...` (örnek) | 62 ms | — | — | — | ~2.4–4.0 s | 1–5 img, çoğu `402`; `/urun` → `/katalog` yönlendirme |
| `/cozumler` | 143 ms | 404 ms | 205 ms | 279 ms | ~2.0 s | Sonuç: `/login` sayfası |
| `/proje-tasarim` | 145 ms | 368 ms | 225 ms | 294 ms | ~1.5 s | Sonuç: `/login` sayfası |
| `/basvuru` | 62 ms | 404 ms | 328 ms | 436 ms | ~1.9 s | 200 OK, çalışıyor |

- **LCP** ölçümü tarayıcıda `null` kaldı; 3 sn içinde LCP elementi belirginleşmedi. Bu, ana görsel/karşılama metninin geciktiğini veya metrik kaydının hydration sonrası eksik kaldığını gösterir.
- **CLS = 0** tüm sayfalarda iyi.
- **Katalog ve kategori sayfaları** 5–7 sn arasında yükleniyor; ağır client-side data fetch ve hatalı resimlerden kaynaklanıyor.

### 3. 🖼️ Resim Analizi

#### `/markalar`
- Toplam: **119 adet `\<img\>`**
- `alt` eksik: **0** (her resimde marka adı alt olarak var — iyi)
- `width/height` eksik: **0** (CLS riski düşük — iyi)
- `loading="lazy"` eksik: **119** (hepsi `auto`/`eager` — kötü, LCP/FCP'yi yavaşlatır)
- Resimler kendi domain üzerinde: `https://nexadepo.com/brand-logos/*.png`

#### `/kategoriler` (ana liste)
- Toplam: **15 adet `\<img\>`**
- `loading="lazy"` eksik: **15** (tümü eager)

#### `/kategoriler/dizustu-bilgisayarlar`
- Toplam: **40 adet `\<img\>`**
- `loading="lazy"` mevcut: **40** (iyi)
- `402` hatalı resim: **14 adet** (b2bdepo.com kaynaklı)

#### Ürün Detay (`/urun/...` → `/katalog/...`)
- Resim sayısı: 1–5 arası
- Çoğunda `lazy-loading` mevcut
- Çoğu ürün görselleri `402` hatası dönüyor (b2bdepo.com kaynaklı)

#### Genel Resim Sorunları
- `https://www.b2bdepo.com/images/UrunResimleri/...` kaynaklı görseller, Next.js image optimization üzerinden `402` dönüyor. Muhtemelen `next.config.js` içinde `images.domains` / `remotePatterns` eksik veya b2bdepo hotlink koruması aktif.
- `https://nexadepo.com/storage/brands/2cf5cd59-59f0-4ad2-a168-63fb6d4c0e37.jpg` 404.

### 4. 🔒 Güvenlik / HTTP Header'ları

**Mevcut:**
- `Strict-Transport-Security: max-age=63072000`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Eksik:**
- `Content-Security-Policy`
- `Permissions-Policy`

**Cache:**
- HTML: `Cache-Control: public, max-age=0, must-revalidate` (public sayfalar için stale-while-revalidate önerilir)
- Static assets: `public,max-age=31536000,immutable` (iyi)
- `Vary` header çok uzun: `rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch` (CDN hit oranını düşürür)

### 5. 🎯 SEO Durumu

- **Title:** "Next AI Teknoloji — Güvenlik & Network Sistemleri Bayi Platformu | Next AI Teknoloji" — ~78 karakter, son kısım tekrar, kısaltılmalı.
- **Meta description:** ana sayfada uygun uzunlukta; ürün detay sayfalarında ürüne özel description var (iyi).
- **OG/Twitter:** `og:image` ve `twitter:image` eksik.
- **Canonical:** doğru (`https://nexadepo.com`) ama sitemap domain tutarsızlığı nedeniyle etkisiz.
- **JSON-LD:** yok (Qwen bölümünde de belirtilmiş).
- **Sitemap / robots.txt:** `next-ai-teknoloji.com` domainine işaret ediyor — kritik hata.
- **Thin content:** `/kategoriler/dikili-tip-kabinetler` ve `/kategoriler/duvar-tipi-kabinetler` gibi sayfalarda "0+ ürün" metası var, içerik boş.
- **Yönlendirme zincirleri:** `/urun/...` → `/katalog/...` ve `/iletisim` → `/` gibi yönlendirmeler SEO kredisi dağıtır.
- **Soft 404:** `/kurumsal`, `/hakkinda`, `/kampanya`, `/nonexistent-page` gibi sayfalar `/login`e yönlendiriliyor; gerçek 404 yok.
- **Manifest:** `/manifest.json` login duvarına takılıyor — PWA sinyali zayıf.

### 6. 📱 Mobil Görsel Test

- Mobil ekran görüntüsü alındı: `/tmp/opencode/nexadepo-audit/screenshots/home-mobile.png`
- Kullanılan model görsel girdi desteklemediği için screenshot üzerinde yorum yapılamıyor; dosya diskte saklı.
- Viewport meta tagı mevcut (`width=device-width, initial-scale=1`).

### 7. 🔧 Önerilen Öncelikli Aksiyonlar

1. **Sitemap ve robots.txt domain'ini** `nexadepo.com` yap (P0).
2. **Public route auth kurallarını** gözden geçir: `/cozumler`, `/proje-tasarim`, `/teklif-iste`, `/bayi-programi`, `/kampanya`, `/kurumsal`, `/hakkinda`, `/manifest.json` public olmalı veya menüden kaldırılmalı (P0).
3. **Gerçek 404 mekanizması** oluştur; olmayan route'ları `/login` yerine `404` sayfasına gönder (P0).
4. **Her sayfada SSR HTML'sinde tek `\<h1\>`** olacak şekilde düzelt (P0).
5. **Katalog ürünlerini SSR/HTML'e taşı** veya `next/image` harici domain yapılandırmasını düzelt (P0).
6. **`www.b2bdepo.com` görselleri için `next.config.js` `images.remotePatterns`** tanımla veya görselleri kendi CDN'e çek (P0).
7. **Markalar ve kategori listesi resimlerine `loading="lazy"`** ekle (P1).
8. **404 logo dosyasını** (`storage/brands/...`) düzelt veya DB'den sil (P1).
9. **Font preload sayısını** 21'den 2-4'e indir (P1).
10. **CSP header** ekle (P1).
11. **Boş kategorileri** (0 ürün) noindex yap veya içerik doldur (P2).
12. **HTML cache** için `stale-while-revalidate` kullan (P2).
13. **Vary header'ını** kısalt (P2).
14. **PWA için service worker** ve düzgün manifest sağla (P2).

### 8. Ekran Görüntüleri

- `/tmp/opencode/nexadepo-audit/screenshots/home-desktop.png`
- `/tmp/opencode/nexadepo-audit/screenshots/home-mobile.png`
- `/tmp/opencode/nexadepo-audit/screenshots/markalar-desktop.png`
- `/tmp/opencode/nexadepo-audit/screenshots/katalog-desktop.png`
- `/tmp/opencode/nexadepo-audit/screenshots/cozumler-desktop.png`
- `/tmp/opencode/nexadepo-audit/screenshots/proje-tasarim-desktop.png`
- `/tmp/opencode/nexadepo-audit/screenshots/basvuru-desktop.png`
- `/tmp/opencode/nexadepo-audit/screenshots/login-desktop.png`

### 9. Derin Route Test Özeti

22 farklı route (ana sayfa, statik sayfalar, ürün detay, kategoriler, API, 404) Playwright ile test edildi.

| Durum | Sayı | Örnekler |
|-------|------|----------|
| `200 OK` | 20 | `/`, `/katalog`, `/kategoriler`, `/urun/...`, `/kategoriler/...`, `/api/auth/session`, `/api/categories`, `/basvuru` |
| `401 Unauthorized` | 1 | `/api/products` |
| `404 Not Found` | 1 | `/sw.js` |

**Önemli gözlemler:**
- `/iletisim` 200 dönse de final URL ana sayfaya yönlendiriyor.
- `/kurumsal`, `/hakkinda`, `/kampanya` ve `/nonexistent-page` 200 dönse de final URL `/login`.
- `/urun/...` URL'leri `/katalog/...`e yönlendiriyor.
- `/kategoriler/dikili-tip-kabinetler` ve `/duvar-tipi-kabinetler` "0+ ürün" içerikle açılıyor (thin content).
- Ürün detay ve kategori sayfalarında `www.b2bdepo.com` kaynaklı görseller `402` dönüyor.

---

*Bu bölüm Kimi K2.7-code modeli tarafından 2026-07-18'de canlı site ölçümü ile üretilmiştir.*

---

## 🟢 glm (GLM-5.2)

**Tarih:** 2026-07-18
**Kapsam:** Canlı (`nexadepo.com`) + kod tabanı (`~/projects/next-ai-teknoloji`, Next.js 16.2 + React 19 + Tailwind v4).
**Yöntem:** Kod tabanı incelemesi (Vercel antibot checkpoint'u canlı tarayıcı/screenshot erişimini engelledi). **Kod-bazlı bulgular kesin.** Login redirect ve resim hataları Kimi'nin canlı ölçümüyle doğrulandı.

### 🔴 Yönetici Özeti — Önce Bunlar

1. **Logo "AI" harfleri görünmez** — ana sayfa header + footer'da renk çakışması
2. **Tüm SEO domain'i yanlış** — sitemap/robots/JSON-LD `next-ai-teknoloji.com` diyor, site `nexadepo.com`
3. **`og:image` yok** — sosyal/link paylaşımında boş önizleme
4. **`/bayi-programi` ve `/cozumler` canlıda login'e düşüyor** — Kimi doğruladı ✓ (source'da `middleware.ts` yok → deploy tutarsızlığı)
5. **`.env.production` trailing `\n`** — tüm NEXT_PUBLIC değerleri newline sızdırıyor

---

### 🔴 KRİTİK Hatalar

#### 1. Logo "AI" segmenti görünmez (renk çakışması)
`src/components/layout/public-header-next.tsx:41` ve `src/components/layout/public-footer-next.tsx`:
```tsx
NEXT<span className="text-[var(--color-primary)]">AI</span>
```
- `--color-primary: #0040a4`. Header ana sayfada `bg-[var(--color-primary)]/90`, footer `bg-[var(--color-primary)]`. **"AI" harfleri aynı renk arka plan** → kaynaşır, okunamaz.
- Light sayfalarda sorun yok; ana sayfa header + footer (en çok görünen iki yer) bozuk.
- **Fix:** Footer/home-variant'ta "AI" → `text-white/80` veya accent (`#a8c4d4`); ya da `public/logobeyaz.png`/`logo.png` kullan.

#### 2. SEO domain tutarsızlığı — `next-ai-teknoloji.com` × `nexadepo.com`
`NEXT_PUBLIC_SITE_URL` env değişkeni **tanımsız** (`.env` ve `.env.production`'da yok). Üç yer fallback'e düşüyor:
- `src/app/sitemap.ts:6` → `BASE_URL ?? "https://next-ai-teknoloji.com"`
- `src/app/(public)/page.tsx:36` → Organization JSON-LD aynı fallback
- `public/robots.txt` → `Sitemap: https://next-ai-teknoloji.com/sitemap.xml` (hardcoded)

Buna karşın `src/app/layout.tsx:29` `metadataBase: nexadepo.com`. Google **nexadepo.com yerine next-ai-teknoloji.com URL'leri** görür → canonical çakışması, indexleme kirliliği.
- **Fix:** Production env'ine `NEXT_PUBLIC_SITE_URL=https://nexadepo.com` ekle (veya kodu `NEXT_PUBLIC_APP_URL`'e bağla). `robots.txt` hardcoded → düzelt.

#### 3. `.env.production` trailing `\n` bug'ı
```
NEXT_PUBLIC_APP_URL="https://nexadepo.com\n"
```
Literal `\n` değerin sonunda → `process.env` newline'lı URL üretir (canonical/og:url/sitemap). Tüm satırlarda aynı patern.
- **Fix:** tırnak içindeki `\n`'leri kaldır.

#### 4. `og:image` / `twitter:image` yok
`src/app/(public)/layout.tsx` openGraph'ta images yok, `public/` altında og görseli yok. WhatsApp/LinkedIn/Slack paylaşımlarında **boş kart**. `twitter:card: "summary"` (large_image olmalı).
- **Fix:** 1200×630 `public/og.png` üret + `openGraph.images` + `twitter:card: "summary_large_image"`.

#### 5. `/bayi-programi` + `/cozumler` canlıda auth'ya düşüyor ✓ (Kimi doğruladı)
Kodda `(public)/bayi-programi/page.tsx` ve `(public)/cozumler/page.tsx` **tam public landing page** (faydalar, kademeler, süreç). `next.config.ts:33` redirect listesinde değiller. **Ama source'da `middleware.ts` yok** — sadece `.next/server/middleware.js` build artifact'i var. Kimi canlıda 7 public path'in `307 → /login?callbackUrl=` gittiğini ölçtü.
- Olası: (a) production deploy repo gerisinde, (b) middleware silinmiş ama deploy'da hâlâ aktif, (c) bir server-component auth gate'i.
- **Aksiyon:** `git log --all -- '*middleware*'` ile kaynağı bul, public path'leri `matcher` dışında bırak.

---

### 🟠 SEO & Meta

| Bulgu | Durum |
|---|---|
| `metadataBase` tanımlı (nexadepo.com) | ✓ ama #2 ile çelişiyor |
| Sayfa başına `alternates.canonical` | ✓ |
| Organization JSON-LD | ✓ ama logo URL domain'i yanlış |
| `keywords` meta | ✓ (düşük SEO değeri, zararsız) |
| `<html lang="tr">` | ✓ |
| `twitter:card` | `summary` → `summary_large_image` (#4) |
| `sitemap.xml` `force-dynamic` + Prisma | ⚠️ Her crawl DB sorgusu, cache yok. `revalidate` ile saatlik cache |
| `public/logobeyaz,.png` (virgüllü dosya) | 🟡 Çöp dosya, silinmeli |

---

### 🟠 UX / İçerik Tutarsızlıkları

1. **Ürün sayısı çelişkisi:** Hero `"1.800+ Aktif teknik ürün"` (`hero-next.tsx:11`) vs Katalog `"5.000+ Ürün"` (canlı). Tek kaynak kullan (DB'den dinamik).
2. **Sektörel iddialar riskli:** "12 yıl Sektör deneyimi", "340+ Aktif bayi", "₺2.4M+ Aylık hacim", "4.8/5 memnuniyet". Next AI pre-seed aşamasında. Rakamlar gerçek değilse **reklam mevzuatı/TTK** açısından risk. Doğrula veya "hedef" olarak çerçevele.
3. **Bayi kademeleri net fiyat göstermiyor** — "5–10%"/"20%+" indirim var ama "Başvur" öncesi çapa yok.
4. **Aksan rengi tek kullanım:** `#ff9b43` turuncu sadece "Teklif İste" butonunda. Başarı/aktif statelerde de kullan — şu an donuk.

---

### 🟠 Erişilebilirlik (a11y)

1. **Düşük kontrastlar** (`#0040a4` arka plan üzerinde):
   - `text-slate-600` (#475569) — Hero "Tedarik ortaklarımız" etiketi (`hero-next.tsx:206`), footer "©" satırı, marka isimleri → ~3.3:1, AA small text için **yetersiz** (4.5:1 gerekir).
   - `text-slate-500` stat etiketleri → marginal.
   - **Fix:** slate-600 → slate-300/400 (koyu zeminde).
2. **Skip-link** `#main-content` ✓ + `<main id="main-content">` ✓.
3. **Mobil hamburger** `aria-label="Menü"` ✓ ama `aria-expanded` yok (`public-header-next.tsx:96`). Ekle.
4. **SVG marka logoları** (`brand-logos.tsx`) `aria-label`/`role="img"` kontrolü gerek (decorative ise `aria-hidden`).
5. Form alanları: `react-hook-form` + `zod` var — label association doğrula (teklif/başvuru formları).

---

### 🟡 Performans

1. **3 Google Font, 14 ağırlık:** Poppins (7) + Manrope (5) + DM Mono (2) — self-host iyi. Ama **Poppins 7 ağırlık** fazla → 400/600/700'e indir, ~40KB tasarruf.
2. **Font split eksik:** `src/app/layout.tsx` root'ta Poppins+Manrope+DM Mono preload. Public `font-nx-sans: Manrope`. Public ziyaretçi Poppins'i (dealer font) **boşuna indirir**. Public layout'a Manrope+DM Mono, dealer/admin layout'a Poppins.
3. **WhatsAppButton + ChatWidget** her public sayfada — `dynamic(() => ..., { ssr: false })` ile lazy-load şart.
4. **Hero dashboard mockup** SVG/CSS — asset yüklemiyor (iyi). Ama `backdrop-blur-xl`/`blur-3xl` birkaç yerde — düşük-end mobilde paint maliyeti.
5. **`suppressHydrationWarning`** `<html>`+`<body>` (`layout.tsx:47,49`) → `next-themes` için. Public'te dark mode görünmüyor; gereksizse kaldır (body'den).

---

### 🟡 Responsive

- Header desktop nav break point `lg` (1024px). 5 menü + 3 buton için tablet (768–1023px) hamburger'a düşer — `md` (768px) daha iyi.
- Sağ aksiyonlar: `Bayimiz Olun` (`xl:block`), `Bayi Girişi` (`sm:block`), `Teklif İste` (her zaman). ~360px'de sıkışık — test et.
- Hero `pt-32 md:pt-40` — sticky header (~64px) için yeterli.
- Bayi kademeleri `lg:grid-cols-3` + featured `lg:-translate-y-3` — mobilde translate kaybolur (iyi), ama featured hiyerarşi mobile'da zayıf.

---

### 🟡 Kod / Mimari

- **Route grupları temiz:** `(public)` / `(dealer)` / `(auth)` / `admin`.
- **`globalThis.process.env`** (`page.tsx:36`) — modül-scope `process` gölgeleme workaround'u. PartnershipSection'daki `process` array'ini yeniden adlandırıp normal `process.env`'e dön.
- **Security headers** iyi (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). **CSP yok** — nonce'lu CSP ekle.
- **`images.remotePatterns: hostname: "**"`** (`next.config.ts:16`) — tüm host'lara izin. SSRF yüzeyi. Beyaz liste (CDN/Minio/supplier domain). **Kimi notu:** `b2bdepo.com` whitelist'e eklenmeli (402 görsellerin sebebi).
- **`/storage/:path*` → `localhost:9000`** rewrite — production'da Minio localhost'ta mı? Değilse üretimde kırık. Ortam-bazlı rewrite.

---

### ✅ Aksiyon Önceliği (glm)

| # | Aksiyon | Efor | Etki |
|---|---|---|---|
| 1 | Logo "AI" rengini düzelt (header home + footer) | 5 dk | Yüksek |
| 2 | `robots.txt` + `sitemap.ts` + JSON-LD domain → nexadepo.com | 15 dk | Yüksek (SEO) |
| 3 | `.env.production` trailing `\n` temizle | 5 dk | Yüksek |
| 4 | `og:image` üret + openGraph/twitter ekle | 1 sa | Yüksek (sosyal) |
| 5 | `/bayi-programi` `/cozumler` middleware kaynağını bul + düzelt | 30 dk | Kritik (conversion) |
| 6 | Koyu zemin slate-600 → slate-300/400 | 15 dk | Orta (a11y) |
| 7 | Ürün sayısı tek kaynak (1.800+ vs 5.000+) | 10 dk | Orta (güven) |
| 8 | Sektörel rakamları doğrula/çerçevele | — | Yasal risk |
| 9 | Hamburger `aria-expanded` | 2 dk | Düşük |
| 10 | Poppins ağırlık diyeti + public font split | 20 dk | Orta (perf) |
| 11 | CSP + `images.remotePatterns` kısıtı | 1 sa | Orta (güvenlik) |

İlk 4'ü bug değil, **görünür marka/SEO kaybı** — bugün düzeltilebilir.

---

*Bu bölüm GLM-5.2 modeli tarafından 2026-07-18'de kod tabanı incelemesiyle üretilmiştir.*
