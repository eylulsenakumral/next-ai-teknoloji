# Next AI Teknoloji — Native Mobil Uygulama Spesifikasyonu

> **Proje:** tamirhanem.com B2B Bayi Platformu
> **Tarih:** 25 Nisan 2026
> **Hedef:** Expo React Native (iOS + Android) native mobil uygulama

---

## 1. Genel Bakış

tamirhanem.com, bilgisayar ve güvenlik ürünleri toptan satış B2B platformu. Bayiler (müşteriler) giriş yaparak ürünleri görür, fiyatları kontrol eder, sipariş verir ve hesap hareketlerini takip eder.

**Mobil uygulama bayi (dealer) tarafı için.** Admin paneli web'de kalacak.

### Mevcut Web Uygulaması
- **Framework:** Next.js 16.2.1, React 19, TypeScript 5
- **UI:** Tailwind CSS 4, shadcn/ui
- **DB:** PostgreSQL (Prisma 7.5)
- **Auth:** NextAuth (JWT, 30 gün session)
- **Ödeme:** Nomupay (kart), Havale/EFT
- **Real-time:** WhatsApp (Baileys), Firebase
- **Storage:** MinIO (dosya), Redis (cache)

---

## 2. Teknoloji Seçimleri

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Framework | **Expo SDK 53+** (React Native) | Tek codebase, iOS + Android, OTA update |
| Dil | **TypeScript** | Web projesiyle aynı tip tanımları paylaşılabilir |
| State | **Zustand** | Web'de de kullanılıyor, hafif, basit |
| Navigasyon | **Expo Router** (file-based) | Next.js App Router'a benzer yapı |
| API | **REST** (mevcut API'ler) | Web API'leri doğrudan kullanılacak |
| Auth | **JWT token** (cookie-based) | Mevcut auth sistemiyle uyumlu |
| Push | **Expo Push Notifications** | FCM + APNs desteği |
| Ödeme | **Nomupay mobile SDK** | Mevcut ödeme altyapısı |
| Storage | **AsyncStorage + SQLite** | Offline cache, token saklama |
| UI | **React Native Paper** veya **Gluestack UI** | Native hissi, özelleştirilebilir |

---

## 3. Ekran Haritası (Screen Map)

### 3.1 Auth Akışı

```
Splash Screen
├── Login (bayi kodu + şifre)
├── Şifremi Unuttum
└── Bayilik Başvurusu
    ├── Firma bilgileri
    ├── İletişim bilgileri
    ├── Adres (il/ilçe dropdown)
    ├── Vergi levhası yükleme (kamera/galeri)
    └── KVKK onayı
```

### 3.2 Ana Uygulama (Giriş Sonrası)

```
Tab Navigator (5 tab)
├── 🏠 Ana Sayfa
│   ├── Son görülen ürünler
│   ├── Kampanya setleri (yatay scroll)
│   ├── Yeni ürünler
│   ├── Öne çıkan ürünler
│   ├── Döviz kuru bandı (USD/EUR)
│   └── Hızlı arama barı
│
├── 📦 Katalog
│   ├── Kategori ağacı (hierarchical)
│   ├── Markalar listesi
│   ├── Ürün listesi (grid/list view)
│   │   ├── Filtre (marka, fiyat, stok, kategori)
│   │   ├── Sıralama (fiyat, isim, yeni, popüler)
│   │   └── Sonsuz scroll + pagination
│   ├── Ürün detay
│   │   ├── Görsel galeri (carousel)
│   │   ├── Fiyat (bayi fiyatı + indirim)
│   │   ├── Stok durumu
│   │   ├── Teknik özellikler (specs JSON)
│   │   ├── Benzer ürünler
│   │   ├── Sepete ekle (miktar seçici)
│   │   └── Favorilere ekle
│   └── Arama (autocomplete + sonuçlar)
│
├── 🛒 Sepet
│   ├── Sepet ürünleri listesi
│   │   ├── Miktar değiştir (+/-)
│   │   ├── Ürün silme (swipe)
│   │   └── Stok uyarısı
│   ├── Sepet özeti (ara toplam, KDV, indirim, toplam)
│   ├── Ödeme geç
│   │   ├── Teslimat adresi
│   │   ├── Fatura adresi
│   │   ├── Ödeme yöntemi seçimi
│   │   │   ├── Havale/EFT
│   │   │   └── Kredi kartı (Nomupay)
│   │   ├── Sipariş notu
│   │   └── Onayla
│   └── Ödeme sonucu (başarılı/başarısız)
│
├── 📋 Siparişler
│   ├── Sipariş listesi
│   │   ├── Durum filtresi (bekleyen, hazırlanan, kargoda, teslim)
│   │   ├── Tarih filtresi
│   │   └── Pull-to-refresh
│   └── Sipariş detay
│       ├── Sipariş bilgileri (no, tarih, durum)
│       ├── Durum timeline (görsel)
│       ├── Ürün listesi
│       ├── Tutar detayı
│       ├── Kargo takip no + link
│       └── Fatura (PDF görüntüle)
│
└── 👤 Hesabım
    ├── Profil bilgileri
    │   ├── Firma adı, yetkili, telefon, email
    │   └── Düzenle
    ├── Cari hesap
    │   ├── Bakiye göstergesi
    │   ├── Kredi limiti
    │   ├── Hesap hareketleri (tarih, tutat, açıklama)
    │   └── Filtre (tarih aralığı)
    ├── Favoriler
    │   └── Favori ürünler listesi
    ├── Kampanyalar
    │   └── Aktif kampanya setleri
    ├── Teklifler
    │   └── Gelen teklifler listesi
    ├── Döviz kuru bilgisi
    ├── WhatsApp destek
    ├── Ayarlar
    │   ├── Bildirim tercihleri
    │   ├── Dil (Türkçe)
    │   └── Versiyon bilgisi
    └── Çıkış yap
```

---

## 4. API Endpoint Referansı

Mevcut web API'leri doğrudan mobil tarafından tüketilecek. Base URL: `https://next-ai-teknoloji.vercel.app` veya production domain.

### 4.1 Auth (Public)

| Method | Endpoint | Açıklama | Body/Params |
|--------|----------|----------|-------------|
| POST | `/api/auth/dealer-login` | Bayi girişi | `{ dealerCode, password }` |
| POST | `/api/auth/admin-login` | Admin girişi (web only) | — |
| POST | `/api/auth/forgot-password` | Şifre sıfırlama | `{ email }` |

**Login Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "dealerCode": "BAY0001",
    "companyName": "Firma Adı",
    "contactName": "Yetkili Adı",
    "email": "firma@email.com",
    "phone": "0532xxx",
    "role": "dealer",
    "status": "APPROVED",
    "balance": 15000.50,
    "creditLimit": 50000,
    "discountRate": 5,
    "city": "İstanbul",
    "district": "Kadıköy"
  }
}
```

### 4.2 Ürünler (Public + Auth)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/catalog/products` | Ürün listesi (pagination, filter) |
| GET | `/api/catalog/products/[slug]` | Ürün detay |
| GET | `/api/catalog/categories` | Kategori listesi/ağacı |
| GET | `/api/catalog/brands` | Marka listesi |
| GET | `/api/catalog/search?q=xxx` | Arama |
| GET | `/api/public/catalog/products` | Public ürün listesi |
| GET | `/api/public/categories` | Public kategoriler |
| GET | `/api/public/brands` | Public markalar |
| GET | `/api/public/campaigns` | Kampanyalar |

**Query Params (Ürün Listesi):**
```
?page=1&limit=20
&category=uuid
&brand=uuid
&search=notebook
&sort=price_asc|price_desc|name_asc|newest
&minPrice=1000
&maxPrice=50000
&inStock=true
&isFeatured=true
&isNew=true
```

**Ürün Detay Response:**
```json
{
  "id": "uuid",
  "name": "Lenovo IdeaPad 5 Pro",
  "slug": "lenovo-ideapad-5-pro",
  "brand": { "id": "uuid", "name": "Lenovo", "logoUrl": "..." },
  "category": { "id": "uuid", "name": "Dizüstü Bilgisayar", "slug": "..." },
  "images": ["url1", "url2", "url3"],
  "shortDescription": "...",
  "description": "... (HTML)",
  "specs": { "İşlemci": "Intel i7-13700H", "RAM": "16GB DDR5", ... },
  "price": 42500,
  "currency": "TRY",
  "stockQuantity": 15,
  "minOrderQuantity": 1,
  "unit": "ADET",
  "warrantyMonths": 24,
  "isActive": true,
  "isFeatured": false,
  "isNew": true,
  "campaignDiscountPct": 5
}
```

### 4.3 Sepet (Auth)

| Method | Endpoint | Açıklama | Body |
|--------|----------|----------|------|
| GET | `/api/cart` | Sepeti getir | — |
| POST | `/api/cart` | Sepete ekle | `{ productId, quantity }` |
| PUT | `/api/cart` | Miktar güncelle | `{ itemId, quantity }` |
| DELETE | `/api/cart` | Sepeti boşalt | — |
| DELETE | `/api/cart/[itemId]` | Ürün çıkar | — |

### 4.4 Sipariş (Auth)

| Method | Endpoint | Açıklama | Body |
|--------|----------|----------|------|
| GET | `/api/orders` | Sipariş listesi | query: `?page=1&status=PENDING` |
| POST | `/api/orders` | Sipariş oluştur | Sipariş payload (aşağıda) |
| GET | `/api/orders/[id]` | Sipariş detay | — |

**Sipariş Oluşturma Payload:**
```json
{
  "items": [
    { "productId": "uuid", "quantity": 2, "unitPrice": 42500 }
  ],
  "shippingAddress": {
    "name": "Firma Adı",
    "address": "Adres...",
    "city": "İstanbul",
    "district": "Kadıköy",
    "phone": "0532xxx"
  },
  "billingAddress": { "..." },
  "paymentMethod": "BANK_TRANSFER" | "CREDIT_CARD",
  "notes": "Acil teslimat"
}
```

### 4.5 Hesap (Auth)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/account/profile` | Profil bilgileri |
| PUT | `/api/account/profile` | Profil güncelle |
| GET | `/api/account/transactions` | Cari hesap hareketleri |

### 4.6 Favoriler (Auth)

| Method | Endpoint | Açıklama | Body |
|--------|----------|----------|------|
| GET | `/api/wishlist` | Favori listesi | — |
| POST | `/api/wishlist` | Favori ekle | `{ productId }` |
| DELETE | `/api/wishlist` | Favori çıkar | `{ productId }` |

### 4.7 Bayilik Başvurusu (Public)

| Method | Endpoint | Açıklama | Body |
|--------|----------|----------|------|
| POST | `/api/applications` | Başvuru gönder | Başvuru form data |

**Başvuru Payload:**
```json
{
  "companyName": "Firma Adı",
  "contactName": "Yetkili Kişi",
  "phone": "0532xxx",
  "email": "firma@email.com",
  "taxOffice": "Kadıköy VDB",
  "taxNumber": "1234567890",
  "city": "İstanbul",
  "district": "Kadıköy",
  "address": "Adres...",
  "taxCertificateUrl": "data:image/...;base64,...",
  "kvkkAccepted": true
}
```

### 4.8 Döviz Kuru (Public)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/exchange-rate` | Güncel USD/EUR kuru |

**Response:**
```json
{ "usd": 38.5024, "eur": 43.1876, "lastUpdated": "2026-04-25T10:00:00Z" }
```

### 4.9 Lokasyon (Public)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/locations/cities` | 81 il listesi |
| GET | `/api/locations/districts?cityId=X` | İlçeler |

### 4.10 Ödeme (Auth)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/payment/nomupay` | Ödeme başlat |
| POST | `/api/payment/nomupay/callback` | Ödeme sonuç |
| POST | `/api/payment/nomupay/bin` | BIN sorgulama |

---

## 5. Veri Modelleri (Mobil İçin Gerekli)

### 5.1 Customer (Bayi)

```typescript
interface Customer {
  id: string
  dealerCode: string        // "BAY0001"
  companyName: string
  tradeName?: string
  contactName?: string
  contactTitle?: string
  phone?: string
  phone2?: string
  email?: string
  taxOffice?: string
  taxNumber?: string
  address?: string
  city?: string
  district?: string
  postalCode?: string
  balance: number           // Mevcut bakiye
  creditLimit: number       // Kredi limiti
  discountRate: number      // İndirim oranı (%)
  status: CustomerStatus    // PENDING | APPROVED | REJECTED | SUSPENDED
  tags: string[]
  lastLoginAt?: string
}
```

### 5.2 Product (Ürün)

```typescript
interface Product {
  id: string
  name: string
  slug: string
  barcode?: string
  sku?: string
  modelCode?: string
  shortDescription?: string
  description?: string      // HTML
  specs?: Record<string, string>  // { "İşlemci": "i7", "RAM": "16GB" }
  images: string[]          // URL dizisi
  brand?: { id: string; name: string; logoUrl?: string }
  category?: { id: string; name: string; slug: string }
  price: number
  currency: string
  stockQuantity: number
  minOrderQuantity: number
  unit: "ADET" | "KUTU" | "PAKET" | "KOLI" | "METRE" | "KILOGRAM"
  warrantyMonths?: number
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  isOutlet: boolean
  campaignDiscountPct?: number
  viewCount: number
}
```

### 5.3 Order (Sipariş)

```typescript
interface Order {
  id: string
  orderNumber: string       // "SIP-2026-0001"
  status: OrderStatus
  subtotal: number
  discountTotal: number
  vatTotal: number
  shippingTotal: number
  grandTotal: number
  currency: string
  paymentMethod: "BANK_TRANSFER" | "CREDIT_CARD"
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
  shippingAddress?: object
  billingAddress?: object
  notes?: string
  shippingTrackingNumber?: string
  shippingCarrier?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

interface OrderItem {
  id: string
  productName: string
  productBarcode?: string
  quantity: number
  unitPrice: number
  discountAmount: number
  vatRate: number
  lineTotal: number
  productId?: string        // Ürün detayına link için
}
```

### 5.4 OrderStatus (Enum)

```typescript
type OrderStatus =
  | "PENDING"      // Bekliyor
  | "CONFIRMED"    // Onaylandı
  | "PREPARING"    // Hazırlanıyor
  | "SHIPPED"      // Kargoda
  | "DELIVERED"    // Teslim edildi
  | "CANCELLED"    // İptal edildi
```

### 5.5 Cart & CartItem

```typescript
interface Cart {
  id: string
  items: CartItem[]
  totalAmount: number
  totalItems: number
}

interface CartItem {
  id: string
  productId: string
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  lineTotal: number
  stockQuantity: number     // Stok kontrolü için
}
```

### 5.6 AccountTransaction (Cari Hareket)

```typescript
interface AccountTransaction {
  id: string
  type: "DEBIT" | "CREDIT"    // Borç / Alacak
  amount: number
  balanceAfter: number
  currency: string
  referenceType?: string      // "ORDER", "PAYMENT"
  referenceId?: string
  description?: string
  createdAt: string
}
```

### 5.7 Category (Kategori)

```typescript
interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  parentId?: string
  depth: number               // 0 = root, 1 = child, 2 = grandchild
  sortOrder: number
  isActive: boolean
  children?: Category[]       // Recursive
}
```

### 5.8 CampaignSet (Kampanya)

```typescript
interface CampaignSet {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  type: "BUNDLE" | "PROMOTION" | "CLEARANCE"
  discountPct?: number
  price?: number
  validFrom?: string
  validUntil?: string
  isActive: boolean
  products: { id: string; name: string; quantity: number; image?: string }[]
}
```

### 5.9 DealerApplication (Bayilik Başvurusu)

```typescript
interface DealerApplication {
  companyName: string
  contactName: string
  phone: string
  email: string
  taxOffice?: string
  taxNumber?: string
  city?: string
  district?: string
  address?: string
  taxCertificateUrl?: string  // base64 data URL
  kvkkAccepted: boolean
}
```

---

## 6. Auth Akışı

### 6.1 Login

```
1. Kullanıcı bayi kodu + şifre girer
2. POST /api/auth/dealer-login
3. Başarılı → JWT token cookie'ye yazılır
4. Token AsyncStorage'a kaydedilir (persist)
5. Kullanıcı bilgileri Zustand store'a yazılır
6. Ana sayfaya yönlendirilir

Hata durumları:
- 401: Geçersiz bayi kodu veya şifre
- 403: Hesap henüz onaylanmamış (PENDING/REJECTED/SUSPENDED)
- 500: Sunucu hatası
```

### 6.2 Token Yönetimi

```typescript
// Token saklama
AsyncStorage.setItem("auth_token", token)
AsyncStorage.setItem("auth_user", JSON.stringify(user))

// Her API isteğinde
headers: {
  Cookie: `next-auth.session-token=${token}`
}
// VEYA
headers: {
  Authorization: `Bearer ${token}`
}

// Token geçersizse → login ekranına yönlendir
// 401 response → token'i sil, logout
```

### 6.3 Otomatik Login

```
Uygulama açılışında:
1. AsyncStorage'dan token oku
2. Token varsa → GET /api/account/profile ile doğrula
3. Geçerli → Ana sayfa
4. Geçersiz → Login ekranı
```

### 6.4 Hesap Durumları

| Status | Açıklama | Mobilde |
|--------|----------|---------|
| PENDING | Onay bekliyor | "Başvurunuz inceleniyor" ekranı |
| APPROVED | Aktif bayi | Tam erişim |
| REJECTED | Reddedildi | "Başvurunuz reddedildi" + iletişim |
| SUSPENDED | Askıya alındı | "Hesabınız donduruldu" + destek |
| BLACKLISTED | Kara liste | "Hesap kapatıldı" |

---

## 7. Ekran Detayları

### 7.1 Splash Screen
- Logo animasyonu (1.5 saniye)
- Token kontrolü → login veya ana sayfa

### 7.2 Login Ekranı
- Bayi kodu input (otomatik büyük harf)
- Şifre input (göster/gizle toggle)
- "Giriş Yap" butonu (loading state)
- "Şifremi Unuttum" linki
- "Bayilik Başvurusu" linki
- Logo üstte

### 7.3 Ana Sayfa
- **Üst bar:** Logo + bildirim ikonu + sepet ikonu (adet badge)
- **Döviz kuru bandı:** `1 USD = 38.50 ₺ | 1 EUR = 43.19 ₺` (canlı)
- **Arama barı:** Tıklandığında tam ekran arama açılır
- **Kampanya carousel:** Aktif kampanya setleri (yatay scroll, görsel)
- **Yeni ürünler:** "Yeni Gelenler" section (yatay scroll)
- **Öne çıkanlar:** "Çok Satanlar" section (yatay scroll)
- **Kategoriler:** Grid (2 sütun, ikon + isim)

### 7.4 Katalog / Ürün Listesi
- **Üst:** Kategori breadcrumb
- **Filtre butonu:** Modal sheet (marka, fiyat aralığı, stok durumu)
- **Sıralama:** Dropdown (en düşük fiyat, en yüksek, en yeni, isim)
- **Grid/Liste toggle:** 2 sütun grid veya liste görünümü
- **Ürün kartı:** Görsel, isim, marka, fiyat (KDV dahil), stok durumu, favori ikonu
- **Sonsuz scroll:** 20'li sayfalar
- **Pull-to-refresh**

### 7.5 Ürün Detay
- **Görsel galeri:** Tam ekran carousel, pinch-to-zoom
- **İsim + marka**
- **Fiyat:** Bayi fiyatı büyük, eski fiyat üstü çizili (indirim varsa)
- **Stok durumu:** Yeşil (stok var) / Kırmızı (tükendi) / Sarı (az kaldı)
- **Teknik özellikler:** Accordion veya tablo (specs JSON)
- **Açıklama:** HTML render (WebView veya parsed text)
- **Benzer ürünler:** Yatay scroll
- **Sepete ekle:** Alt sabit bar (miktar +/-, "Sepete Ekle" butonu)
- **Favori:** Sağ üst kalp ikonu

### 7.6 Sepet
- **Ürün listesi:** Swipe-to-delete
- **Her ürün:** Görsel, isim, fiyat, miktar (- / +), satır toplamı
- **Alt özet:**
  - Ara toplam
  - KDV (%20)
  - İndirim (varsa)
  - **Toplam (bold)**
- **"Ödemeye Geç" butonu** (alt sabit)

### 7.7 Ödeme
- **Adım 1: Teslimat Adresi**
  - Kayıtlı adres veya yeni adres
  - İsim, adres, il dropdown, ilçe dropdown, telefon
- **Adım 2: Ödeme Yöntemi**
  - Havale/EFT (hesap bilgileri gösterilir)
  - Kredi Kartı (Nomupay form)
- **Adım 3: Onay**
  - Sipariş özeti
  - Not ekle
  - "Sipariş Ver" butonu
- **Sonuç ekranı:** Başarılı (sipariş no) / Başarısız (hata mesajı)

### 7.8 Siparişler
- **Tab bar:** Tümü | Bekleyen | Hazırlanan | Kargoda | Teslim
- **Her sipariş kartı:**
  - Sipariş no + tarih
  - Durum badge (renkli)
  - Ürün sayısı + toplam tutar
  - Tıkla → detay
- **Sipariş detay:**
  - Durum timeline (5 adım görsel)
  - Ürün listesi (görsel + isim + miktar + fiyat)
  - Tutar detayı
  - Kargo takip (link)
  - Fatura (PDF aç)

### 7.9 Hesabım
- **Profil kartı:** Firma adı, bayi kodu, durum badge
- **Menü listesi:**
  - Cari Hesap (bakiye + hareketler)
  - Favoriler
  - Kampanyalar
  - Teklifler
  - Döviz Kuru
  - WhatsApp Destek (doğrudan sohbet)
  - Bildirim Ayarları
  - Çıkış Yap

### 7.10 Cari Hesap
- **Üst:** Bakiye kartı (büyük rakam, kredi limiti bar)
- **Filtre:** Tarih aralığı (bu hafta, bu ay, özel)
- **Hareket listesi:** Tarih, açıklama, borç (kırmızı), alacak (yeşil), bakiye
- **Pull-to-refresh**

### 7.11 Bayilik Başvurusu
- Multi-step form (3 adım):
  1. Firma bilgileri (firma adı, vergi dairesi, vergi no)
  2. İletişim (yetkili adı, telefon, email, il/ilçe, adres)
  3. Belgeler (vergi levhası yükleme) + KVKK onayı
- Kamera veya galeriden dosya seçimi
- İlerleme göstergesi (step indicator)

---

## 8. Push Bildirimler

### 8.1 Bildirim Tipleri

| Tip | Tetikleyici | Başlık | Body |
|-----|-------------|--------|------|
| ORDER_STATUS | Sipariş durumu değişimi | "Sipariş Durumu Güncellendi" | "SIP-001 kargoya verildi" |
| PRICE_ALERT | Takip edilen ürün fiyat düştü | "Fiyat Düştü!" | "Ürün X %10 ucuzladı" |
| CAMPAIGN | Yeni kampanya | "Yeni Kampanya!" | "Kampanya seti eklendi" |
| STOCK_ALERT | Takip edilen ürün stoka girdi | "Stoka Geldi!" | "Ürün X stokta" |
| CREDIT | Bakiye güncellendi | "Bakiye Güncellendi" | "Hesabınıza 5000₺ alacak" |
| APPROVAL | Başvuru sonucu | "Başvuru Sonucu" | "Bayilik başvurunuz onaylandı" |

### 8.2 Token Yönetimi

```typescript
// Uygulama açılışında
const token = await Notifications.getExpoPushTokenAsync()
// Backend'e kaydet
POST /api/devices/register { pushToken, platform, userId }
```

---

## 9. Offline Strateji

| Veri | Offline Davranış |
|------|------------------|
| Kategoriler | SQLite cache, 24 saat TTL |
| Markalar | SQLite cache, 24 saat TTL |
| Ürün listesi | Son yüklenen sayfa cache |
| Sepet | Local state (sync on reconnect) |
| Siparişler | Cache + background refresh |
| Kullanıcı bilgisi | AsyncStorage |

---

## 10. Tema ve Tasarım

### 10.1 Renk Paleti

| Renk | Hex | Kullanım |
|------|-----|----------|
| Primary | `#0040a4` | Butonlar, linkler, başlıklar |
| Primary Light | `#2189ff` | Hover, aktif state |
| Secondary | `#1a1a2e` | Sidebar, koyu alanlar |
| Background | `#f3f3f3` | Sayfa arkaplanı |
| Surface | `#ffffff` | Kartlar, inputlar |
| Text | `#1a1a1a` | Ana metin |
| Text Muted | `#6b7280` | İkincil metin |
| Success | `#16a34a` | Stok var, onay |
| Warning | `#f59e0b` | Az stok, bekliyor |
| Danger | `#ef4444` | Tükendi, hata |
| Border | `#e5e7eb` | Kenarlıklar |

### 10.2 Tipografi

- **Font:** System default (SF Pro iOS, Roboto Android)
- **Heading:** Bold, 20-28px
- **Body:** Regular, 14-16px
- **Caption:** Regular, 12px
- **Price:** Bold, tabular nums

### 10.3 Border Radius

- Kartlar: 16px
- Butonlar: full (pill)
- Input alanları: 12px
- Modal: 20px üst köşeler

---

## 11. Proje Yapısı (Expo)

```
mobile/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Splash → redirect
│   ├── login.tsx                 # Login ekranı
│   ├── forgot-password.tsx       # Şifre sıfırlama
│   ├── basvuru.tsx               # Bayilik başvurusu
│   ├── (tabs)/                   # Tab navigator
│   │   ├── _layout.tsx           # Tab layout
│   │   ├── index.tsx             # Ana sayfa
│   │   ├── katalog.tsx           # Katalog
│   │   ├── sepet.tsx             # Sepet
│   │   ├── siparisler.tsx        # Siparişler
│   │   └── hesabim.tsx           # Hesabım
│   ├── urun/
│   │   └── [slug].tsx            # Ürün detay
│   ├── kategori/
│   │   └── [slug].tsx            # Kategori ürünleri
│   ├── marka/
│   │   └── [slug].tsx            # Marka ürünleri
│   ├── arama.tsx                 # Arama ekranı
│   ├── odeme/
│   │   ├── index.tsx             # Ödeme adımları
│   │   └── sonuc.tsx             # Ödeme sonucu
│   ├── siparis/
│   │   └── [id].tsx              # Sipariş detay
│   ├── cari.tsx                  # Cari hesap
│   ├── favoriler.tsx             # Favoriler
│   └── kampanya/
│       └── [slug].tsx            # Kampanya detay
├── src/
│   ├── api/                      # API client
│   │   ├── client.ts             # Axios/fetch wrapper (base URL, interceptors)
│   │   ├── auth.ts               # Login, logout, token management
│   │   ├── products.ts           # Ürün API'leri
│   │   ├── cart.ts               # Sepet API'leri
│   │   ├── orders.ts             # Sipariş API'leri
│   │   ├── account.ts            # Hesap API'leri
│   │   ├── categories.ts         # Kategori API'leri
│   │   ├── brands.ts             # Marka API'leri
│   │   ├── wishlist.ts           # Favori API'leri
│   │   ├── exchange.ts           # Döviz kuru API
│   │   ├── locations.ts          # İl/ilçe API
│   │   └── applications.ts       # Başvuru API
│   ├── stores/                   # Zustand stores
│   │   ├── auth-store.ts         # Login state, user info
│   │   ├── cart-store.ts         # Sepet state
│   │   ├── product-store.ts      # Ürün listesi cache
│   │   └── ui-store.ts           # UI state (filters, view mode)
│   ├── components/               # Yeniden kullanılabilir
│   │   ├── ui/                   # Temel bileşenler
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   ├── product-card.tsx      # Ürün kartı
│   │   ├── product-grid.tsx      # Ürün grid/liste
│   │   ├── category-card.tsx     # Kategori kartı
│   │   ├── cart-item.tsx         # Sepet ürün satırı
│   │   ├── order-card.tsx        # Sipariş kartı
│   │   ├── order-timeline.tsx    # Sipariş durum timeline
│   │   ├── price-display.tsx     # Fiyat gösterimi
│   │   ├── search-bar.tsx        # Arama barı
│   │   ├── filter-sheet.tsx      # Filtre bottom sheet
│   │   ├── exchange-rate-bar.tsx # Döviz kuru bandı
│   │   ├── quantity-selector.tsx # Miktar +/-
│   │   └── image-carousel.tsx    # Görsel carousel
│   ├── hooks/                    # Custom hooks
│   │   ├── use-auth.ts
│   │   ├── use-cart.ts
│   │   ├── use-products.ts
│   │   └── use-locations.ts
│   ├── lib/                      # Yardımcılar
│   │   ├── storage.ts            # AsyncStorage wrapper
│   │   ├── format.ts             # Para, tarih formatlama
│   │   ├── constants.ts          # API URL, renkler, vs.
│   │   └── notifications.ts      # Push bildirim
│   └── types/                    # TypeScript tipleri
│       └── index.ts              # Tüm interface'ler
├── assets/                       # Statik dosyalar
│   ├── images/
│   ├── icons/
│   └── fonts/
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tsconfig.json
├── package.json
└── babel.config.js
```

---

## 12. Backend Değişiklikleri

Mobil uygulamanın çalışması için web backend'de yapılması gereken değişiklikler:

### 12.1 Mobil Token (Push) Kayıt API (YENİ)

```
POST /api/devices/register
Body: { pushToken: string, platform: "ios" | "android", userId: string }
```

### 12.2 API Response Format Standardizasyonu

Mevcut API'ler web'e özel cookie-based auth kullanıyor. Mobil için:

- **Seçenek A:** Mevcut cookie-based auth kullan (React Native cookies destekler)
- **Seçenek B:** Authorization header ile JWT bearer token ekle

**Öneri:** Seçenek A (daha az değişiklik).

### 12.3 CORS

Mobil uygulamadan gelen istekler için CORS header'ları eklenebilir (gerekirse). Expo development'ta `localhost` kullanılacak.

### 12.4 Eklenmesi Gereken Endpoint'ler

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/dealer/quotes` | Bayi teklif listesi |
| `GET /api/dealer/quotes/[id]` | Bayi teklif detay |
| `GET /api/dealer/notifications` | Bayi bildirimleri |
| `PATCH /api/dealer/notifications/[id]` | Bildirim okundu |
| `POST /api/devices/register` | Push token kayıt |
| `DELETE /api/cart/[itemId]` | Tek ürün silme |

---

## 13. Üçüncü Parti Servisler

| Servis | Kullanım | API Key |
|--------|----------|---------|
| Expo Push | Bildirim | Expo hesabı |
| Nomupay | Ödeme | Mevcut |
| Firebase | Analytics, Crashlytics | Mevcut (firebase.ts) |
| TCMB | Döviz kuru | Public API |
| WhatsApp | Destek hattı | Mevcut (Baileys) |

---

## 14. Güvenlik

- **Token:** JWT, 30 gün geçerli, AsyncStorage'da şifreli
- **HTTPS:** Tüm API çağrıları HTTPS
- **Certificate Pinning:** Production'da (opsiyonel)
- **Biometric Login:** Face ID / Touch ID (opsiyonel, ikinci faz)
- **Root Detection:** Rooted/Jailbreak cihazlarda uyarı
- **API Rate Limiting:** Server-side (mevcut)

---

## 15. Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| Cold start | < 2 saniye |
| Ekran geçişi | < 300ms |
| API response | < 1 saniye |
| Image load | < 500ms (thumbnail) |
| List scroll | 60 FPS |
| APK boyutu | < 30 MB |
| IPA boyutu | < 40 MB |

---

## 16. Geliştirme Aşamaları

### Faz 1 — MVP (2-3 hafta)
- [ ] Proje kurulumu (Expo, Router, Zustand)
- [ ] Auth (login, token yönetimi)
- [ ] Ana sayfa (kampanya, yeni ürünler, kategoriler)
- [ ] Katalog (kategori ağacı, ürün listesi, filtre, arama)
- [ ] Ürün detay (galeri, fiyat, specs, sepete ekle)
- [ ] Sepet (CRUD, özet)
- [ ] Sipariş oluşturma (adres, ödeme yöntemi)
- [ ] Sipariş listesi + detay

### Faz 2 — Tam Özellik (1-2 hafta)
- [ ] Cari hesap (bakiye, hareketler)
- [ ] Favoriler
- [ ] Bayilik başvurusu
- [ ] Döviz kuru bandı
- [ ] Push bildirimler
- [ ] Offline cache (SQLite)
- [ ] WhatsApp destek butonu

### Faz 3 — İyileştirme (1 hafta)
- [ ] Biometric login
- [ ] Deep linking (ürün/sipariş linki)
- [ ] Haptic feedback
- [ ] Accessibility (VoiceOver/TalkBack)
- [ ] Performance optimization
- [ ] App Store / Google Play yayınlama

---

## 17. Test Stratejisi

| Test Tipi | Araç |
|-----------|------|
| Unit | Jest |
| Component | React Native Testing Library |
| E2E | Detox |
| API | Mevcut Vitest suite |
| Performance | Flipper |
| Beta | TestFlight + Google Play Internal |

---

## 18. App Store Bilgileri

### Android (Google Play)
- **Package:** `com.tamirhanem.bayi`
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 35

### iOS (App Store)
- **Bundle ID:** `com.tamirhanem.bayi`
- **Min iOS:** 15.0
- **Target iOS:** 18.0

### Store Listing
- **Uygulama Adı:** Tamirhanem Bayi
- **Kategori:** İş / B2B
- **Dil:** Türkçe
- **Yaş:** 4+

---

*Bu doküman projenin mevcut kod tabanından üretilmiştir. Tüm API endpoint'leri, veri modelleri ve iş mantığı web uygulamasından doğrudan alınmıştır.*
