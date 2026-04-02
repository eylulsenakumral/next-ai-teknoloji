/**
 * Kategori Ağacı Migration Script v2
 *
 * 1. Eski kategorileri sil (soft-delete → hard-delete)
 * 2. Yeni kategori ağacını oluştur (5 seviye derinlik)
 * 3. Supplier-category mapping ile ürünleri doğru kategorilere ata
 *
 * Kullanım:
 *   npx tsx scripts/migrate-categories-v2.ts --dry-run     # Önizleme
 *   npx tsx scripts/migrate-categories-v2.ts --execute      # Gerçek çalıştırma
 */
import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";
import path from "path";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface CategoryNode {
  name: string;
  slug: string;
  children?: CategoryNode[];
}

interface TreeFile {
  tree: CategoryNode[];
}

interface SupplierMapping {
  supplierCode: string;
  mappings: {
    supplierCategory: string;
    supplierSubCategory?: string;
    targetCategorySlug: string;
  }[];
}

// ---------------------------------------------------------------------------
// 1. Yeni kategori ağacını oku
// ---------------------------------------------------------------------------
function loadCategoryTree(): TreeFile {
  const filePath = path.join(__dirname, "..", "data", "category-tree-v2.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as TreeFile;
}

// ---------------------------------------------------------------------------
// 2. Supplier mapping oku (mevcut format: { supplierCode: { key: slug } })
// ---------------------------------------------------------------------------
function loadSupplierMappings(): Record<string, string> {
  const filePath = path.join(
    __dirname,
    "..",
    "data",
    "supplier-category-mapping.json",
  );
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as Record<string, Record<string, string>>;

  const map: Record<string, string> = {};
  for (const [supplierCode, mappings] of Object.entries(data)) {
    if (supplierCode.startsWith("_")) continue; // _meta skip
    for (const [categoryKey, targetSlug] of Object.entries(mappings)) {
      if (categoryKey.startsWith("_")) continue; // _field, _separator skip
      const key = `${supplierCode}::${categoryKey}`.toLowerCase();
      map[key] = targetSlug;
    }
  }
  return map;
}

// Eski slug → yeni slug mapping (eski mapping dosyası eski slug'ları kullanıyor)
const OLD_TO_NEW_SLUG: Record<string, string> = {
  // Bilgisayar
  "bilgisayar-sunucu-masaustu-bilgisayar": "masaustu-pc",
  "bilgisayar-sunucu-notebook": "notebook",
  "bilgisayar-sunucu-all-in-one": "all-in-one",
  "bilgisayar-sunucu-mini-pc": "mini-pc",
  "bilgisayar-sunucu-is-istasyonu": "is-istasyonu",
  "bilgisayar-sunucu-monitor": "monitor",
  "sunucu-server-aksesuarlari": "sunucu-aksesuarlari",
  "bilgisayar-sunucu-sunucu": "rack-sunucu",
  // PC Bileşenleri
  "pc-bilesenleri-islemci": "islemci",
  "pc-bilesenleri-islemci-intel": "intel-islemci",
  "pc-bilesenleri-islemci-amd": "amd-islemci",
  "pc-bilesenleri-anakart": "anakart",
  "pc-bilesenleri-ekran-karti": "ekran-karti",
  "pc-bilesenleri-bellek-ram": "bellek-ram",
  "pc-bilesenleri-bellek-ram-masaustu": "masaustu-ram",
  "pc-bilesenleri-bellek-ram-notebook": "notebook-ram",
  "pc-bilesenleri-bellek-ram-sunucu": "sunucu-ram",
  "depolama-ssd": "ssd",
  "depolama-nvme-m2": "nvme-m2",
  "depolama-hdd-masaustu": "hdd",
  "depolama-hdd": "hdd",
  "depolama-tasinabilir-disk": "tasinabilir-disk",
  "depolama-hafiza-karti": "hafiza-karti",
  "depolama-usb-bellek": "usb-bellek",
  "pc-bilesenleri-kasa": "kasa",
  "pc-bilesenleri-guc-kaynagi": "guc-kaynagi",
  "pc-bilesenleri-sogutma": "sogutma",
  // Güvenlik & CCTV
  "cctv-ip-kameralar": "ip-kameralar",
  "cctv-ip-kameralar-bullet": "ip-bullet-kamera",
  "cctv-ip-kameralar-dome": "ip-dome-kamera",
  "cctv-ip-kameralar-ptz": "ip-ptz-kamera",
  "cctv-ip-kameralar-fisheye": "ip-fisheye-kamera",
  "cctv-analog-kameralar": "analog-kameralar",
  "cctv-analog-kameralar-ahd": "ahd-kamera",
  "cctv-analog-kameralar-hdcvi": "hdcvi-kamera",
  "cctv-kayit-cihazlari-nvr": "nvr",
  "cctv-kayit-cihazlari-dvr": "dvr",
  "cctv-kayit-cihazlari-xvr": "xvr",
  "cctv-termal-kameralar": "termal-kameralar",
  "cctv-aksesuarlari": "cctv-aksesuarlari",
  "cctv-aksesuarlari-kamera": "kamera-aksesuarlari",
  "cctv-aksesuarlari-guc": "cctv-guc-kaynaklari",
  "cctv-aksesuarlari-kablo": "cctv-kablolari",
  // Geçiş Kontrol
  "gecis-kontrol-kart-okuyucu": "kart-okuyucu",
  "gecis-kontrol-biyometrik": "biyometrik-okuyucu",
  "gecis-kontrol-kapi-istasyonu": "kapi-istasyonu",
  "alarm-hirsiz-panel": "alarm-paneli",
  "alarm-hirsiz-dedektor": "dedektor",
  "alarm-hirsiz-siren": "siren-flasor",
  "alarm-yangin": "yangin-alarm",
  "gecis-kontrol-intercom": "intercom",
  // Network
  "network-switch-poe": "poe-switch",
  "network-switch-yonetilebilir": "yonetilebilir-switch",
  "network-switch-yonetilemez": "yonetilemez-switch",
  "network-kablosuz-ap": "access-point",
  "network-kablosuz-router": "router",
  "network-fiber": "fiber-optik",
  "network-fiber-sfp": "sfp-modul",
  "network-fiber-mc": "media-converter",
  "network-yapisal-kablolama": "yapisal-kablolama",
  "network-guvenlik-firewall": "firewall",
  "network-kabin": "network-kabin",
  "network-modem": "modem",
  // Yazıcı
  "yazici-tarayici-lazer-yazici": "lazer-yazici",
  "yazici-tarayici-inkjet": "murekkep-puskurtmeli",
  "yazici-tarayici-barkod": "barkod-etiket-yazici",
  "yazici-tarayici-termal": "termal-fis-yazici",
  "yazici-tarayici-tarayici": "tarayici",
  "yazici-tarayici-sarf-toner": "toner",
  "yazici-tarayici-sarf-kartus": "kartus",
  // POS
  "pos-barkod-terminal": "pos-terminal",
  "pos-barkod-okuyucu": "barkod-okuyucu",
  "pos-barkod-el-terminali": "el-terminali",
  // UPS
  "guc-ups": "ups",
  "guc-aku": "aku-pil",
  "guc-sarj": "sarj-cihazi",
  "guc-priz": "priz-uzatma",
  // Kablo
  "kablo-hdmi": "hdmi-kablo",
  "kablo-dp": "displayport-kablo",
  "kablo-vga": "vga-kablo",
  "kablo-cevirici": "cevirici-adaptor",
  "kablo-usb": "usb-kablolari",
  // Çevre Birimleri
  "cevre-birimleri-aksesuar-klavye-mouse": "klavye-mouse",
  "cevre-birimleri-aksesuar-kulaklik-mikrofon": "kulaklik-mikrofon",
  "cevre-birimleri-aksesuar-hoparlor": "hoparlor-ses",
  "cevre-birimleri-aksesuar-webcam": "web-kamerasi",
  "cevre-birimleri-aksesuar-notebook-aksesuari": "notebook-aksesuari",
  // Yazılım
  "yazilim-lisans-isletim-sistemi": "isletim-sistemi",
  "yazilim-lisans-ofis": "ofis-yazilimlari",
  "yazilim-lisans-antivirus": "antivirus-guvenlik",
  "yazilim-lisans-vms": "vms-yazilimi",
};

// ---------------------------------------------------------------------------
// 3. Slug → category ID lookup oluştur
// ---------------------------------------------------------------------------
async function buildSlugToIdMap(): Promise<Record<string, string>> {
  const cats = await prisma.category.findMany({
    select: { id: true, slug: true },
  });
  const map: Record<string, string> = {};
  for (const c of cats) {
    map[c.slug] = c.id;
  }
  return map;
}

// ---------------------------------------------------------------------------
// 4. Recursively insert categories
// ---------------------------------------------------------------------------
async function insertCategoryTree(
  nodes: CategoryNode[],
  parentId: string | null,
  depth: number,
  dryRun: boolean,
): Promise<{ inserted: number; slugToId: Record<string, string> }> {
  let inserted = 0;
  const slugToId: Record<string, string> = {};

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (dryRun) {
      const indent = "  ".repeat(depth);
      console.log(
        `${indent}[DRY] ${node.name} (slug: ${node.slug}, depth: ${depth})`,
      );
      slugToId[node.slug] = `dry-${node.slug}`;
      inserted++;
    } else {
      const cat = await prisma.category.create({
        data: {
          name: node.name,
          slug: node.slug,
          parentId,
          depth,
          sortOrder: i,
          isActive: true,
        },
      });
      slugToId[node.slug] = cat.id;
      inserted++;
    }

    if (node.children && node.children.length > 0) {
      const childResult = await insertCategoryTree(
        node.children,
        dryRun ? `dry-${node.slug}` : slugToId[node.slug],
        depth + 1,
        dryRun,
      );
      inserted += childResult.inserted;
      Object.assign(slugToId, childResult.slugToId);
    }
  }

  return { inserted, slugToId };
}

// ---------------------------------------------------------------------------
// 5. Eski kategorileri temizle
// ---------------------------------------------------------------------------
async function cleanOldCategories(dryRun: boolean): Promise<number> {
  // Önce tüm ürünlerin categoryId'sini null yap
  if (!dryRun) {
    const productsUpdated = await prisma.product.updateMany({
      where: { deletedAt: null },
      data: { categoryId: null },
    });
    console.log(`[CLEAN] ${productsUpdated.count} ürünün categoryId null yapıldı`);
  } else {
    const count = await prisma.product.count({ where: { deletedAt: null } });
    console.log(`[DRY CLEAN] ${count} ürünün categoryId null yapılacak`);
  }

  // Eski kategorileri hard delete
  if (!dryRun) {
    // Önce children, sonra parent'lar (FK constraint)
    const allCats = await prisma.category.findMany({
      select: { id: true, depth: true },
      orderBy: { depth: "desc" },
    });
    let deleted = 0;
    for (const cat of allCats) {
      try {
        await prisma.category.delete({ where: { id: cat.id } });
        deleted++;
      } catch {
        // FK hatası olursa skip et
      }
    }
    // Kalan varsa force temizle
    const remaining = await prisma.category.count();
    if (remaining > 0) {
      await prisma.$executeRaw`DELETE FROM "Category"`;
      deleted += remaining;
    }
    console.log(`[CLEAN] ${deleted} eski kategori silindi`);
    return deleted;
  } else {
    const count = await prisma.category.count();
    console.log(`[DRY CLEAN] ${count} eski kategori silinecek`);
    return count;
  }
}

// ---------------------------------------------------------------------------
// 6. Ürünleri yeni kategorilere ata (supplier mapping ile)
// ---------------------------------------------------------------------------
async function reassignProducts(
  slugToId: Record<string, string>,
  dryRun: boolean,
): Promise<{ matched: number; unmatched: number; total: number }> {
  const supplierMap = loadSupplierMappings();

  // Tüm aktif ürünleri getir (rawData ile birlikte)
  type ProductRow = {
    id: string;
    name: string;
    supplierProducts: {
      supplier: { code: string };
      rawData: unknown;
    }[];
  };

  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      supplierProducts: {
        where: { deletedAt: null },
        select: {
          supplier: { select: { code: true } },
          rawData: true,
        },
        take: 1,
      },
    },
  });

  console.log(`\n[REASSIGN] ${products.length} ürün işlenecek...`);

  let matched = 0;
  let unmatched = 0;
  const unmatchedSamples: string[] = [];

  for (const product of products) {
    const sp = product.supplierProducts[0];
    if (!sp) {
      unmatched++;
      if (unmatchedSamples.length < 10) {
        unmatchedSamples.push(`${product.name} (supplier yok)`);
      }
      continue;
    }

    const supplierCode = sp.supplier.code;
    const rawData = sp.rawData as Record<string, unknown> | null;

    let categorySlug: string | null = null;

    // rawData'dan kategori bilgisi çıkar
    if (rawData) {
      const supplierCategory =
        (rawData.categoryName as string) ||
        (rawData.mainCategory as string) ||
        (rawData.Kategori as string) ||
        (rawData.category as string) ||
        "";
      const supplierSubCategory =
        (rawData.subCategoryName as string) ||
        (rawData.subCategory as string) ||
        (rawData.AltKategori as string) ||
        (rawData.groupName as string) ||
        "";

      // Mapping'de ara (çeşitli formatlar dene)
      const combined = [supplierCategory, supplierSubCategory].filter(Boolean).join(" > ");
      const key1 = `${supplierCode}::${combined}`.toLowerCase();
      const key2 = `${supplierCode}::${supplierCategory} > ${supplierSubCategory}`.toLowerCase();
      const key3 = `${supplierCode}::${supplierCategory} > `.toLowerCase();

      let mappedSlug = supplierMap[key1] || supplierMap[key2] || supplierMap[key3] || null;

      // Eski slug'ı yeni slug'a çevir
      if (mappedSlug && OLD_TO_NEW_SLUG[mappedSlug]) {
        mappedSlug = OLD_TO_NEW_SLUG[mappedSlug];
      }
      categorySlug = mappedSlug;
    }

    // Eşleşme bulunamadıysa ürün adından tahmin et
    if (!categorySlug) {
      categorySlug = guessCategoryFromName(product.name);
    }

    if (categorySlug && slugToId[categorySlug]) {
      matched++;
      if (!dryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: slugToId[categorySlug] },
        });
      }
    } else {
      unmatched++;
      if (unmatchedSamples.length < 20) {
        unmatchedSamples.push(
          `${product.name} [${supplierCode}] → "${categorySlug}" bulunamadı`,
        );
      }
    }
  }

  console.log(`\n[REASSIGN] Sonuçlar:`);
  console.log(`  Eşleşen: ${matched}`);
  console.log(`  Eşleşmeyen: ${unmatched}`);
  console.log(`  Toplam: ${products.length}`);
  console.log(
    `  Oran: %${((matched / products.length) * 100).toFixed(1)}`,
  );

  if (unmatchedSamples.length > 0) {
    console.log(`\n  Eşleşmeyen örnekler:`);
    for (const s of unmatchedSamples) {
      console.log(`    - ${s}`);
    }
  }

  return { matched, unmatched, total: products.length };
}

// ---------------------------------------------------------------------------
// 7. Ürün adından kategori tahmini (fallback)
// ---------------------------------------------------------------------------
function guessCategoryFromName(name: string): string | null {
  const n = name.toLowerCase();

  // Dahua/Hikvision model kodları (CCTV)
  // Dahua: IPC-HFW = bullet, IPC-HDBW = dome, IPC-HDW = turret, IPC-HFW = bullet
  // SD = PTZ, IPC-HDBW = dome, DH-HAC = analog, DH-XVR = xvr, DH-NVR = nvr
  if (/^ipc-hfw|^dh-ipc-hfw/i.test(n)) return "ip-bullet-kamera";
  if (/^ipc-hdbw|^dh-ipc-hdbw/i.test(n)) return "ip-dome-kamera";
  if (/^ipc-hdw|^dh-ipc-hdw/i.test(n)) return "ip-turret-kamera";
  if (/^ipc-ebw|^ipc-ew/i.test(n)) return "ip-dome-kamera";
  if (/^ipc-hfep|^ipc-f./i.test(n)) return "ip-fisheye-kamera";
  if (/^dh-sd|^sd\d|ptz/i.test(n)) return "ip-ptz-kamera";
  if (/^tp-|-tc-|-t[a-z]\d/i.test(n) && /dahua|okisan|hikvision/i.test(n)) return "cctv-aksesuarlari";
  if (/^p-|^pfa|^pfs|^pfb/i.test(n)) return "kamera-aksesuarlari";
  if (/^dh-hac|^hac-/i.test(n)) return "hdcvi-kamera";
  if (/^dh-xvr|^xvr/i.test(n)) return "xvr";
  if (/^dh-nvr|^nvr/i.test(n)) return "nvr";
  if (/^dh-dvr|^dvr/i.test(n)) return "dvr";
  // Hikvision: DS-2CD = IP cam, DS-2CE = analog, DS-2DF/2DE = PTZ
  if (/^ds-2cd.*i|^ds-2cd.*-i/i.test(n)) {
    if (/dome|d$/i.test(n)) return "ip-dome-kamera";
    if (/turret|t$/i.test(n)) return "ip-turret-kamera";
    return "ip-bullet-kamera";
  }
  if (/^ds-2ce/i.test(n)) return "ahd-kamera";
  if (/^ds-2d[ef]/i.test(n)) return "ip-ptz-kamera";
  // Genel CCTV lens/mount/aksesuar
  if (/^[a-z]{1,3}-\d{3,4}/i.test(n) && /lens|mount|bracket|adapter/i.test(n)) return "kamera-aksesuarlari";
  // Genel CCTV ürünleri (kısa kodlu Dahua/Hikvision aksesuarları)
  if (/^gl-|^opm|^lz\b|^hap|^dv\b/i.test(n)) return "cctv-aksesuarlari";
  if (/^tc-|^tp-.*[a-z]$/i.test(n)) return "kamera-aksesuarlari";
  // Dahua/Hikvision IP kameralar (generic IPC- prefix)
  if (/^ipc-[a-z]{1,3}\w/i.test(n)) {
    if (/dome|d$/i.test(n)) return "ip-dome-kamera";
    if (/turret|t$/i.test(n)) return "ip-turret-kamera";
    return "ip-bullet-kamera";
  }
  // Okisan OK- prefix (genellikle CCTV aksesuar veya kamera)
  if (/^ok-/i.test(n)) return "kamera-aksesuarlari";
  // EX- prefix Dahua expendable/aksesuar
  if (/^ex-/i.test(n)) return "kamera-aksesuarlari";
  // Multimode kablo / fiber / network
  if (/multi.*kablo|cat\s*6|utp/i.test(n)) return "cctv-kablolari";

  // CCTV / Güvenlik (genel)
  if (/ip.*cam|ip.*kamera|network.*cam/.test(n)) return "ip-bullet-kamera";
  if (/bullet/.test(n)) return "ip-bullet-kamera";
  if (/dome/.test(n)) return "ip-dome-kamera";
  if (/ptz/.test(n)) return "ip-ptz-kamera";
  if (/turret/.test(n)) return "ip-turret-kamera";
  if (/fisheye|fish.*eye/.test(n)) return "ip-fisheye-kamera";
  if (/\bahd\b/.test(n)) return "ahd-kamera";
  if (/\bhdcvi\b/.test(n)) return "hdcvi-kamera";
  if (/\btvi\b/.test(n)) return "hd-tvi-kamera";
  if (/\bnvr\b/.test(n)) return "nvr";
  if (/\bdvr\b/.test(n)) return "dvr";
  if (/\bxvr\b/.test(n)) return "xvr";
  if (/termal/.test(n)) return "termal-kameralar";
  if (/video.*kay[ti]|kay[ti].*cihaz/.test(n)) return "nvr";
  // Lens
  if (/\blens\b|.*mm.*f\/|.*mm.*lens/i.test(n)) return "cctv-lens";
  // CCTV power supply
  if (/g[uü]c.*kaynak|power.*supply.*cctv|adapter.*12v/i.test(n)) return "cctv-guc-kaynaklari";

  // Geçiş Kontrol
  if (/kart.*okuyuc|proximity|mifare/.test(n)) return "kart-okuyucu";
  if (/parmak.*izi|fingerprint/.test(n)) return "parmak-izi-okuyucu";
  if (/\by[züu]z.*tan[ıi]ma/.test(n)) return "yuz-tanima-terminal";
  if (/alarm.*panel|panel.*alarm/.test(n)) return "alarm-paneli";
  if (/dedekt[oö]r|pir.*detect/.test(n)) return "pir-dedektor";
  if (/siren|fla[sş][oö]r/.test(n)) return "siren-flasor";
  if (/yang[ıi]n/.test(n)) return "yangin-alarm";
  if (/intercom|kap[ıi].*tel/.test(n)) return "intercom";

  // Network
  if (/switch/.test(n)) {
    if (/poe/.test(n)) return "poe-switch";
    return "yonetilemez-switch";
  }
  if (/access.?point|ap\s|wi.?fi/.test(n)) return "access-point";
  if (/router/.test(n)) return "router";
  if (/fiber|media.?convert|sfp/.test(n)) return "fiber-optik";
  if (/patch.*panel|patch.*kablo|rj45|konnekt/.test(n)) return "yapisal-kablolama";
  if (/firewall|gateway/.test(n)) return "firewall";
  if (/kabin|rack/.test(n) && !/sunucu/.test(n)) return "network-kabin";

  // PC Bileşenleri
  if (/\bcpu\b|i[3579]-\d|core.*i[3579]|ryzen|xeon|epyc/.test(n)) return "islemci";
  if (/anakart|motherboard|mainboard/.test(n)) return "anakart";
  if (/ekran.*kart|gpu|geforce|rtx|gtx|radeon|rx\s\d/.test(n)) return "ekran-karti";
  if (/\bram\b|bellek|ddr[45]|so-dimm|sodimm/.test(n)) return "bellek-ram";
  if (/\bssd\b/.test(n) && !/nvme/.test(n)) return "ssd";
  if (/nvme|m\.2|m2/.test(n)) return "nvme-m2";
  if (/\bhdd\b|hard.?disk|sürücü disk/.test(n)) return "hdd";
  if (/kasa|case|chassis/.test(n) && !/cd|dvd|kabl/.test(n)) return "kasa";
  if (/\bpsu\b|güç.*kaynak|power.*supply/.test(n)) return "guc-kaynagi";
  if (/fan|soğutma|cooler|sıvı.*soğut/.test(n)) return "sogutma";
  if (/usb.*bellek|flash.*drive|flashdisk/.test(n)) return "usb-bellek";
  if (/microsd|sd.*kart|hafıza.*kart|memory.*card/.test(n)) return "hafiza-karti";
  if (/taşınabilir|portable.*disk|external.*hdd/.test(n)) return "tasinabilir-disk";

  // Bilgisayar
  if (/notebook|laptop|dizüstü/.test(n)) return "notebook";
  if (/\bpc\b|masaüstü|desktop/.test(n) && !/kasa|ssd|hdd|ram/.test(n)) return "masaustu-pc";
  if (/mini.?pc|nuc|tiny/.test(n)) return "mini-pc";
  if (/all.?in.?one|all-in-one|\baio\b/.test(n)) return "all-in-one";
  if (/monit[oö]r|display/.test(n)) return "monitor";
  if (/sunucu|server/.test(n)) return "sunucu";

  // Yazıcı
  if (/yazıcı|printer/.test(n)) {
    if (/lazer|laser/.test(n)) return "lazer-yazici";
    if (/tank|inkjet|mürekkep/.test(n)) return "tankli-yazici";
    return "lazer-yazici";
  }
  if (/tarayıcı|scanner/.test(n)) return "tarayici";
  if (/barkod.*okuyuc|barcode.*scanner|scanner.*barkod/.test(n)) return "barkod-okuyucu";
  if (/toner/.test(n)) return "toner";
  if (/kartuş|cartridge/.test(n)) return "kartus";

  // POS
  if (/\bpos\b|fiş.*yazıcı|termal.*yazıcı/.test(n)) return "pos-terminal";
  if (/el.*terminal|handheld|pda/.test(n)) return "el-terminali";
  if (/para.*çekmece/.test(n)) return "para-cekmecesi";

  // UPS / Güç
  if (/\bups\b/.test(n)) return "ups";
  if (/\bakü\b|battery/.test(n)) return "aku-pil";
  if (/powerbank|şarj/.test(n)) return "sarj-cihazi";

  // Kablo
  if (/hdmi/.test(n)) return "hdmi-kablo";
  if (/displayport|dp\s/.test(n)) return "displayport-kablo";
  if (/vga/.test(n)) return "vga-kablo";
  if (/type-c|usb-c|usbc/.test(n)) return "type-c-cevirici";
  if (/çevirici|adaptör|adapter|hub/.test(n)) return "cevirici-adaptor";
  if (/splitter|switch.*hdmi|çoklayıcı/.test(n)) return "coklayici-splitter";

  // Çevre Birimleri
  if (/klavye|keyboard/.test(n) && /mouse/.test(n)) return "klavye-mouse-set";
  if (/klavye|keyboard/.test(n)) return "klavye";
  if (/\bmouse\b/.test(n)) return "mouse";
  if (/kulaklık|headphone|headset/.test(n)) return "kulaklik";
  if (/hoparl[oö]r|speaker/.test(n)) return "hoparlor-ses";
  if (/\bwebcam\b|web.*kamera/.test(n)) return "web-kamerasi";

  // Yazılım
  if (/windows|office|microsoft|antivir[sü]|kaspersky|eset/.test(n)) return "yazilim-lisans";

  return null;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  const dryRun = !process.argv.includes("--execute");

  console.log("=".repeat(60));
  console.log(
    `Kategori Migration v2 — Mod: ${dryRun ? "DRY RUN" : "EXECUTE"}`,
  );
  console.log("=".repeat(60));

  try {
    // ---- ADIM 1: Eski kategorileri temizle ----
    console.log("\n--- ADIM 1: Eski kategorileri temizle ---");
    const deleted = await cleanOldCategories(dryRun);
    console.log(`Silinen eski kategori: ${deleted}`);

    // ---- ADIM 2: Yeni kategori ağacını oluştur ----
    console.log("\n--- ADIM 2: Yeni kategori ağacını oluştur ---");
    const tree = loadCategoryTree();
    const { inserted, slugToId } = await insertCategoryTree(
      tree.tree,
      null,
      0,
      dryRun,
    );
    console.log(`Oluşturulan yeni kategori: ${inserted}`);
    console.log(
      `Slug → ID mapping: ${Object.keys(slugToId).length} adet`,
    );

    // ---- ADIM 3: Ürünleri yeni kategorilere ata ----
    console.log("\n--- ADIM 3: Ürünleri yeni kategorilere ata ---");
    const result = await reassignProducts(slugToId, dryRun);

    // ---- ÖZET ----
    console.log("\n" + "=".repeat(60));
    console.log("ÖZET:");
    console.log(`  Silinen eski kategori: ${deleted}`);
    console.log(`  Oluşturulan yeni kategori: ${inserted}`);
    console.log(`  Eşleşen ürün: ${result.matched}/${result.total}`);
    console.log(`  Eşleşmeyen ürün: ${result.unmatched}/${result.total}`);
    console.log(
      `  Başarı oranı: %${((result.matched / result.total) * 100).toFixed(1)}`,
    );
    console.log("=".repeat(60));

    if (dryRun) {
      console.log(
        "\nBu bir DRY RUN idi. Gerçek çalıştırma için: --execute flag'i kullanın.",
      );
    }
  } catch (error) {
    console.error("[ERROR]", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
