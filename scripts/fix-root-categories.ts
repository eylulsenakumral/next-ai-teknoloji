/**
 * Yanlış Root Kategorileri Düzeltme Scripti
 *
 * Hatalı root (depth=0) kategorileri doğru parent'larının altına taşır.
 * Her taşınan kategorinin depth ve path değerlerini günceller.
 * Alt kategoriler de (subtree) birlikte taşınır.
 *
 * Kullanım:
 *   npx tsx scripts/fix-root-categories.ts            ← dry-run (varsayılan)
 *   npx tsx scripts/fix-root-categories.ts --execute  ← gerçek çalıştırma
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import fs from "fs"
import path from "path"

// ============================================================================
// DB BAĞLANTISI (proje standardı)
// ============================================================================

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ============================================================================
// CLI BAYRAKLARI
// ============================================================================

const EXECUTE = process.argv.includes("--execute")
const DRY_RUN = !EXECUTE

// ============================================================================
// TAŞIMA HARİTASI
// Anahtar: yanlış root kategori slug'ı
// Değer:   doğru parent kategori slug'ı (ya da "keep-as-root-inactive")
// ============================================================================

interface MoveRule {
  wrongSlug: string
  correctParentSlug: string | "keep-as-root-inactive"
  aciklama: string
}

const TAŞIMA_KURALLARI: MoveRule[] = [
  // --- CCTV altına alınacak markalar ---
  { wrongSlug: "dahua",               correctParentSlug: "cctv",                    aciklama: "Marka adı → CCTV altına" },
  { wrongSlug: "tiandy",              correctParentSlug: "cctv",                    aciklama: "Marka adı → CCTV altına" },
  { wrongSlug: "cnb",                 correctParentSlug: "cctv",                    aciklama: "Marka adı → CCTV altına" },
  { wrongSlug: "hikvision",           correctParentSlug: "cctv",                    aciklama: "Marka adı → CCTV altına" },

  // --- CCTV altına alınacak alt kategoriler ---
  { wrongSlug: "hdcvi-kamera",        correctParentSlug: "cctv",                    aciklama: "Alt kategori → CCTV altına" },
  { wrongSlug: "hdcvi-urunler",       correctParentSlug: "cctv",                    aciklama: "Alt kategori → CCTV altına" },
  { wrongSlug: "ip-urunler",          correctParentSlug: "cctv",                    aciklama: "Alt kategori → CCTV altına" },
  { wrongSlug: "ex-proof-ve-anti-korozyon", correctParentSlug: "cctv",             aciklama: "Alt kategori → CCTV altına" },
  { wrongSlug: "goruntuleme-ve-kontrol",    correctParentSlug: "cctv",             aciklama: "Alt kategori → CCTV altına" },
  { wrongSlug: "trafik-cozumleri",    correctParentSlug: "cctv",                    aciklama: "Alt kategori → CCTV altına" },
  { wrongSlug: "mobil-urunler",       correctParentSlug: "cctv",                    aciklama: "Alt kategori → CCTV altına" },
  { wrongSlug: "lazer-termal-urunler",correctParentSlug: "cctv",                    aciklama: "Alt kategori → CCTV altına" },

  // --- CCTV altına alınacak özellik değerleri (megapixel) ---
  { wrongSlug: "12-megapixel",        correctParentSlug: "cctv",                    aciklama: "Özellik değeri → CCTV altına" },
  { wrongSlug: "2-megapixel",         correctParentSlug: "cctv",                    aciklama: "Özellik değeri → CCTV altına" },
  { wrongSlug: "3-megapiksel",        correctParentSlug: "cctv",                    aciklama: "Özellik değeri → CCTV altına" },
  { wrongSlug: "4-megapixel",         correctParentSlug: "cctv",                    aciklama: "Özellik değeri → CCTV altına" },
  { wrongSlug: "4k-serisi",           correctParentSlug: "cctv",                    aciklama: "Özellik değeri → CCTV altına" },
  { wrongSlug: "5-megapixel",         correctParentSlug: "cctv",                    aciklama: "Özellik değeri → CCTV altına" },
  { wrongSlug: "8-megapixel",         correctParentSlug: "cctv",                    aciklama: "Özellik değeri → CCTV altına" },

  // --- Geçiş Kontrol & Alarm altına alınacaklar ---
  { wrongSlug: "vth",                 correctParentSlug: "gecis-kontrol-alarm",     aciklama: "Dahua VTH kapı telefonu → Geçiş Kontrol altına" },
  { wrongSlug: "acik-i-stasyon",      correctParentSlug: "gecis-kontrol-alarm",     aciklama: "Açık istasyon → Geçiş Kontrol altına" },
  { wrongSlug: "eaton-yangin",        correctParentSlug: "gecis-kontrol-alarm",     aciklama: "Yangın alarm → Geçiş Kontrol altına" },

  // --- Network & Fiber altına alınacaklar ---
  { wrongSlug: "fiber-optik-sistemler", correctParentSlug: "network-fiber",         aciklama: "Alt kategori → Network & Fiber altına" },
  { wrongSlug: "access-switchler",    correctParentSlug: "network-fiber",           aciklama: "Alt kategori → Network & Fiber altına" },
  { wrongSlug: "transmisyon",         correctParentSlug: "network-fiber",           aciklama: "Alt kategori → Network & Fiber altına" },

  // --- Bilgisayar & Sunucu altına alınacaklar ---
  { wrongSlug: "monitor-ve-videowall",correctParentSlug: "bilgisayar-sunucu",       aciklama: "Alt kategori → Bilgisayar & Sunucu altına" },

  // --- Çevre Birimleri & Aksesuar altına alınacaklar ---
  { wrongSlug: "akilli-ev-otomasyon", correctParentSlug: "cevre-birimleri-aksesuar", aciklama: "Alt kategori → Çevre Birimleri altına" },

  // --- Diğer Ürünler altına alınacaklar ---
  { wrongSlug: "covid-19-tespit-urunleri", correctParentSlug: "diger-urunler",     aciklama: "Geçici kategori → Diğer Ürünler altına" },

  // --- Root'ta kalsın ama pasif yapılsın ---
  { wrongSlug: "diger-urunler",       correctParentSlug: "keep-as-root-inactive",   aciklama: "Tampon kategori → root'ta kalır, pasif işaretlenir" },
]

// ============================================================================
// ÜRÜN EŞLEME VERİSİ
// ============================================================================

interface UrunEslesme {
  productId: string
  productName: string
  fromCategory: string
  toCategory: string
  toCategorySlug: string
  confidence: string
  reason: string
}

function eslesmeVerisiniYukle(): UrunEslesme[] {
  const dosyaYolu = path.join(__dirname, "..", "data", "category-reassignment.json")
  const ham = fs.readFileSync(dosyaYolu, "utf-8")
  const veri = JSON.parse(ham)
  return veri.matched as UrunEslesme[]
}

// ============================================================================
// YARDIMCI TİPLER
// ============================================================================

interface KategoriKayit {
  id: string
  parentId: string | null
  name: string
  slug: string
  depth: number
  path: string | null
  isActive: boolean
}

interface TasimaIslemi {
  kural: MoveRule
  yanliKategori: KategoriKayit
  dogruParent: KategoriKayit | null
  altKategoriler: KategoriKayit[]
  etkilenenUrunSayisi: number
}

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

/**
 * Bir kategorinin tüm alt kategorilerini (torunlarını) recursive olarak getirir.
 */
async function altKategorilerGetir(
  kategoriler: KategoriKayit[],
  parentId: string,
): Promise<KategoriKayit[]> {
  const dogrudan = kategoriler.filter((k) => k.parentId === parentId)
  const sonuc: KategoriKayit[] = [...dogrudan]

  for (const child of dogrudan) {
    const torunlar = await altKategorilerGetir(kategoriler, child.id)
    sonuc.push(...torunlar)
  }

  return sonuc
}

/**
 * Yeni path hesaplar. Parent path varsa "parentPath/slug", yoksa sadece "slug".
 */
function yeniPathHesapla(parentPath: string | null, slug: string): string {
  if (parentPath) return `${parentPath}/${slug}`
  return slug
}

/**
 * Subtree için yeni path'leri hesaplar (parent path değişince tüm torunlar güncellenir).
 */
function subtreeYeniPathHesapla(
  node: KategoriKayit,
  tumKategoriler: KategoriKayit[],
  yeniParentPath: string,
  yeniDepth: number,
): Array<{ id: string; yeniPath: string; yeniDepth: number }> {
  const guncellemeler: Array<{ id: string; yeniPath: string; yeniDepth: number }> = []

  const yeniPath = yeniPathHesapla(yeniParentPath, node.slug)
  guncellemeler.push({ id: node.id, yeniPath, yeniDepth })

  const children = tumKategoriler.filter((k) => k.parentId === node.id)
  for (const child of children) {
    const childGuncellemeler = subtreeYeniPathHesapla(
      child,
      tumKategoriler,
      yeniPath,
      yeniDepth + 1,
    )
    guncellemeler.push(...childGuncellemeler)
  }

  return guncellemeler
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const baslangic = Date.now()

  console.log("=".repeat(70))
  console.log("  KATEGORİ HİYERARŞİ DÜZELTME SCRİPTİ")
  console.log("=".repeat(70))
  console.log(`  Mod: ${DRY_RUN ? "DRY-RUN (değişiklik YOK)" : "GERÇEK ÇALIŞTIRMA"}`)
  console.log(`  Kural sayısı: ${TAŞIMA_KURALLARI.length}`)
  console.log("=".repeat(70))
  console.log()

  // --------------------------------------------------------------------------
  // FAZE 0: Tüm kategorileri belleğe yükle
  // --------------------------------------------------------------------------
  console.log("[FAZE 0] Tüm kategoriler yükleniyor...")

  const tumKategoriler = await prisma.category.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
      depth: true,
      path: true,
      isActive: true,
    },
    orderBy: { depth: "asc" },
  }) as KategoriKayit[]

  const slugMap = new Map<string, KategoriKayit>()
  for (const kat of tumKategoriler) {
    slugMap.set(kat.slug, kat)
  }

  const mevcutRootlar = tumKategoriler.filter((k) => k.parentId === null)
  console.log(`  Toplam aktif kategori: ${tumKategoriler.length}`)
  console.log(`  Root (depth=0) kategori: ${mevcutRootlar.length}`)
  console.log()

  // --------------------------------------------------------------------------
  // FAZE 1: Analiz — her kural için taşıma işlemini hazırla
  // --------------------------------------------------------------------------
  console.log("[FAZE 1] Taşıma işlemleri analiz ediliyor...")
  console.log()

  const tasimaIslemleri: TasimaIslemi[] = []
  const uyarilar: string[] = []

  for (const kural of TAŞIMA_KURALLARI) {
    const yanliKat = slugMap.get(kural.wrongSlug)

    if (!yanliKat) {
      uyarilar.push(`  UYARI: "${kural.wrongSlug}" slug'lı kategori bulunamadı — atlanıyor`)
      continue
    }

    // Zaten root değilse (parentId varsa) uyar
    if (yanliKat.parentId !== null) {
      uyarilar.push(
        `  UYARI: "${kural.wrongSlug}" zaten root değil (parentId=${yanliKat.parentId}) — atlanıyor`,
      )
      continue
    }

    // "keep-as-root-inactive" kuralı için parent yok
    let dogruParent: KategoriKayit | null = null
    if (kural.correctParentSlug !== "keep-as-root-inactive") {
      dogruParent = slugMap.get(kural.correctParentSlug) ?? null

      if (!dogruParent) {
        uyarilar.push(
          `  UYARI: Doğru parent "${kural.correctParentSlug}" bulunamadı — "${kural.wrongSlug}" atlanıyor`,
        )
        continue
      }

      // Döngüsel bağımlılık kontrolü: taşınacak kategori hedef parent'ın atasıysa geçersiz
      let kontrol: KategoriKayit | undefined = dogruParent
      let donguselBulundu = false
      while (kontrol) {
        if (kontrol.id === yanliKat.id) {
          uyarilar.push(
            `  HATA: "${kural.wrongSlug}" → "${kural.correctParentSlug}" döngüsel bağımlılık! Atlanıyor`,
          )
          donguselBulundu = true
          break
        }
        kontrol = kontrol.parentId ? slugMap.get(
          [...slugMap.values()].find((k) => k.id === kontrol!.parentId)?.slug ?? "",
        ) : undefined
      }
      if (donguselBulundu) continue
    }

    // Bu kategorinin doğrudan alt kategorileri
    const altKategoriler = await altKategorilerGetir(tumKategoriler, yanliKat.id)

    // Etkilenen ürün sayısı (bu kategori + tüm torunları)
    const etkilenenKatIdleri = [yanliKat.id, ...altKategoriler.map((k) => k.id)]
    const etkilenenUrunSayisi = await prisma.product.count({
      where: {
        deletedAt: null,
        categoryId: { in: etkilenenKatIdleri },
      },
    })

    tasimaIslemleri.push({
      kural,
      yanliKategori: yanliKat,
      dogruParent,
      altKategoriler,
      etkilenenUrunSayisi,
    })

    // Konsola taşıma planını yazdır
    const hedefAdi =
      kural.correctParentSlug === "keep-as-root-inactive"
        ? "(root'ta kal, pasif)"
        : `→ ${dogruParent!.name} (${dogruParent!.slug})`

    console.log(`  [${tasimaIslemleri.length}] ${yanliKat.name} (${yanliKat.slug})`)
    console.log(`       ${kural.aciklama}`)
    console.log(`       Hedef: ${hedefAdi}`)
    console.log(`       Alt kategori: ${altKategoriler.length} adet`)
    console.log(`       Etkilenen ürün: ${etkilenenUrunSayisi} adet`)
    console.log()
  }

  if (uyarilar.length > 0) {
    console.log("--- UYARILAR ---")
    for (const uyari of uyarilar) console.log(uyari)
    console.log()
  }

  // --------------------------------------------------------------------------
  // FAZE 2: Özet — değiştirilecek rakamlar
  // --------------------------------------------------------------------------
  const toplamTasinanKat = tasimaIslemleri.length
  const toplamAltKat = tasimaIslemleri.reduce((t, i) => t + i.altKategoriler.length, 0)
  const toplamEtkilenenUrun = tasimaIslemleri.reduce((t, i) => t + i.etkilenenUrunSayisi, 0)

  console.log("=".repeat(70))
  console.log("  TAŞİMA PLANI ÖZETİ")
  console.log("=".repeat(70))
  console.log(`  Taşınacak root kategori:  ${toplamTasinanKat}`)
  console.log(`  Birlikte taşınan alt kat: ${toplamAltKat}`)
  console.log(`  Etkilenecek ürün:         ${toplamEtkilenenUrun}`)
  console.log(`  Atlanılan kural:          ${TAŞIMA_KURALLARI.length - toplamTasinanKat}`)
  console.log("=".repeat(70))
  console.log()

  // --------------------------------------------------------------------------
  // FAZE 2.5: Ürün eşleme verisini yükle ve analiz et
  // --------------------------------------------------------------------------
  console.log("[FAZE 2.5] Ürün eşleme verisi yükleniyor...")

  const urunEslesmeleri = eslesmeVerisiniYukle()
  console.log(`  Eşleşen ürün sayısı: ${urunEslesmeleri.length}`)

  // Eşleşen slug'ları doğrula
  const slugSet = new Set(slugMap.keys())
  const gecersizSluglar = new Set<string>()
  for (const es of urunEslesmeleri) {
    if (!slugSet.has(es.toCategorySlug)) {
      gecersizSluglar.add(es.toCategorySlug)
    }
  }
  if (gecersizSluglar.size > 0) {
    console.log(`  UYARI: ${gecersizSluglar.size} geçersiz hedef slug bulundu:`)
    for (const s of gecersizSluglar) console.log(`    - ${s}`)
  }

  // Confidence dağılımı
  const confidenceDagilimi = new Map<string, number>()
  for (const es of urunEslesmeleri) {
    confidenceDagilimi.set(es.confidence, (confidenceDagilimi.get(es.confidence) ?? 0) + 1)
  }
  console.log("  Confidence dağılımı:")
  for (const [conf, sayi] of confidenceDagilimi) {
    console.log(`    ${conf}: ${sayi}`)
  }

  // Hedef kategori dağılımı (top 10)
  const hedefDagilimi = new Map<string, number>()
  for (const es of urunEslesmeleri) {
    hedefDagilimi.set(es.toCategorySlug, (hedefDagilimi.get(es.toCategorySlug) ?? 0) + 1)
  }
  const topHedefler = [...hedefDagilimi.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  console.log("  En çok atanan hedef kategoriler (top 10):")
  for (const [slug, sayi] of topHedefler) {
    const kat = slugMap.get(slug)
    console.log(`    ${kat?.name ?? slug}: ${sayi} ürün`)
  }
  console.log()

  if (DRY_RUN) {
    console.log("  DRY-RUN modu: Veritabanına HİÇBİR ŞEYE YAZILMADI.")
    console.log("  Çalıştırmak için: npx tsx scripts/fix-root-categories.ts --execute")
    console.log()

    // Mevcut root sayısını hesapla
    const mevcutRootSayisi = mevcutRootlar.length
    const yeniRootSayisi =
      mevcutRootSayisi -
      tasimaIslemleri.filter((i) => i.kural.correctParentSlug !== "keep-as-root-inactive").length
    console.log(`  Mevcut root sayısı:  ${mevcutRootSayisi}`)
    console.log(`  İşlem sonrası beklenen root: ${yeniRootSayisi}`)
    console.log(`  Taşınacak ürün:     ${urunEslesmeleri.length}`)
    console.log()

    await prisma.$disconnect()
    await pool.end()
    return
  }

  // --------------------------------------------------------------------------
  // FAZE 3: Transaction içinde tüm taşımaları uygula
  // --------------------------------------------------------------------------
  console.log("[FAZE 3] Taşıma işlemleri uygulanıyor...")
  console.log()

  let toplamGuncellenenKat = 0
  let toplamGuncellenenUrun = 0

  try {
    await prisma.$transaction(async (tx) => {
      for (const islem of tasimaIslemleri) {
        const { kural, yanliKategori, dogruParent, altKategoriler } = islem

        // -- keep-as-root-inactive: sadece pasif işaretle, taşıma
        if (kural.correctParentSlug === "keep-as-root-inactive") {
          console.log(`  [pasif] ${yanliKategori.name} pasif yapılıyor...`)
          await tx.category.update({
            where: { id: yanliKategori.id },
            data: { isActive: false },
          })
          toplamGuncellenenKat++
          continue
        }

        // -- Normal taşıma: parentId, depth, path güncelle
        const yeniDepth = dogruParent!.depth + 1
        const yeniPath = yeniPathHesapla(dogruParent!.path, yanliKategori.slug)

        console.log(
          `  [taşı] ${yanliKategori.name} → ${dogruParent!.name} altına (depth: 0 → ${yeniDepth})`,
        )

        // Kategorinin kendisini güncelle
        await tx.category.update({
          where: { id: yanliKategori.id },
          data: {
            parentId: dogruParent!.id,
            depth: yeniDepth,
            path: yeniPath,
          },
        })
        toplamGuncellenenKat++

        // Alt kategorilerin depth ve path değerlerini güncelle (subtree)
        if (altKategoriler.length > 0) {
          const subtreeGuncellemeleri = subtreeYeniPathHesapla(
            yanliKategori,
            [...tumKategoriler, ...altKategoriler],
            dogruParent!.path ?? dogruParent!.slug,
            yeniDepth,
          )

          // Kendisini zaten yukarıda güncelledik, torunları güncelle
          const torunGuncellemeleri = subtreeGuncellemeleri.filter(
            (g) => g.id !== yanliKategori.id,
          )

          for (const guncelleme of torunGuncellemeleri) {
            await tx.category.update({
              where: { id: guncelleme.id },
              data: {
                depth: guncelleme.yeniDepth,
                path: guncelleme.yeniPath,
              },
            })
            toplamGuncellenenKat++
          }

          if (torunGuncellemeleri.length > 0) {
            console.log(
              `         ${torunGuncellemeleri.length} alt kategori güncellendi`,
            )
          }
        }
      }

      // ====================================================================
      // FAZE 3.5: Ürünleri doğru kategorilere taşı
      // ====================================================================
      console.log()
      console.log("  [FAZE 3.5] Ürünler doğru kategorilere taşınıyor...")

      let urunGuncellemeSayaci = 0
      const BATCH_SIZE = 50

      // Hedef slug → id haritası
      const hedefSlugIdMap = new Map<string, string>()
      for (const es of urunEslesmeleri) {
        if (!hedefSlugIdMap.has(es.toCategorySlug)) {
          const kat = slugMap.get(es.toCategorySlug)
          if (kat) hedefSlugIdMap.set(es.toCategorySlug, kat.id)
        }
      }

      // Toplu güncelleme (aynı hedef kategoriye giden ürünleri grupla)
      const slugGruplari = new Map<string, string[]>()
      for (const es of urunEslesmeleri) {
        const katId = hedefSlugIdMap.get(es.toCategorySlug)
        if (!katId) {
          console.log(`    UYARI: "${es.productName}" → "${es.toCategorySlug}" slug bulunamadı, atlanıyor`)
          continue
        }
        if (!slugGruplari.has(katId)) slugGruplari.set(katId, [])
        slugGruplari.get(katId)!.push(es.productId)
      }

      for (const [hedefKatId, urunIdleri] of slugGruplari) {
        // Her ürünü tek tek güncelle (doğruluk için)
        for (let i = 0; i < urunIdleri.length; i += BATCH_SIZE) {
          const batch = urunIdleri.slice(i, i + BATCH_SIZE)
          const sonuc = await tx.product.updateMany({
            where: { id: { in: batch }, deletedAt: null },
            data: { categoryId: hedefKatId },
          })
          urunGuncellemeSayaci += sonuc.count
        }
        const hedefSlug = [...hedefSlugIdMap.entries()].find(([, id]) => id === hedefKatId)?.[0] ?? hedefKatId
        console.log(`    ${urunIdleri.length} ürün → ${hedefSlug} (${urunGuncellemeSayaci}/${urunEslesmeleri.length})`)
      }

      console.log(`  Toplam taşınan ürün: ${urunGuncellemeSayaci}`)
      toplamGuncellenenUrun = urunGuncellemeSayaci
    })

    console.log()
    console.log("  Transaction başarıyla tamamlandı.")
  } catch (hata) {
    console.error()
    console.error("  [HATA] Transaction başarısız:", hata instanceof Error ? hata.message : hata)
    console.error("  Hiçbir değişiklik uygulanmadı (rollback).")
    process.exit(1)
  }

  // --------------------------------------------------------------------------
  // FAZE 4: Boş kategorileri temizle
  // --------------------------------------------------------------------------
  console.log()
  console.log("[FAZE 4] Boş kategoriler kontrol ediliyor...")

  // Eski yanlış root kategorilerinde ürün kaldı mı kontrol et
  for (const islem of tasimaIslemleri) {
    if (islem.kural.correctParentSlug === "keep-as-root-inactive") continue

    const etkilenenKatIdleri = [
      islem.yanliKategori.id,
      ...islem.altKategoriler.map((k) => k.id),
    ]

    const kalanUrun = await prisma.product.count({
      where: {
        deletedAt: null,
        categoryId: { in: etkilenenKatIdleri },
      },
    })

    if (kalanUrun > 0) {
      console.log(`  UYARI: "${islem.yanliKategori.name}" içinde hala ${kalanUrun} ürün var`)
    }
  }

  // --------------------------------------------------------------------------
  // FAZE 5: Yeni root kategori sayısını hesapla
  // --------------------------------------------------------------------------
  console.log()
  console.log("[FAZE 5] Yeni durum hesaplanıyor...")

  const yeniRootSayisi = await prisma.category.count({
    where: {
      deletedAt: null,
      parentId: null,
    },
  })

  const eskiRootSayisi = mevcutRootlar.length

  // --------------------------------------------------------------------------
  // SONUÇ RAPORU
  // --------------------------------------------------------------------------
  const sure = ((Date.now() - baslangic) / 1000).toFixed(1)

  console.log()
  console.log("=".repeat(70))
  console.log("  SONUÇ RAPORU")
  console.log("=".repeat(70))
  console.log(`  Mod:                      GERÇEK ÇALIŞTIRMA`)
  console.log(`  Süre:                     ${sure}s`)
  console.log(`  Güncellenen kategori:     ${toplamGuncellenenKat}`)
  console.log(`  Etkilenen ürün:           ${toplamGuncellenenUrun}`)
  console.log(`  Önceki root sayısı:       ${eskiRootSayisi}`)
  console.log(`  Yeni root sayısı:         ${yeniRootSayisi}`)
  console.log(`  Kaldırılan hatalı root:   ${eskiRootSayisi - yeniRootSayisi}`)
  console.log("=".repeat(70))
  console.log()
  console.log("  Kategori hiyerarşisi başarıyla duzeltildi.")
}

// ============================================================================
// ÇALIŞTIR
// ============================================================================

main()
  .catch((hata) => {
    console.error("\n[KRİTİK HATA]", hata)
    process.exit(1)
  })
  .finally(async () => {
    // Prisma adapter'ı kapandığında pool'u da kapatır; direkt pool.end() gerekmiyor.
    await prisma.$disconnect()
  })
