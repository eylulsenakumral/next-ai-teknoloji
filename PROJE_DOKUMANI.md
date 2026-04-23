# Next AI Teknoloji — Proje Dokümantasyonu

> **Son güncelleme:** 16 Nisan 2026
> **Domain:** nexadepo.com / www.nexadepo.com
> **Lokal IP:** 192.168.5.249

---

## 1. Proje Özeti

B2B teknoloji bayi portalı. Bayiler (dealer) giriş yaparak ürünleri görebilir, sipariş verebilir. Admin paneli ürün/kategori/marka/tedarikçi/müşteri/sipariş yönetimi sağlar. WhatsApp entegrasyonu ile AI destekli müşteri hizmeti sunar. Tedarikçi scraper'ları (B2BDepo, Okisan, Ergen, IndexGrup, Netex, Tesan) XML/API üzerinden ürün/fiyat/stok çeker.

---

## 2. Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16.2.1 (App Router, Turbopack) |
| Runtime | Node.js 22, React 19.2 |
| Dil | TypeScript 5 |
| Stil | Tailwind CSS 4, tw-animate-css, motion (Framer Motion) |
| UI Library | shadcn/ui (Radix-based), lucide-react icons |
| Database | PostgreSQL (Prisma 7.5, @prisma/adapter-pg) |
| ORM | Prisma Client |
| Auth | next-auth 4 (JWT strategy, dual provider: dealer + admin) |
| Cache | Redis (ioredis, optional — yoksa no-op) |
| Object Storage | MinIO (optional — yoksa local /uploads) |
| State | Zustand 5 (cart, wishlist) |
| Forms | react-hook-form 7 + @hookform/resolvers + zod 4 |
| AI | OpenAI SDK (WhatsApp bot), z.ai GLM (kategori eşleştirme) |
| WhatsApp | @whiskeysockets/baileys (Baileys), whatsapp-web.js (yedek) |
| Scraping | Puppeteer, Playwright, Python b2b_scraper |
| Testing | Vitest 4, Playwright Test, Testing Library |
| XML Parse | fast-xml-parser |
| Diğer | Firebase (client), Swiper, Embla Carousel, date-fns, vaul (drawer), dnd-kit |

---

## 3. Ortam Değişkenleri (.env.example)

| Grup | Key'ler | Açıklama |
|------|---------|----------|
| Database | `DATABASE_URL` | PostgreSQL bağlantı string |
| Auth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | JWT secret ve base URL |
| BizimHesap | `BIZIMHESAP_API_KEY`, `BIZIMHESAP_TOKEN` | Muhasebe API entegrasyonu |
| Redis | `REDIS_URL` | `redis://localhost:6380` (Docker maps 6379→6380) |
| AI/WhatsApp | `OPENAI_API_KEY`, `WHATSAPP_AI_*` | WhatsApp bot LLM config |
| z.ai | `Z_AI_API_KEY`, `Z_AI_API_URL`, `Z_AI_MODEL` | GLM-5 kategori eşleştirme |
| MinIO | `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` | Object storage |
| Scraper-B2BDepo | `SCRAPER_B2BDEPO_*` | Bayi kodu, kullanıcı, şifre, güvenlik |
| Scraper-Okisan | `SCRAPER_OKISAN_USER`, `SCRAPER_OKISAN_PASS` | Okisan login |
| Firebase | `NEXT_PUBLIC_FIREBASE_*` | Client-side Firebase config |

---

## 4. Database Şeması (Prisma)

### 4.1 Modeller (22 adet)

| Model | Açıklama | İlişkiler |
|-------|----------|-----------|
| **Brand** | Marka (name, slug, logoUrl, isActive) | → Product[] |
| **Category** | Kategori hiyerarşisi (parentId, depth, path) | → Category (parent/children), Product[], SupplierCategoryMap[] |
| **Product** | Ana ürün entity (name, slug, barcode, sku, specs, images, fiyat flag'leri) | → Brand, Category, SupplierProduct[], OrderItem[], PriceListItem[], ProductTag[], CampaignSetProduct[], CartItem[], WishlistItem[] |
| **Tag** | Etiket (name, slug, color) | → ProductTag[] |
| **ProductTag** | Ürün-etiket junction | → Product, Tag |
| **Supplier** | Tedarikçi (code, scraperType, scraperConfig, syncStatus) | → SupplierProduct[], ScraperLog[] |
| **SupplierProduct** | Tedarikçi ürün eşleşmesi (purchasePrice, stockQuantity, matchConfidence) | → Supplier, Product?, PriceHistory[], OrderItem[] |
| **PriceHistory** | Fiyat değişim geçmişi | → SupplierProduct |
| **ProfitMargin** | Kar marjı kuralları (scope: GLOBAL/CATEGORY/BRAND/PRODUCT/CUSTOMER) | standalone |
| **Customer** | Bayi/Müşteri (dealerCode, şirket bilgileri, bakiye, kredi limiti, priceListId, status) | → Order[], AccountTransaction[], PriceList, WhatsAppConversation[], DealerApplication[] |
| **DealerApplication** | Bayi başvuru formu | → Customer? |
| **Order** | Sipariş (orderNumber, status, totals, paymentMethod, shipping, bizimhesap fatura) | → Customer, OrderItem[] |
| **OrderItem** | Sipariş kalemi (unitPrice, vatRate, lineTotal, purchasePrice, profitMarginPct) | → Order, Product?, SupplierProduct? |
| **AccountTransaction** | Cari hesap hareketleri (INVOICE/PAYMENT/REFUND/ADJUSTMENT/OPENING_BALANCE) | → Customer |
| **WhatsAppConversation** | WhatsApp konuşması (phoneNumber, context, status) | → Customer?, WhatsAppMessage[] |
| **WhatsAppMessage** | WhatsApp mesaj (direction, content, aiGenerated, aiModel) | → WhatsAppConversation |
| **AdminUser** | Admin kullanıcı (email, role: ADMIN/SUPER_ADMIN/VIEWER) | standalone |
| **ScraperLog** | Scraper çalışma logları (supplierId, productsFound/Updated/New/Removed) | → Supplier |
| **Notification** | Bildirim (EMAIL/SMS/WHATSAPP/PUSH/IN_APP) | standalone |
| **Setting** | Uygulama ayarları (key-value, group, isPublic) | standalone |
| **AuditLog** | Denetim logu (action, entity, oldValues/newValues) | standalone |
| **PriceList** | Fiyat listesi (PERCENTAGE/FIXED discount) | → Customer[], PriceListItem[] |
| **PriceListItem** | Fiyat listesi kalemi (customPrice, discountPct) | → PriceList, Product |
| **SupplierCategoryMap** | Tedarikçi kategori eşleşmesi (supplierCode→categoryId, confidence) | → Category? |
| **City** | Şehir (id, name, plateCode) | → District[] |
| **District** | İlçe | → City |
| **CampaignSet** | Kampanya seti (OUTLET/FEATURED/BUNDLE) | → CampaignSetProduct[] |
| **CampaignSetProduct** | Kampanya-ürün junction | → CampaignSet, Product |
| **Cart** | Sepet (userId bazlı) | → CartItem[] |
| **CartItem** | Sepet kalemi (priceSnapshot) | → Cart, Product |
| **Wishlist** | Favori listesi (userId bazlı) | → WishlistItem[] |
| **WishlistItem** | Favori kalemi | → Wishlist, Product |

### 4.2 Enum'lar (19 adet)

`CampaignSetType`, `SupplierSyncStatus`, `ScraperType`, `CustomerStatus`, `ApplicationStatus`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `TransactionType`, `MessageDirection`, `MessageType`, `MessageStatus`, `ConversationStatus`, `MatchMethod`, `AdminRole`, `NotificationChannel`, `NotificationType`, `MarginScope`, `DiscountType`, `Unit` (ADET/KUTU/PAKET/KOLI/METRE/KILOGRAM), `AuditAction`

---

## 5. Route Yapısı

### 5.1 Public Sayfalar `(public)` route group

| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/` | `(public)/page.tsx` | Ana sayfa (hero, kategoriler, kampanyalı ürünler, newsletter) |
| `/katalog` | `(public)/katalog/page.tsx` | Ürün kataloğu listesi |
| `/katalog/[slug]` | `(public)/katalog/[slug]/page.tsx` | Kategori bazlı ürün listesi |
| `/kategoriler` | `(public)/kategoriler/page.tsx` | Tüm kategoriler sayfası |
| `/kategoriler/[slug]` | `(public)/kategoriler/[slug]/page.tsx` | Kategori detay |
| `/kategori/[slug]` | `(public)/kategori/[slug]/page.tsx` | Alternatif kategori sayfası |
| `/markalar` | `(public)/markalar/page.tsx` | Markalar listesi |
| `/urun/[slug]` | `(public)/urun/[slug]/page.tsx` | Ürün detay sayfası |
| `/kampanya` | `(public)/kampanya/page.tsx` | Kampanyalar listesi |
| `/kampanya/[slug]` | `(public)/kampanya/[slug]/page.tsx` | Kampanya detay |
| `/hakkimizda` | `(public)/hakkimizda/page.tsx` | Hakkımızda |
| `/hakkinda` | `(public)/hakkinda/page.tsx` | Hakkında |
| `/iletisim` | `(public)/iletisim/page.tsx` | İletişim |
| `/kurumsal` | `(public)/kurumsal/page.tsx` | Kurumsal |
| `/gizlilik-politikasi` | `(public)/gizlilik-politikasi/page.tsx` | Gizlilik politikası |
| `/kullanim-sartlari` | `(public)/kullanim-sartlari/page.tsx` | Kullanım şartları |

Layout: `PublicHeader` + `PublicFooter` + `WhatsAppButton`

### 5.2 Auth Sayfaları `(auth)` route group

| Route | Açıklama |
|-------|----------|
| `/login` | Bayi/Admin giriş sayfası (dual provider) |
| `/basvuru` | Bayi başvuru formu |

### 5.3 Dealer Sayfaları `(dealer)` route group

| Route | Açıklama |
|-------|----------|
| `/urunler` | Bayi ürün listesi |
| `/urunler/[slug]` | Ürün detay |
| `/sepet` | Sepet |
| `/sepet/onay` | Sipariş onayı |
| `/siparisler` | Siparişlerim |
| `/siparisler/[id]` | Sipariş detay |
| `/hesabim` | Hesabım |
| `/hesabim/cari` | Cari hesap ekstresi |
| `/kampanyalar` | Kampanyalar |
| `/kampanya-setleri` | Kampanya setleri |
| `/garanti-takip` | Garanti takibi |

### 5.4 Admin Sayfaları `/admin`

| Route | Açıklama |
|-------|----------|
| `/admin` | Dashboard |
| `/admin/urunler` | Ürün yönetimi |
| `/admin/urunler/[id]` | Ürün düzenleme |
| `/admin/urunler/yeni` | Yeni ürün ekleme |
| `/admin/kategoriler` | Kategori yönetimi (dnd sortable) |
| `/admin/markalar` | Marka yönetimi |
| `/admin/tedarikciler/[id]` | Tedarikçi detay |
| `/admin/musteriler` | Müşteri yönetimi |
| `/admin/musteriler/[id]` | Müşteri detay |
| `/admin/siparisler` | Sipariş yönetimi |
| `/admin/siparisler/[id]` | Sipariş detay |
| `/admin/fiyatlandirma` | Fiyatlandırma/marj yönetimi |
| `/admin/kampanyalar` | Kampanya yönetimi |
| `/admin/kampanya-setleri` | Kampanya set yönetimi |
| `/admin/kategori-eslesmesi` | Tedarikçi kategori eşleştirme |
| `/admin/basvurular` | Bayi başvuruları |
| `/admin/whatsapp` | WhatsApp mesajlaşma paneli |
| `/admin/entegrasyonlar` | Dış entegrasyonlar |
| `/admin/ayarlar` | Uygulama ayarları |

Layout: `AdminHeader` + `AdminSidebar`

---

## 6. API Routes

### 6.1 Public API (`/api/public/*`)
| Endpoint | Açıklama |
|----------|----------|
| `GET /api/public/brands` | Marka listesi |
| `GET /api/public/categories` | Kategori ağacı |
| `GET /api/public/categories/[slug]` | Kategori detay |
| `GET /api/public/catalog/products` | Ürün kataloğu (filtreli) |
| `GET /api/public/catalog/products/[slug]` | Ürün detay |
| `GET /api/public/campaigns` | Kampanyalar |
| `GET /api/public/campaigns/[slug]` | Kampanya detay |
| `GET /api/public/search` | Arama |
| `GET /api/public/suppliers` | Tedarikçi listesi |

### 6.2 Auth API
| Endpoint | Açıklama |
|----------|----------|
| `POST /api/auth/[...nextauth]` | NextAuth handler (dealer + admin login) |

### 6.3 Catalog API (`/api/catalog/*`)
| Endpoint | Açıklama |
|----------|----------|
| `GET /api/catalog/brands` | Markalar |
| `GET /api/catalog/categories` | Kategoriler |
| `GET /api/catalog/products` | Ürünler |
| `GET /api/catalog/products/[slug]` | Ürün detay |
| `GET /api/catalog/search` | Arama |
| `GET /api/catalog/suppliers` | Tedarikçiler |

### 6.4 Admin API (`/api/admin/*`)
| Endpoint | Açıklama |
|----------|----------|
| `CRUD /api/admin/campaign-sets` | Kampanya set CRUD |
| `CRUD /api/admin/campaign-sets/[id]/products` | Kampanya ürün yönetimi |
| `CRUD /api/admin/campaigns` | Kampanya CRUD |
| `GET/POST /api/admin/integrations` | Entegrasyon durumu/sync |
| `POST /api/admin/integrations/sync` | Sync tetikle |
| `GET /api/admin/llm/models` | LLM model listesi |
| `POST /api/admin/llm/test` | LLM test |
| `CRUD /api/admin/orders` | Sipariş CRUD |
| `CRUD /api/admin/orders/[id]` | Sipariş detay/güncelleme |
| `GET/POST /api/admin/scrapers` | Scraper durumu/çalıştırma |
| `POST /api/admin/scrapers/sync` | Scraper sync |
| `GET /api/admin/scrapers/categories` | Scraper kategorileri |
| `POST /api/admin/scrape-specs` | Ürün spec scraping |
| `CRUD /api/admin/settings` | Ayar CRUD |
| `POST /api/admin/upload` | Dosya yükleme (MinIO/local) |

### 6.5 İş API'leri
| Endpoint | Açıklama |
|----------|----------|
| `CRUD /api/products` | Ürün CRUD (arama, bulk) |
| `CRUD /api/brands` | Marka CRUD |
| `CRUD /api/categories` | Kategori CRUD (tree, reorder, import, export, bulk) |
| `CRUD /api/suppliers` | Tedarikçi CRUD |
| `GET /api/suppliers/[id]/products` | Tedarikçi ürünleri |
| `CRUD /api/customers` | Müşteri CRUD |
| `POST /api/customers/[id]/send-credentials` | Bayi bilgisi gönder |
| `GET /api/customers/[id]/balance` | Bakiye sorgula |
| `CRUD /api/orders` | Sipariş CRUD |
| `GET/POST/DELETE /api/cart` | Sepet işlemleri |
| `GET/POST/DELETE /api/wishlist` | Favori işlemleri |
| `POST /api/pricing/calculate` | Fiyat hesaplama |
| `CRUD /api/pricing/margins` | Marj CRUD |
| `POST /api/pricing/simulate` | Fiyat simülasyonu |
| `CRUD /api/account/profile` | Profil yönetimi |
| `GET /api/account/transactions` | Hesap hareketleri |
| `CRUD /api/applications` | Bayi başvuru CRUD |
| `GET /api/exchange-rate` | Döviz kuru |
| `GET /api/locations/cities` | Şehir listesi |
| `GET /api/locations/districts` | İlçe listesi |
| `CRUD /api/supplier-category-maps` | Tedarikçi kategori map CRUD |
| `GET /api/supplier-categories` | Tedarikçi kategorileri |

### 6.6 Entegrasyon API'leri
| Endpoint | Açıklama |
|----------|----------|
| `POST /api/b2bdepo/sync-products` | B2BDepo ürün sync |
| `POST /api/b2bdepo/sync-pricestock` | B2BDepo fiyat/stok sync |
| `GET /api/b2bdepo/status` | B2BDepo durumu |
| `POST /api/bizimhesap/sync-customers` | BizimHesap müşteri sync |
| `POST /api/bizimhesap/sync-inventory` | BizimHesap stok sync |
| `POST /api/bizimhesap/sync-products` | BizimHesap ürün sync |
| `GET /api/bizimhesap/test` | BizimHesap bağlantı test |
| `POST /api/okisan/sync` | Okisan sync |
| `POST /api/indexgrup/sync` | IndexGrup sync |
| `POST /api/netex/sync` | Netex sync |
| `POST /api/tesan/sync` | Tesan sync |
| `GET /api/cron/sync-suppliers` | Cron: periyodik tedarikçi sync |

### 6.7 WhatsApp API (`/api/whatsapp/*`)
| Endpoint | Açıklama |
|----------|----------|
| `POST /api/whatsapp/connect` | Bağlan |
| `GET /api/whatsapp/qrcode` | QR kod al |
| `GET /api/whatsapp/status` | Bağlantı durumu |
| `GET /api/whatsapp/auth-state` | Auth durumu |
| `POST /api/whatsapp/send` | Mesaj gönder |
| `GET /api/whatsapp/conversations` | Konuşma listesi |
| `GET /api/whatsapp/conversations/[id]/messages` | Mesajlar |

---

## 7. Components

### 7.1 UI Primitives (`components/ui/`)
shadcn/ui tabanlı: `accordion`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `city-district-selector`, `dialog`, `drawer`, `dropdown-menu`, `form`, `input`, `label`, `pagination`, `popover`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toaster`, `tooltip`

### 7.2 Public Components (`components/public/`)
| Component | Açıklama |
|-----------|----------|
| `public-header` | Ana sayfa header (mega menu, mobil menü, arama) |
| `public-footer` | Footer |
| `hero-banner` | Ana sayfa hero slider |
| `navigation-bar` | Navigasyon bar |
| `mega-menu-dropdown` | Mega menü dropdown |
| `categories-grid` | Kategori grid |
| `brand-logo-bar` | Marka logoları bar |
| `campaign-section` | Kampanya bölümü |
| `campaign-product-card` | Kampanyalı ürün kartı |
| `public-product-card` | Ürün kartı |
| `product-card-horizontal` | Yatay ürün kartı |
| `deal-week-badge` | Haftanın fırsatı badge |
| `exchange-rate-bar` | Döviz kuru bar |
| `grid-banner-section` | Grid banner |
| `newsletter-section` | Newsletter kayıt |
| `promo-bar` | Üst promo bar |
| `stock-badge` | Stok durumu badge |
| `blog-section` | Blog bölümü |

### 7.3 Admin Components (`components/admin/`)
| Component | Açıklama |
|-----------|----------|
| `product-form` | Ürün formu |
| `brand-form` | Marka formu |
| `category-form` | Kategori formu |
| `specs-editor` | Spec düzenleyici (JSON) |
| `specs-scraper` | Spec scraping |
| `image-manager` / `image-upload` | Görsel yönetimi (MinIO) |
| `margin-editor` | Marj düzenleyici |
| `price-display` / `price-simulator` | Fiyat gösterim/simülasyon |
| `confirm-dialog` | Onay dialog |
| `application-review` | Başvuru inceleme |
| `supplier-category-map-form` | Tedarikçi kategori eşleştirme |
| `kategoriler/bulk-action-bar` | Toplu işlem bar |
| `kategoriler/import-modal` | Kategori import modal |
| `kategoriler/sortable-row` | Sürükle-bırak kategori sıralama |

### 7.4 Layout Components (`components/layout/`)
`admin-header`, `admin-sidebar`, `dealer-header`, `dealer-footer`

### 7.5 Diğer
`cart-drawer` (sepet drawer), `product-card`, `product-filters`, `product-gallery`, `product-search`, `product-list-item`, `breadcrumb`, `add-to-cart-button`, `order-status-badge`, `order-status-timeline`, `order-summary`, `whatsapp-button`, `providers` (SessionProvider wrapper), `sections/*` (b2b-section, promo-banner, tabbed-product, trust-badges)

---

## 8. Lib Modülleri (`src/lib/`)

| Dosya | Açıklama |
|-------|----------|
| `auth.ts` | NextAuth config — 2 provider: `dealer-credentials` (bayi kodu+şifre) ve `admin-credentials` (email+şifre). JWT strategy, 30 gün session. |
| `auth-helpers.ts` | Auth yardımcı fonksiyonları |
| `dealer-auth.ts` | Bayi auth helper |
| `db.ts` | Prisma client singleton (`@prisma/adapter-pg` ile pg pool) |
| `cache.ts` | Redis cache wrapper (withCache, invalidatePattern — Redis yoksa no-op) |
| `redis.ts` | ioredis singleton (optional, graceful fallback) |
| `minio.ts` | MinIO client singleton (optional, local storage fallback, public-read bucket policy) |
| `storage.ts` | Dosya yükleme abstraction (MinIO veya local) |
| `pricing.ts` | Fiyat hesaplama (margin cascade: PRODUCT > BRAND > CATEGORY > GLOBAL, default %30) |
| `firebase.ts` | Firebase client-side init |
| `category-mapping.ts` | Kategori eşleştirme logic |
| `category-matcher.ts` | LLM destekli kategori eşleştirme (z.ai GLM) |
| `import-supplier-products.ts` | Tedarikçi ürün import logic |
| `supplier-product-importer.ts` | Tedarikçi ürün import runner |
| `supplier-sync-runner.ts` | Tedarikçi sync runner |
| `sync-logger.ts` | Sync loglama |
| `utils.ts` | Genel utility (cn, vs.) |
| `utils/format.ts` | Format utilities |
| `utils/slug.ts` | Slug oluşturma |
| `validators/*.ts` | Zod validator'lar: `brand`, `campaign-set`, `category`, `customer`, `order`, `pricing`, `product` |
| `whatsapp/client.ts` | WhatsApp Baileys client |

---

## 9. Services (`src/services/`)

| Dosya | Açıklama |
|-------|----------|
| `bizimhesap.service.ts` | BizimHesap B2B API entegrasyonu — müşteri, ürün, stok sync, fatura oluşturma |
| `b2bdepo-xml.service.ts` | B2BDepo XML feed parser — ürün, fiyat, stok çekme |
| `okisan.service.ts` | Okisan tedarikçi API entegrasyonu |
| `netgsm.service.ts` | NetGSM SMS API entegrasyonu |
| `order.service.ts` | Sipariş iş mantığı (oluşturma, hesaplama, stok kontrol) |
| `pricing.service.ts` | Gelişmiş fiyatlandırma — margin cascade, cache, simülasyon |

---

## 10. Workers

### 10.1 Scraper Workers (`workers/scraper/`)

| Dosya | Açıklama |
|-------|----------|
| `scheduler.ts` | Scraper zamanlayıcı (periyodik sync, `--watch` mode) |
| `base.ts` | Base scraper class |
| `index.ts` | Scraper registry |
| `suppliers/b2bdepo.ts` | B2BDepo Playwright scraper |
| `suppliers/b2bdepo-xml.ts` | B2BDepo XML feed scraper |
| `suppliers/ergen.ts` | Ergen scraper |
| `suppliers/indexgrup-xml.ts` | IndexGrup XML scraper (v1) |
| `suppliers/indexgrup-xml-v2.ts` | IndexGrup XML scraper (v2) |
| `suppliers/netex-xml.ts` | Netex XML scraper (v1) |
| `suppliers/netex-xml-v2.ts` | Netex XML scraper (v2) |
| `suppliers/okisan.ts` | Okisan scraper |
| `suppliers/tesan-soap.ts` | Tesan SOAP API scraper |

### 10.2 WhatsApp Worker (`workers/whatsapp/`)

| Dosya | Açıklama |
|-------|----------|
| `worker.ts` | Ana worker — Baileys client runner, reconnect logic |
| `client.ts` | Baileys WhatsApp client (connect, disconnect, QR, mesaj gönder/al) |
| `handler.ts` | Gelen mesaj handler |
| `ai.ts` | AI yanıt üretici (OpenAI/z.ai) |
| `templates/index.ts` | Mesaj şablonları |
| `tools/index.ts` | AI function calling tools |
| `tools/categories.ts` | Kategori sorgulama tool |
| `tools/customer-info.ts` | Müşteri bilgisi tool |
| `tools/order-create.ts` | Sipariş oluşturma tool |
| `tools/price-inquiry.ts` | Fiyat sorgulama tool |
| `tools/product-details.ts` | Ürün detay tool |
| `tools/product-search.ts` | Ürün arama tool |
| `tools/stock-check.ts` | Stok sorgulama tool |
| `types.ts` | TypeScript tipleri |

**WhatsApp AI Tools:** AI asistanı function calling ile ürün arama, fiyat sorgulama, stok kontrolü, sipariş oluşturma, müşteri bilgisi, kategori listeleme yapabilir.

---

## 11. Scripts (`scripts/`)

| Kategori | Scriptler |
|----------|-----------|
| **Kategori** | `seed-categories.ts`, `migrate-categories.ts`, `merge-categories.ts`, `fix-category-hierarchy-llm.ts`, `reorganize-categories.ts`, `remap-all-categories.ts`, `smart-categorize.ts`, `llm-category-matcher.ts`, `map-supplier-categories.ts`, `categorize-orphan-products.ts`, `create-missing-categories.ts`, `fix-root-categories.ts`, `cleanup-duplicate-categories.ts`, `discover_categories.py`, `map_categories.py` |
| **Marka** | `download-brand-logos.ts`, `download-from-websites.ts`, `find-logos-with-llm.ts`, `missing-logos.ts`, `clear-logo-urls.ts` |
| **Sync** | `run-sync.ts`, `sync-okisan.ts`, `link-supplier-products.ts`, `reassign-products-by-supplier.ts`, `export-category-migration-data.ts` |
| **Storage** | `migrate-uploads-to-minio.ts`, `fetch-product-images.ts` |
| **Python Scraper** | `b2b_scraper/` — `auth.py`, `config.py`, `fetcher.py`, `models.py`, `scraper.py`, `storage.py`, `parsers/` (B2BDepo, BayiKanali, Edenge, Ergen, Inox, Tesan) |
| **Shell** | `b2bdepo-pricestock-sync.sh`, `b2bdepo-xml-sync.sh`, `bizimhesap-sync.sh`, `okisan-sync.sh`, `run-b2b-sync.sh` |

---

## 12. Auth & Middleware

### Auth Sistemi
- **next-auth 4** ile JWT tabanlı authentication
- **Dual Provider:**
  - `dealer-credentials`: Bayi kodu + şifre → `Customer` tablosu
  - `admin-credentials`: Email + şifre → `AdminUser` tablosu
- **Rol sistemi:** `dealer`, `admin`, `super_admin`, `viewer`
- **Customer status kontrolü:** APPROVED olmayanlar giriş yapamaz (SUSPENDED, BLACKLISTED, PENDING)

### Middleware (`src/proxy.ts` — aktif)
- Public route'lar: `/`, `/katalog`, `/markalar`, `/urunler`, `/basvuru`, `/garanti-takip`, `/kategoriler`, `/login`, `/hakkimizda`, `/iletisim`, vs.
- `/api/public/*`, `/api/auth/*`, `/api/chat`, `/api/cron/*` → auth gerektirmez
- `/admin/*` → admin/super_admin rolü gerekli
- Dealer route'ları → APPROVED bayi gerekli
- Diğer tüm route'lar → session gerekli

---

## 13. Fiyatlandırma Sistemi

### Marj Cascade (öncelik sırası)
1. **PRODUCT** — Ürün bazlı marj (en yüksek öncelik)
2. **BRAND** — Marka bazlı marj
3. **CATEGORY** — Kategori bazlı marj
4. **GLOBAL** — Varsayılan marj (%30)

### Hesaplama Formülü
```
salePriceExVat = purchasePrice × (1 + marginPct/100)
salePriceIncVat = salePriceExVat × (1 + vatRate/100)
profit = salePriceExVat - purchasePrice
```

### Fiyat Listeleri
- Müşteri bazlı fiyat listeleri (Customer.priceListId)
- PriceListItem: customPrice veya discountPct
- Manuel fiyat (Product.manualPrice) override
- Kampanya indirimi (Product.campaignDiscountPct)

---

## 14. NPM Scripts

| Script | Komut | Açıklama |
|--------|-------|----------|
| `dev` | `next dev` | Geliştirme sunucusu |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Production sunucu |
| `lint` | `eslint` | Lint |
| `test` | `vitest run` | Test çalıştır |
| `test:watch` | `vitest` | Test watch mode |
| `test:api` | `vitest run src/app/api/__tests__/` | API testleri |
| `test:coverage` | `vitest run --coverage` | Coverage |
| `db:seed` | `node --experimental-strip-types prisma/seed.ts` | DB seed |
| `db:seed:categories` | `tsx prisma/seed-categories.ts` | Kategori seed |
| `db:seed:campaigns` | `tsx prisma/seed-campaigns.ts` | Kampanya seed |
| `scraper:run` | `tsx workers/scraper/scheduler.ts` | Scraper çalıştır |
| `scraper:watch` | `tsx workers/scraper/scheduler.ts --watch` | Scraper watch |
| `fetch:images` | `tsx scripts/fetch-product-images.ts` | Görsel çek |
| `storage:migrate` | `tsx scripts/migrate-uploads-to-minio.ts` | MinIO migrasyon |

---

## 15. Next.js Config

```typescript
allowedDevOrigins: ["192.168.5.249", "nexadepo.com", "www.nexadepo.com"]
images: { remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }] }
rewrites: [{ source: "/storage/:path*", destination: "http://localhost:9000/nextai-assets/:path*" }]
serverExternalPackages: ["@whiskeysockets/baileys", "jimp", "minio", "sharp", "qrcode-terminal"]
```

---

## 16. Testing

| Araç | Config | Kapsam |
|------|--------|--------|
| Vitest | `vitest.config.ts` | Unit + API testleri |
| Playwright | `playwright.config.ts` | E2E testleri |
| Testing Library | React component testleri | Component testleri |

### Test Dosyaları
- `src/app/api/__tests__/` — `auth`, `cart`, `categories`, `customers`, `orders`, `pricing-calculate`, `products`, `products-id`, `suppliers`, `whatsapp`, `wishlist`
- `src/components/layout/*.test.tsx` — Admin/dealer layout testleri
- `src/components/public/__tests__/` — Navigation, hero-banner testleri
- `src/components/products/__tests__/` — Product card, filters testleri
- `src/lib/cache.test.ts`, `src/lib/utils/*.test.ts`, `src/lib/validators/*.test.ts`
- `src/app/(public)/**/*.test.tsx` — Sayfa testleri

---

## 17. Fontlar

| Font | Kullanım | Variable |
|------|----------|----------|
| Poppins | Ana font (300-900) | `--font-poppins` |
| Outfit | İkincil font (300) | `--font-outfit` |
| JetBrains Mono | Monospace | `--font-mono` |

---

## 18. Docker

- `docker/` dizininde Docker konfigürasyonları
- Redis: host 6380 → container 6379
- MinIO: localhost:9000

---

## 19. Önemli Mimari Kararlar

1. **Optional Redis/MinIO** — Uygulama Redis veya MinIO olmadan da çalışır (graceful fallback)
2. **Prisma adapter-pg** — Standart Prisma client yerine `@prisma/adapter-pg` + `pg.Pool` kullanılıyor
3. **Next.js 16** — App Router, Turbopack aktif
4. **Dual Auth** — Bayi ve admin aynı NextAuth instance'ında farklı provider'larla
5. **WhatsApp AI** — Baileys tabanlı, function calling ile ürün/sipariş operasyonları
6. **Python + TS Scraper** — Hem TypeScript hem Python scraper'lar mevcut
7. **Margin Cascade** — 4 seviyeli öncelik bazlı fiyatlandırma

---

## 20. Understand-Anything Analizi

> **Tarama tarihi:** 16 Nisan 2026
> **Araç:** Understand-Anything (Claude Code Plugin)
> **Knowledge Graph:** `.understand-anything/knowledge-graph.json`

### Genel İstatistikler

| Metrik | Değer |
|--------|-------|
| Toplam dosya | 538 |
| Toplam satır | 174,565 |
| Toplam tanım (definition) | 143 |
| Import edge | 660 |
| Domain edge | 17 |
| Toplam edge | 677 |

### Dil Dağılımı

| Dil | Dosya Sayısı |
|-----|-------------|
| TypeScript | 416 |
| Unknown (config/pycache vs.) | 43 |
| Python | 19 |
| JSON | 16 |
| Markdown | 15 |
| Script | 65 |
| HTML | 6 |
| CSS | 5 |
| Shell | 5 |
| JavaScript | 6 |
| SQL | 3 |
| Diğer (YAML, TOML, Prisma, Text) | 5 |

### Katman Dağılımı (Architecture Layers)

| Katman | Dosya | Açıklama |
|--------|-------|----------|
| UI (Presentation) | 226 | Next.js sayfaları, layout'lar, React component'leri |
| API | 102 | Next.js API route'ları ve server action'lar |
| Library | 38 | Paylaşımlı yardımcı fonksiyonlar ve konfigürasyon |
| Data | 11 | Prisma şema, migration'lar, seed |
| Service | 8 | İş mantığı servisleri (pricing, scraping, WhatsApp) |
| Infrastructure | - | Worker'lar, middleware, Redis, MinIO |

### Framework'ler

Next.js, React, Prisma, next-auth, Tailwind CSS, shadcn/ui, Radix UI, Zustand, Zod, Vitest, Playwright, Redis (ioredis), MinIO, WhatsApp (Baileys), Puppeteer, OpenAI, Firebase, React Hook Form, Motion, date-fns, Embla Carousel, Swiper, dnd-kit, Vaul, Sonner

### En Çok Bağlı Dosyalar (Hot Paths)

| Dosya | Gelen Import | Açıklama |
|-------|-------------|----------|
| `src/lib/db.ts` | 95 | Prisma client singleton — en çok kullanılan modül |
| `src/lib/auth-helpers.ts` | 52 | Auth yardımcı fonksiyonları |
| `src/components/ui/button.tsx` | 45 | shadcn/ui Button component |
| `src/components/ui/input.tsx` | 29 | shadcn/ui Input component |
| `src/components/ui/badge.tsx` | 21 | shadcn/ui Badge component |
| `src/components/ui/card.tsx` | 21 | shadcn/ui Card component |
| `src/lib/utils/format.ts` | 20 | Format yardımcıları |
| `src/components/ui/skeleton.tsx` | 17 | shadcn/ui Skeleton component |
| `src/components/ui/label.tsx` | 16 | shadcn/ui Label component |
| `src/lib/auth.ts` | 15 | NextAuth konfigürasyonu |

### En Büyük Dosyalar

| Dosya | Satır |
|-------|-------|
| `scripts/crontab.log` | 40,594 |
| `package-lock.json` | 18,549 |
| `data/category-reassignment.json` | 7,453 |
| `data/misplaced-products.json` | 5,791 |
| `data/legitimate-category-tree.json` | 4,961 |
| `scripts/smart-categorize.ts` | 1,847 |
| `prisma/seed.ts` | 1,450 |
| `src/app/admin/kampanya-setleri/page.tsx` | 1,127 |

### Mimari Akış

```
[UI Layer: 226 files]
    ↓ fetches
[API Layer: 102 files]
    ↓ calls
[Services: 8 files]
    ↓ queries
[Data Layer: Prisma + PostgreSQL]
    ↑
[Infrastructure: Workers + Redis + MinIO]
```

---

## 21. Değişiklik Günlüğü

| Tarih | Değişiklik |
|-------|------------|
| 16 Nisan 2026 | İlk proje dokümantasyonu oluşturuldu |
| 16 Nisan 2026 | Understand-Anything analizi eklendi (538 node, 677 edge) |
| 16 Nisan 2026 | WhatsApp AI Ürün Danışman Agent — spec bazlı arama + belirleyici soru akışı eklendi. Yeni tool'lar: `search_by_specs`, `update_requirements`. Konuşma geçmişi yükleme (6 mesaj). Domain knowledge: CCTV/güvenlik. |
| 16 Nisan 2026 | WhatsApp AI model glm-4.5-air → glm-5.1 olarak güncellendi |
| 16 Nisan 2026 | Web Chatbox eklendi — `/api/chat` route + floating chat widget (public + dealer layout). WhatsApp AI engine'ı aynı şekilde kullanıyor. |
| 17 Nisan 2026 | Chat prompt kuralları güncellendi: Fiyat gösterilmiyor, stok adedi gösteriliyor, marka+model zorunlu, konu dışı sorular reddediliyor. `priceInfo` parametresi kaldırıldı. |

---

*Bu dosya proje hakkında her şeyi içerir. Her geliştirme sonrası güncellenecektir.*
