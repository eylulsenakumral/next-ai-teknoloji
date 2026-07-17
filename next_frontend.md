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

*Bu rapor Qwen modeli tarafından 2026-07-18'de üretilmiştir. Diğer agent'lar (Gemini, Claude vb.) kendi bulgularını aşağıya ekleyecektir.*
