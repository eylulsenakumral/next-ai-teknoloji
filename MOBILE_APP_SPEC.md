# Next AI Teknoloji — Native Mobil Uygulama Spesifikasyonu

> **Proje:** NexaDepo B2B Bayi Platformu (nexadepo.com)
> **Tarih:** 25 Nisan 2026
> **Hedef:** Expo React Native (iOS + Android) native mobil uygulama

---

## 1. Genel Bakış

NexaDepo (nexadepo.com), bilgisayar ve güvenlik ürünleri toptan satış B2B platformu. Bayiler (müşteriler) giriş yaparak ürünleri görür, fiyatları kontrol eder, sipariş verir ve hesap hareketlerini takip eder.

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

Mevcut web API'leri doğrudan mobil tarafından tüketilecek. Base URL: `https://nexadepo.com` (production).

### 4.1 Auth (NextAuth)

NextAuth credentials provider üzerinden çalışıyor. Endpoint: `/api/auth/[...nextauth]`

| Method | Endpoint | Açıklama | Body |
|--------|----------|----------|------|
| POST | `/api/auth/callback/credentials` | Bayi girişi | `{ dealerCode, password }` (NextAuth flow) |
| POST | `/api/auth/signout` | Çıkış | — |

**Not:** Mobilde cookie-based auth kullanılacak. React Native fetch API cookies destekler.

**Login Response:**
NextAuth cookie-based JWT döner. Ayrı bir JSON body yoktur — session cookie `Set-Cookie` header'ı ile gelir. Login sonrası profil bilgisi için `GET /api/account/profile` çağrılmalı.

```
POST /api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

dealerCode=BAY0001&password=xxx

→ 302 redirect + Set-Cookie: next-auth.session-token=eyJ...
```

Profil bilgisi:
```json
// GET /api/account/profile → { data: Customer }
{
  "data": {
    "id": "uuid",
    "dealerCode": "BAY0001",
    "companyName": "Firma Adı",
    "contactName": "Yetkili Adı",
    "email": "firma@email.com",
    "phone": "0532xxx",
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

**Query Params (Ürün Listesi - `/api/catalog/products`):**
```
?page=1&limit=20           # max 100, default 20
&search=notebook           # arama (name, sku, modelCode, barcode, description, brand name)
&categorySlug=dizustu      # kategori slug (alt kategoriler dahil)
&brandSlug=lenovo          # marka slug filtre
&inStock=true              # stokta olanlar
&campaign=true             # kampanyalı/featured/outlet ürünler
&sortBy=newest|name-asc|name-desc  # varsayılan: newest
```

**Public Endpoint (`/api/public/catalog/products`):**
- Auth gerektirmez, Redis cache'li (60s)
- `categorySlug` ve `brandSlug` parametreleri alır (ID yerine)
- Stok miktarı gösterilmez
- Bazı tedarikçilerde (Okisan) fiyat gizlenir

**Ürün Detay Response (`GET /api/catalog/products/[slug]`):**
```json
{
  "product": {
    "id": "uuid",
    "name": "Lenovo IdeaPad 5 Pro",
    "slug": "lenovo-ideapad-5-pro",
    "barcode": "0123456789",
    "sku": "LEN-IDEA5P",
    "modelCode": "82SH",
    "shortDescription": "...",
    "description": "... (HTML)",
    "specs": { "İşlemci": "Intel i7-13700H", "RAM": "16GB DDR5" },
    "images": ["url1", "url2", "url3"],
    "brand": {
      "id": "uuid",
      "name": "Lenovo",
      "slug": "lenovo",
      "logoUrl": "...",
      "websiteUrl": "..."
    },
    "category": {
      "id": "uuid",
      "name": "Dizüstü Bilgisayar",
      "slug": "dizustu",
      "parentId": "uuid|null",
      "parent": { "id": "uuid", "name": "...", "slug": "...", "parentId": "uuid|null" }
    },
    "pricing": {
      "purchasePrice": 35000,
      "salePriceExVat": 42000,
      "salePriceIncVat": 50400,
      "vatRate": 20,
      "currency": "TRY"
    },
    "stock": {
      "quantity": 15,
      "isAvailable": true
    },
    "warrantyMonths": 24,
    "minOrderQuantity": 1,
    "unit": "ADET",
    "isNew": true,
    "isFeatured": false,
    "isOutlet": false
  },
  "relatedProducts": [
    {
      "id": "uuid",
      "name": "...",
      "slug": "...",
      "images": ["..."],
      "brand": { "id": "uuid", "name": "...", "slug": "..." },
      "pricing": { "salePriceExVat": 0, "salePriceIncVat": 0, "vatRate": 20 },
      "stock": { "quantity": 0, "isAvailable": false }
    }
  ]
}
```

**Ürün Listesi Response (`GET /api/catalog/products`):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Lenovo IdeaPad 5 Pro",
      "slug": "lenovo-ideapad-5-pro",
      "images": ["url1"],
      "description": "...",
      "specifications": { "İşlemci": "Intel i7-13700H" },
      "brand": { "name": "Lenovo", "slug": "lenovo" },
      "category": { "name": "Dizüstü Bilgisayar", "slug": "dizustu" },
      "stockStatus": true,
      "stockCount": 15,
      "hidePrice": false,
      "price": 50400,
      "currency": "TRY",
      "priceTry": 50400,
      "usdTryRate": 38.5
    }
  ],
  "meta": { "total": 150, "page": 1, "limit": 20, "totalPages": 8 }
}
```

### 4.3 Sepet (Auth)

| Method | Endpoint | Açıklama | Body/Params |
|--------|----------|----------|-------------|
| GET | `/api/cart` | Sepeti getir | — |
| POST | `/api/cart` | Sepete ekle | `{ productId, quantity }` |
| PUT | `/api/cart` | Miktar güncelle | `{ itemId, quantity }` |
| DELETE | `/api/cart?itemId={id}` | Ürün çıkar | query param |
| DELETE | `/api/cart` | Sepeti boşalt | Body/query yok |

**Cart Response (GET):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [{
    "id": "uuid",
    "productId": "uuid",
    "quantity": 2,
    "priceSnapshot": 42500,
    "product": {
      "id": "uuid", "name": "...", "slug": "...",
      "images": ["url"],
      "brand": { "name": "Lenovo" },
      "supplierProducts": [{ "stockQuantity": 15, "purchasePrice": 35000 }]
    }
  }]
}
```

**Cart Mutation Response (POST/PUT/DELETE):**
```json
{ "success": true }
```

### 4.4 Sipariş (Auth)

| Method | Endpoint | Açıklama | Body |
|--------|----------|----------|------|
| GET | `/api/orders` | Sipariş listesi | query: `?page=1&limit=20&status=PENDING` |
| POST | `/api/orders` | Sipariş oluştur | Sipariş payload (aşağıda) |
| GET | `/api/orders/[id]` | Sipariş detay | — |
| DELETE | `/api/orders/[id]` | Sipariş iptal | — |

**Order List Response:** `{ data: Order[], meta: { total, page, limit, totalPages } }`
**Order Create Response:** `{ data: { id, orderNumber, status, totalAmount, currency, createdAt } }`
**Order Cancel Response:** `{ data: { success: true } }`

**Sipariş Oluşturma Payload:**
```json
{
  "items": [
    { "productId": "uuid", "quantity": 2 }
  ],
  "shippingAddress": {
    "companyName": "Firma Adı",
    "contactName": "Yetkili Adı",
    "phone": "0532xxx",
    "address": "Adres...",
    "city": "İstanbul",
    "district": "Kadıköy",
    "postalCode": "34000",
    "country": "TR"
  },
  "paymentMethod": "BANK_TRANSFER" | "ON_ACCOUNT" | "CREDIT_CARD",
  "notes": "Acil teslimat"
}
```

### 4.5 Hesap (Auth)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/account/profile` | Profil bilgileri |
| PUT | `/api/account/profile` | Profil güncelle |
| GET | `/api/account/transactions` | Cari hesap hareketleri |

**Transaction Query Params:** `?page=1&limit=20&type=INVOICE|PAYMENT|REFUND|ADJUSTMENT|OPENING_BALANCE&dateFrom=2026-01-01&dateTo=2026-04-25`

### 4.6 Favoriler (Auth)

| Method | Endpoint | Açıklama | Body/Params |
|--------|----------|----------|-------------|
| GET | `/api/wishlist` | Favori listesi | — |
| POST | `/api/wishlist` | Favori ekle | `{ productId }` |
| DELETE | `/api/wishlist?productId={id}` | Favori çıkar | query param |

**Wishlist Response (GET):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [{
    "id": "uuid",
    "productId": "uuid",
    "addedAt": "2026-04-25T10:00:00Z",
    "product": {
      "id": "uuid", "name": "...", "slug": "...",
      "images": ["url"],
      "brand": { "name": "Lenovo" },
      "category": { "name": "Dizüstü", "slug": "dizustu" },
      "supplierProducts": [{ "stockQuantity": 15, "purchasePrice": 35000 }]
    }
  }]
}
```

**Wishlist Mutation Response:** `{ success: true, alreadyExists?: boolean }`

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

### 4.10 Ödeme (Auth — NomuPay)

2-adım ödeme akışı:

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/payment/nomupay` | Ödeme ticket oluştur → returnUrl döner |
| POST | `/api/payment/nomupay/callback` | NomuPay async callback |
| GET | `/api/payment/nomupay/callback` | Final callback (redirect) |
| POST | `/api/payment/nomupay/bin` | BIN sorgulama (taksit) |

**Flow:**
```
1. POST /api/payment/nomupay { amount, currency, orderId }
   → { success: true, returnUrl: "https://pay.nomupay.com/...", orderId, maskedCCNo, mpay, ... }
2. WebView'de returnUrl açılır, kart bilgileri girilir
3. Callback ile sonuç alınır
```

---

## 5. Veri Modelleri (Mobil İçin Gerekli)

### 5.1 Customer (Bayi) — `GET /api/account/profile`

**Response wrapper:** `{ data: Customer }`

```typescript
interface Customer {
  id: string
  dealerCode: string        // "BAY0001"
  companyName: string
  tradeName: string
  contactName: string
  contactTitle: string | null
  phone: string | null
  phone2: string | null
  email: string
  taxOffice: string | null
  taxNumber: string | null
  address: string | null
  city: string | null
  district: string | null
  postalCode: string | null
  whatsappPhone: string | null
  status: CustomerStatus    // PENDING | APPROVED | REJECTED | SUSPENDED
  balance: number           // Mevcut bakiye
  creditLimit: number       // Kredi limiti
  discountRate: number      // İndirim oranı (%)
  createdAt: string
  approvedAt: string | null
  lastLoginAt: string | null
}
```

### 5.2 Product (Ürün)

**Liste item** (`/api/catalog/products`): flat yapılır, nested `pricing`/`stock` yoktur. Liste için `ProductListItem`, detay için `ProductDetail` kullanılır.

```typescript
// Ürün listesi item — /api/catalog/products → data[]
interface ProductListItem {
  id: string
  name: string
  slug: string
  images: string[] | null
  description: string | null
  specifications: Record<string, any> | null
  brand: { name: string; slug: string }
  category: { name: string; slug: string }
  stockStatus: boolean
  stockCount: number
  hidePrice: boolean
  price: number | null         // Bayi fiyatı (markup uygulanmış)
  currency: string             // "TRY" | "USD" | "EUR"
  priceTry: number | null      // TRY karşılığı
  usdTryRate: number           // Anlık USD kuru
}

// Ürün detay — /api/catalog/products/[slug] → product
interface ProductDetail {
  id: string
  name: string
  slug: string
  barcode: string | null
  sku: string | null
  modelCode: string | null
  shortDescription: string | null
  description: string | null   // HTML
  specs: Record<string, any> | null
  images: string[] | null
  brand: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    websiteUrl: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    parentId: string | null
    parent?: {                   // Breadcrumb için 3 seviye
      id: string; name: string; slug: string; parentId: string | null
      parent?: { id: string; name: string; slug: string; parentId: string | null }
    }
  }
  pricing: {
    purchasePrice: number        // Alış fiyatı
    salePriceExVat: number       // Satış fiyatı (KDV hariç)
    salePriceIncVat: number      // Satış fiyatı (KDV dahil)
    vatRate: number              // %20
    currency: string
  }
  stock: {
    quantity: number
    isAvailable: boolean
  }
  warrantyMonths: number | null
  minOrderQuantity: number | null
  unit: string | null
  isNew: boolean
  isFeatured: boolean
  isOutlet: boolean
}
```

### 5.3 Order (Sipariş)

**Liste wrapper:** `{ data: Order[], meta: PaginationMeta }`
**Detay wrapper:** `{ data: Order }`

```typescript
interface Order {
  id: string
  orderNumber: string       // "SIP-2026-0001"
  status: OrderStatus
  totalAmount: number       // Toplam tutar (tek alan)
  currency: string
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    contactName: string
  }
  items: OrderItem[]
  shippingAddress: {
    address: string
    city: string
    district: string
    postalCode: string
  }
  trackingNumber: string | null
  estimatedDelivery: string | null
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number        // unitPrice * quantity
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
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

**Response:** `{ id, userId, items: CartItem[] }` (wrapper yok, direkt obje)

```typescript
interface Cart {
  id: string
  userId: string
  items: CartItem[]
}

interface CartItem {
  id: string
  productId: string
  quantity: number
  priceSnapshot: number      // Sepete eklenirkenki fiyat anlık görüntüsü
  product: {
    id: string
    name: string
    slug: string
    images: string[] | null
    brand: { name: string }
    supplierProducts: {
      stockQuantity: number
      purchasePrice: number
    }[]
  }
}
```

### 5.6 AccountTransaction (Cari Hareket)

**Response wrapper:** `{ data: AccountTransaction[], meta: TransactionMeta }`

```typescript
interface AccountTransaction {
  id: string
  type: "INVOICE" | "PAYMENT" | "REFUND" | "ADJUSTMENT" | "OPENING_BALANCE"
  amount: number
  balance: number             // İşlem sonrası bakiye
  description: string | null
  referenceNumber: string | null
  createdAt: string
}

interface TransactionMeta extends PaginationMeta {
  currentBalance: number
  creditLimit: number
}
```

### 5.7 Category (Kategori)

**Response:** `{ data: CategoryTreeNode[] }` (tree) veya `{ data: CategoryFlat[] }` (?flat=true)

```typescript
interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  depth: number               // 0 = root
  productCount: number
  imageUrl: string | null
  children: CategoryTreeNode[]
}

interface CategoryFlat {
  id: string
  name: string
  slug: string
  parentId: string | null
  depth: number
  productCount: number
  imageUrl: string | null
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
2. POST /api/auth/callback/credentials (NextAuth flow)
3. Başarılı → Set-Cookie header ile JWT session token gelir
4. Cookie AsyncStorage'a kaydedilir (persist)
5. GET /api/account/profile ile kullanıcı bilgileri alınır → Zustand store'a yazılır
6. Ana sayfaya yönlendirilir

Hata durumları:
- 401: Geçersiz bayi kodu veya şifre
- 403: Hesap henüz onaylanmamış (PENDING/REJECTED/SUSPENDED)
- 500: Sunucu hatası
```

### 6.2 Token Yönetimi

```typescript
// NextAuth session token saklama (Set-Cookie header'dan alınır)
AsyncStorage.setItem("session_token", token)

// Her API isteğinde cookie olarak gönder
headers: {
  Cookie: `next-auth.session-token=${token}`
}

// Alternatif: React Native fetch cookie jar kullanımı
// iOS: otomatik cookie yönetimi
// Android: @react-native-community/cookies ile yönetim

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

### 12.2 Auth: Cookie-based

Mevcut API'ler NextAuth cookie-based auth kullanıyor. React Native fetch API cookies destekler, bu yüzden ek değişiklik gerekmez. Login sonrası `Set-Cookie` header'ı otomatik saklanır.

### 12.3 CORS

Mobil uygulamadan gelen istekler için CORS header'ları eklenebilir. `next.config.ts`'te `nexadepo.com` zaten allowlist'te.

### 12.4 Eklenmesi Gereken Endpoint'ler

| Endpoint | Açıklama | Durum |
|----------|----------|-------|
| `GET /api/dealer/quotes` | Bayi teklif listesi | YENİ (sadece admin'de mevcut) |
| `GET /api/dealer/quotes/[id]` | Bayi teklif detay | YENİ |
| `GET /api/dealer/notifications` | Bayi bildirimleri | YENİ |
| `PATCH /api/dealer/notifications/[id]` | Bildirim okundu | YENİ |
| `POST /api/devices/register` | Push token kayıt | YENİ |

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
- **Package:** `com.nexadepo.bayi`
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 35

### iOS (App Store)
- **Bundle ID:** `com.nexadepo.bayi`
- **Min iOS:** 15.0
- **Target iOS:** 18.0

### Store Listing
- **Uygulama Adı:** NexaDepo Bayi
- **Kategori:** İş / B2B
- **Dil:** Türkçe
- **Yaş:** 4+

---

*Bu doküman nexadepo.com production kod tabanından üretilmiştir. Tüm API endpoint'leri, veri modelleri ve iş mantığı web uygulamasından doğrudan alınmıştır.*
