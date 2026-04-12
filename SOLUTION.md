# Next.js Site Çözüm Planı

## Sorun
- Internal Server Error
- Sayfa yüklenmiyor
- Kategoriler ve ürünler görünmüyor

## Kök Neden
1. **Çakışan sayfa yolları**: `/(dealer)/markalar` ve `/(public)/markalar` aynı path'e çözülüyor
2. **Next.js build dosyaları eksik**: .next silinmiş ama build tamamlanamıyor
3. **Browser cache**: Eski içerik cache'den geliyor

## Çözüm Adımları

### 1. Çakışan Klasörleri Sil
```bash
rm -rf src/app/(public)/markalar
rm -rf src/app/(public)/iletisim
```

### 2. Next.js Cache'ini Temizle
```bash
rm -rf .next
```

### 3. Server'ı Yeniden Başlat
```bash
cd /home/talgabrk/projects/next-ai-teknoloji
npm run dev
```

### 4. Tarayıcı Cache'ini Temizle
- **Ctrl + Shift + Delete**
- "Cached images and files" seç
- Clear data

### 5. Sayfayı Yenile
- **Ctrl + Shift + R** (Zorla yenile)

## API Endpoint Düzeltmesi

Dosya: `src/app/(public)/page.tsx`

**Eski (Yanlış):**
```typescript
const categoryRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/categories/tree`, {
```

**Yeni (Doğru):**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const categoryRes = await fetch(`${baseUrl}/api/public/categories`, {
```

## Data Mapping Düzeltmesi

API'den gelen `productCount` alanı frontend'in beklediği `_count.products` formatına çevrilmeli:

```typescript
const categories: CategoryNode[] = (categoryData.data ?? []).slice(0, 8).map((cat: any) => ({
  ...cat,
  _count: { products: cat.productCount },
  children: cat.children?.map((child: any) => ({
    ...child,
    _count: { products: child.productCount },
    children: [],
  })) ?? [],
}))
```

## Sonuç
✅ Site orijinal haline döndü
✅ Çakışma çözüldü
✅ API endpoint düzeltildi
✅ Data mapping eklendi
