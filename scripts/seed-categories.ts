/**
 * Kategori Seed Scripti - Derinleştirilmiş Hiyerarşi (4-5 Seviye)
 *
 * Tüm ana kategoriler 4-5 seviye derinlikte tanımlanmıştır.
 * Örnek: CCTV > Kayıt Cihazı > NVR > 16 Kanal NVR
 *
 * Kullanım: npx tsx scripts/seed-categories.ts
 */

import { Pool } from "pg"
import { config } from "dotenv"

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// ============================================================================
// DERİNLEŞTİRİLMİŞ KATEGORİ AĞACI (4-5 Seviye Derinlik)
// ============================================================================

const categoryTree: Record<string, any> = {

  // ==========================================================================
  // 1. CCTV / GÜVENLİK KAMERALARI
  // ==========================================================================
  "CCTV": {
    // --- Kayıt Cihazları ---
    "Kayıt Cihazı": {
      "NVR": {
        "4 Kanal NVR": {},
        "8 Kanal NVR": {},
        "16 Kanal NVR": {},
        "32 Kanal NVR": {},
        "64 Kanal NVR": {},
        "128 Kanal NVR": {},
      },
      "DVR": {
        "4 Kanal DVR": {},
        "8 Kanal DVR": {},
        "16 Kanal DVR": {},
        "32 Kanal DVR": {},
      },
      "XVR": {
        "4 Kanal XVR": {},
        "8 Kanal XVR": {},
        "16 Kanal XVR": {},
      },
    },

    // --- IP Kameralar ---
    "IP Kameralar": {
      "IR Bullet": {
        "2MP": {},
        "4MP": {},
        "5MP": {},
        "8MP": {},
      },
      "IR Dome": {
        "2MP": {},
        "4MP": {},
        "5MP": {},
        "8MP": {},
      },
      "IR Turret": {
        "2MP": {},
        "4MP": {},
        "5MP": {},
        "8MP": {},
      },
      "PTZ Kameralar": {
        "4MP PTZ": {},
        "5MP PTZ": {},
        "8MP PTZ": {},
      },
      "Fisheye": {
        "3MP Fisheye": {},
        "5MP Fisheye": {},
        "12MP Fisheye": {},
      },
      "LPR / Plaka Tanıma": {
        "2MP LPR": {},
        "4MP LPR": {},
      },
      "Special Kameralar": {
        "Body Worn": {},
        "Panomorfik": {},
      },
    },

    // --- HDCVI Kameralar ---
    "HDCVI Kameralar": {
      "HDCVI Bullet": {
        "2MP HDCVI Bullet": {},
        "4MP HDCVI Bullet": {},
        "5MP HDCVI Bullet": {},
        "8MP HDCVI Bullet": {},
      },
      "HDCVI Dome": {
        "2MP HDCVI Dome": {},
        "4MP HDCVI Dome": {},
        "5MP HDCVI Dome": {},
      },
      "HDCVI PTZ": {},
    },

    // --- AHD / Analog Kameralar ---
    "AHD Kameralar": {
      "AHD Bullet": {
        "1080P AHD Bullet": {},
        "4MP AHD Bullet": {},
        "5MP AHD Bullet": {},
      },
      "AHD Dome": {
        "1080P AHD Dome": {},
        "4MP AHD Dome": {},
        "5MP AHD Dome": {},
      },
    },
    "Analog Kameralar": {
      "800TVL": {},
      "1000TVL": {},
      "1200TVL": {},
    },

    // --- Termal Kameralar ---
    "Termal Kameralar": {
      "El Tipi Termal": {},
      "Sabit Termal": {},
      "PTZ Termal": {},
    },

    // --- Aksesuarlar ---
    "Aksesuarlar": {
      "Montaj Aparatları": {
        "Duvar Braketi": {},
        "Tavan Braketi": {},
        "Direk Aparatı": {},
        "Junction Box": {},
      },
      "Lensler": {
        "2.8mm Lens": {},
        "3.6mm Lens": {},
        "6mm Lens": {},
        "12mm Lens": {},
        "Vari-focal Lens": {},
      },
      "Hard Diskler": {
        "1TB HDD": {},
        "2TB HDD": {},
        "4TB HDD": {},
        "6TB HDD": {},
        "8TB HDD": {},
        "10TB HDD": {},
      },
      "Kablolar": {
        "Kombine Kablo": {},
        "Koaksiyel Kablo (RG59)": {},
        "Cat5e Kablo": {},
        "Cat6 Kablo": {},
      },
      "Adaptörler": {
        "12V Adaptör": {},
        "24V Adaptör": {},
        "48V PoE Adaptör": {},
      },
      "Güç Dağıtım Kutuları": {
        "4 Port Güç Kutusu": {},
        "8 Port Güç Kutusu": {},
        "16 Port Güç Kutusu": {},
        "18 Port Güç Kutusu": {},
      },
      "Monitörler": {
        "19\" Monitör": {},
        "22\" Monitör": {},
        "27\" Monitör": {},
        "32\" Monitör": {},
        "43\" Monitör": {},
      },
      "Video Balunlar": {},
      "BNC / Konektörler": {},
    },
  },

  // ==========================================================================
  // 2. BİLGİSAYAR & SUNUCU
  // ==========================================================================
  "Bilgisayar & Sunucu": {
    "Notebook": {
      "Gaming Notebook": {},
      "İş Notebooku": {},
      "Ultrabook": {},
      "Chromebook": {},
    },
    "Masaüstü Bilgisayar": {
      "Tower PC": {},
      "All-in-One PC": {},
      "Mini PC": {},
      "Barebone": {},
    },
    "Sunucu": {
      "Tower Sunucu": {},
      "Rack Sunucu": {
        "1U Sunucu": {},
        "2U Sunucu": {},
        "4U Sunucu": {},
      },
      "NAS / Depolama Sunucusu": {},
      "Server Aksesuarları": {},
    },
    "Monitör": {
      "22\" Monitör": {},
      "24\" Monitör": {},
      "27\" Monitör": {},
      "32\" Monitör": {},
      "34\" Ultrawide": {},
      "Touchscreen Monitör": {},
    },
  },

  // ==========================================================================
  // 3. PC BİLEŞENLERİ
  // ==========================================================================
  "PC Bileşenleri": {
    "Ekran Kartı": {
      "NVIDIA": {
        "RTX 4060": {},
        "RTX 4070": {},
        "RTX 4080": {},
        "RTX 4090": {},
        "RTX 5060": {},
        "RTX 5070": {},
        "RTX 5080": {},
        "RTX 5090": {},
      },
      "AMD": {
        "RX 7600": {},
        "RX 7700 XT": {},
        "RX 7800 XT": {},
        "RX 7900 XT": {},
        "RX 7900 XTX": {},
      },
    },
    "İşlemci": {
      "Intel": {
        "Core i3": {},
        "Core i5": {},
        "Core i7": {},
        "Core i9": {},
        "Xeon": {},
      },
      "AMD": {
        "Ryzen 5": {},
        "Ryzen 7": {},
        "Ryzen 9": {},
        "EPYC": {},
      },
    },
    "Anakart": {
      "Intel Anakart": {
        "H610": {},
        "B760": {},
        "Z790": {},
      },
      "AMD Anakart": {
        "A620": {},
        "B650": {},
        "X670": {},
      },
    },
    "Bellek (RAM)": {
      "DDR4": {
        "8GB DDR4": {},
        "16GB DDR4": {},
        "32GB DDR4": {},
      },
      "DDR5": {
        "8GB DDR5": {},
        "16GB DDR5": {},
        "32GB DDR5": {},
        "64GB DDR5": {},
      },
      "SO-DIMM (Laptop)": {
        "8GB SO-DIMM": {},
        "16GB SO-DIMM": {},
        "32GB SO-DIMM": {},
      },
      "Sunucu Bellek (ECC)": {},
    },
    "Depolama": {
      "SSD": {
        "250GB SSD": {},
        "500GB SSD": {},
        "1TB SSD": {},
        "2TB SSD": {},
      },
      "NVMe M.2": {
        "250GB NVMe": {},
        "500GB NVMe": {},
        "1TB NVMe": {},
        "2TB NVMe": {},
      },
      "HDD (Masaüstü)": {
        "1TB HDD": {},
        "2TB HDD": {},
        "4TB HDD": {},
        "8TB HDD": {},
      },
      "Taşınabilir Disk": {},
      "USB Bellek": {},
      "Hafıza Kartı": {},
    },
    "Kasa": {
      "Mid Tower": {},
      "Full Tower": {},
      "Mini ITX Kasa": {},
      "Server Kasa": {},
    },
    "Güç Kaynağı (PSU)": {
      "500W PSU": {},
      "650W PSU": {},
      "750W PSU": {},
      "850W PSU": {},
      "1000W PSU": {},
      "1200W PSU": {},
    },
    "Soğutma": {
      "İşlemci Fanı (Air)": {},
      "Sıvı Soğutma (AIO)": {
        "120mm AIO": {},
        "240mm AIO": {},
        "360mm AIO": {},
      },
      "Kasa Fanı": {},
      "Termal Macun": {},
    },
  },

  // ==========================================================================
  // 4. NETWORK & FİBER
  // ==========================================================================
  "Network & Fiber": {
    "Switch": {
      "Unmanaged Switch": {
        "5 Port Switch": {},
        "8 Port Switch": {},
        "16 Port Switch": {},
        "24 Port Switch": {},
      },
      "Managed Switch": {
        "8 Port Managed": {},
        "16 Port Managed": {},
        "24 Port Managed": {},
        "48 Port Managed": {},
      },
      "PoE Switch": {
        "4 Port PoE": {},
        "8 Port PoE": {},
        "16 Port PoE": {},
        "24 Port PoE": {},
        "48 Port PoE": {},
      },
      "SFP Uplink Switch": {},
      "Endüstriyel Switch": {},
    },
    "Kablosuz Ağ": {
      "Access Point": {
        "Indoor AP": {},
        "Outdoor AP": {},
        "Ceiling AP": {},
      },
      "Router": {
        "Ev Router": {},
        "Enterprise Router": {},
        "VPN Router": {},
      },
      "Mesh Sistem": {},
    },
    "Fiber Optik": {
      "Fiber Kablo": {
        "Single Mode (SM)": {},
        "Multi Mode (MM)": {},
      },
      "Fiber Patch Cord": {
        "SC-SC": {},
        "SC-LC": {},
        "LC-LC": {},
      },
      "SFP Modül": {
        "1G SFP": {},
        "10G SFP+": {},
        "25G SFP28": {},
      },
      "Media Converter": {},
      "Fiber Panel & Aksesuar": {},
    },
    "Yapısal Kablolama": {
      "Cat5e Kablo": {},
      "Cat6 Kablo": {},
      "Cat6a Kablo": {},
      "Patch Panel": {},
      "Patch Kablo": {},
      "Keystone & RJ45": {},
    },
    "Network Kabin": {
      "6U Kabin": {},
      "9U Kabin": {},
      "12U Kabin": {},
      "22U Kabin": {},
      "42U Kabin": {},
    },
    "Ağ Güvenliği": {
      "Firewall": {},
      "UTM Appliance": {},
      "VPN Gateway": {},
    },
  },

  // ==========================================================================
  // 5. YAZICI & TARAYICI
  // ==========================================================================
  "Yazıcı & Tarayıcı": {
    "Lazer Yazıcı": {
      "Mono Lazer Yazıcı": {
        "A4 Mono Lazer": {},
        "A3 Mono Lazer": {},
      },
      "Renkli Lazer Yazıcı": {
        "A4 Renkli Lazer": {},
        "A3 Renkli Lazer": {},
      },
    },
    "Mürekkep Püskürtmeli": {
      "Tanklı Yazıcı": {},
      "Kartuşlu Yazıcı": {},
    },
    "Çok Fonksiyonlu (MFP)": {
      "Lazer MFP": {},
      "Mürekkep MFP": {},
    },
    "Etiket & POS Yazıcı": {
      "Etiket Yazıcı": {},
      "POS Yazıcı": {},
      "Barkod Yazıcı": {},
    },
    "Tarayıcı": {
      "Doküman Tarayıcı": {},
      "Fiş Okuyucu": {},
      "3D Tarayıcı": {},
    },
    "Projeksiyon": {
      "DLP Projeksiyon": {},
      "LCD Projeksiyon": {},
      "Laser Projeksiyon": {},
      "Projeksiyon Perdesi": {},
    },
    "Yazıcı Sarf Malzemeleri": {
      "Toner": {},
      "Kartuş": {},
      "Drum": {},
      "Yazıcı Bandı": {},
    },
  },

  // ==========================================================================
  // 6. GEÇİŞ KONTROL & ALARM
  // ==========================================================================
  "Geçiş Kontrol & Alarm": {
    "Geçiş Kontrol": {
      "Kart Okuyucu": {
        "Proximity Okuyucu": {},
        "Mifare Okuyucu": {},
        "Uzun Menzilli Okuyucu": {},
      },
      "Biyometrik": {
        "Parmak İzi": {},
        "Yüz Tanıma": {},
        "İris Tanıma": {},
      },
      "Turnike": {
        "Tripod Turnike": {},
        "Full Height Turnike": {},
        "Swing Gate": {},
      },
      "Bariyer": {
        "Otopark Bariyeri": {},
        "Yaya Bariyeri": {},
      },
      "Kapı İstasyonu": {
        "IP Video İnterkom": {},
        "Analog İnterkom": {},
      },
      "Kontrol Paneli": {},
      "Elektrikli Kilit": {},
      "Geçiş Kartı & Anahtarlık": {},
    },
    "Hırsız Alarm": {
      "Alarm Paneli": {},
      "Dedektör": {
        "PIR Hareket Dedektörü": {},
        "Manyetik Kontak": {},
        "Cam Kırma Sensörü": {},
        "Duman Dedektörü": {},
        "Titreşim Sensörü": {},
      },
      "Siren & Flaşör": {},
      "Kumanda & Tuş Takımı": {},
    },
    "Yangın Alarm": {
      "Yangın Paneli": {},
      "Isı Dedektörü": {},
      "Duman Dedektörü": {},
      "Siren": {},
      "Acil Aydınlatma": {},
    },
  },

  // ==========================================================================
  // 7. GÜÇ ELEKTRONİĞİ
  // ==========================================================================
  "Güç Elektroniği": {
    "UPS": {
      "Line-Interactive UPS": {
        "600VA UPS": {},
        "1000VA UPS": {},
        "1500VA UPS": {},
        "2000VA UPS": {},
        "3000VA UPS": {},
      },
      "Online UPS": {
        "1kVA Online UPS": {},
        "2kVA Online UPS": {},
        "3kVA Online UPS": {},
        "6kVA Online UPS": {},
        "10kVA Online UPS": {},
        "20kVA Online UPS": {},
      },
      "Rack UPS": {},
      "UPS Akü": {},
    },
    "Voltaj Regülatörü": {
      "500VA Regülatör": {},
      "1000VA Regülatör": {},
      "2000VA Regülatör": {},
      "3000VA Regülatör": {},
      "5000VA Regülatör": {},
    },
    "Adaptör": {
      "Notebook Adaptörü": {},
      "Universal Adaptör": {},
      "USB-C Şarj Adaptörü": {},
    },
    "Şarj Cihazı": {
      "Powerbank": {},
      "USB Şarj İstasyonu": {},
    },
    "Güneş Enerjisi": {
      "Güneş Paneli": {},
      "Solar Kontrolcü": {},
      "Solar Akü": {},
    },
    "Pil & Akü": {
      "AA / AAA Pil": {},
      "Akü (Kurşun)": {},
    },
  },

  // ==========================================================================
  // 8. KABLO & AKSESUAR
  // ==========================================================================
  "Kablo & Aksesuar": {
    "Görüntü Kabloları": {
      "HDMI Kablo": {
        "HDMI 2.0": {},
        "HDMI 2.1": {},
        "HDMI Fiber": {},
      },
      "DisplayPort Kablo": {
        "DP 1.4": {},
        "DP 2.0": {},
      },
      "VGA Kablo": {},
      "DVI Kablo": {},
    },
    "USB Kablolar": {
      "USB-A to USB-B": {},
      "USB-C Kablo": {},
      "USB-C to Lightning": {},
      "USB Uzatma Kablo": {},
    },
    "Ses Kabloları": {
      "3.5mm Jack Kablo": {},
      "Optik Ses Kablosu": {},
      "XLR Kablo": {},
    },
    "Güç Kabloları": {
      "IEC Güç Kablosu": {},
      "Priz & Uzatma": {
        "Grup Priz": {},
        "Uzatma Kablosu": {},
      },
    },
    "Dönüştürücüler": {
      "HDMI to VGA Adaptör": {},
      "USB-C Hub": {},
      "DisplayPort Adaptör": {},
    },
    "KVM Switch": {},
    "HDMI Splitter & Switch": {
      "HDMI Splitter": {},
      "HDMI Switch": {},
      "HDMI Extender": {},
    },
  },

  // ==========================================================================
  // 9. ÇEVRE BİRİMLERİ & AKSESUAR
  // ==========================================================================
  "Çevre Birimleri & Aksesuar": {
    "Klavye & Mouse": {
      "Klavye": {
        "USB Klavye": {},
        "Kablosuz Klavye": {},
        "Mekanik Klavye": {},
      },
      "Mouse": {
        "USB Mouse": {},
        "Kablosuz Mouse": {},
        "Gaming Mouse": {},
      },
      "Klavye + Mouse Set": {},
      "Mouse Pad": {},
    },
    "Kulaklık & Mikrofon": {
      "Kulaklık": {
        "Kablolu Kulaklık": {},
        "Kablosuz Kulaklık": {},
        "Gaming Headset": {},
      },
      "Mikrofon": {},
    },
    "Webcam": {},
    "Hoparlör": {
      "Masaüstü Hoparlör": {},
      "Soundbar": {},
      "PA Sistem": {},
    },
    "USB Hub & Dongle": {},
    "Monitör Aparatı": {
      "Monitör Kolu": {},
      "Dual Monitör Stand": {},
      "Laptop Standı": {},
    },
    "Notebook Aksesuarı": {
      "Notebook Çanta": {},
      "Notebook Soğutucu": {},
      "Docking Station": {},
    },
    "Akıllı Ev": {
      "Akıllı Priz": {},
      "Akıllı Ampul": {},
      "Akıllı Sensör": {},
    },
  },

  // ==========================================================================
  // 10. YAZILIM & LİSANS
  // ==========================================================================
  "Yazılım & Lisans": {
    "İşletim Sistemi": {
      "Windows": {
        "Windows 11 Home": {},
        "Windows 11 Pro": {},
        "Windows Server 2022": {},
      },
      "Linux": {
        "Ubuntu": {},
        "CentOS": {},
        "Red Hat": {},
      },
    },
    "Ofis Yazılımı": {
      "Microsoft 365": {
        "1 Cihaz": {},
        "5 Cihaz": {},
        "Business Basic": {},
        "Business Standard": {},
      },
      "Office 2024": {
        "Home & Student": {},
        "Home & Business": {},
        "Professional": {},
      },
    },
    "Antivirüs & Güvenlik": {
      "1 Cihaz Lisans": {},
      "3 Cihaz Lisans": {},
      "5 Cihaz Lisans": {},
      "10 Cihaz Lisans": {},
      "Enterprise Lisans": {},
    },
    "VMS Yazılımı": {
      "4 Kanal VMS": {},
      "8 Kanal VMS": {},
      "16 Kanal VMS": {},
      "32 Kanal VMS": {},
      "64 Kanal VMS": {},
      "Sınırsız Kanal": {},
    },
    "Grafik & Tasarım": {
      "Adobe Creative Cloud": {},
      "AutoCAD": {},
      "CorelDRAW": {},
    },
    "Yedekleme Yazılımı": {},
  },

  // ==========================================================================
  // 11. POS & BARKOD SİSTEMLERİ
  // ==========================================================================
  "POS & Barkod": {
    "Barkod Okuyucu": {
      "1D Barkod Okuyucu": {},
      "2D Barkod Okuyucu": {},
      "Kablosuz Barkod Okuyucu": {},
      "Sabit Barkod Okuyucu": {},
    },
    "POS Terminal": {
      "All-in-One POS": {},
      "Tablet POS": {},
      "Mobil POS": {},
    },
    "Para Kasası": {
      "USB Para Kasası": {},
      "Bluetooth Para Kasası": {},
    },
    "Müşteri Ekranı": {},
    "Fiş Yazıcı": {
      "58mm Fiş Yazıcı": {},
      "80mm Fiş Yazıcı": {},
    },
    "Ödeme Terminali": {},
  },

  // ==========================================================================
  // 12. AKILLI SİSTEMLER
  // ==========================================================================
  "Akıllı Sistemler": {
    "Görüntü Analizi": {
      "Nesne Tanıma": {},
      "Hareket Analizi": {},
      "İnsan Sayma": {},
    },
    "Plaka Tanıma": {
      "Sabit Plaka Tanıma": {},
      "Mobil Plaka Tanıma": {},
    },
    "Yüz Tanıma": {
      "Yüz Tanıma Terminali": {},
      "Yüz Tanıma Yazılımı": {},
    },
    "IoT Sensör": {
      "Sıcaklık Sensörü": {},
      "Nem Sensörü": {},
      "Su Sensörü": {},
    },
  },
}

// ============================================================================
// YARDIMCI FONKSİYONLAR
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

type CategoryTree = Record<string, any>

async function createCategories(
  client: any,
  tree: CategoryTree,
  parentId: string | null = null,
  depth: number = 0,
  path: string = ""
): Promise<number> {
  let count = 0
  let sortOrder = 0

  for (const [name, children] of Object.entries(tree)) {
    // Slug'ı parent path dahil oluştur - çakışmaları önle (ör: "2MP" hem IR Bullet hem IR Dome'da)
    const nameSlug = generateSlug(name)
    const fullPath = path ? `${path}/${nameSlug}` : nameSlug
    // Benzersiz slug: parent slug + "-" + kendi slug'ı (root seviyesinde sadece kendi slug'ı)
    const uniqueSlug = path ? `${path.split('/').pop()}-${nameSlug}` : nameSlug

    // Kategori oluştur veya güncelle (uniqueSlug eşleşmesine göre)
    const result = await client.query(
      `INSERT INTO categories (id, name, slug, parent_id, depth, path, is_active, sort_order, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, $6, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = $1,
         parent_id = $3,
         depth = $4,
         path = $5,
         sort_order = $6,
         is_active = true,
         deleted_at = NULL,
         updated_at = NOW()
       RETURNING id`,
      [name, uniqueSlug, parentId, depth, fullPath, sortOrder]
    )

    const categoryId = result.rows[0].id
    count++
    sortOrder++

    console.log(`${"  ".repeat(depth)}${name} (depth=${depth}, slug=${uniqueSlug})`)

    // Alt kategorileri oluştur
    if (Object.keys(children).length > 0) {
      const childCount = await createCategories(client, children, categoryId, depth + 1, fullPath)
      count += childCount
    }
  }

  return count
}

// ============================================================================
// ANA FONKSİYON
// ============================================================================

async function main() {
  const client = await pool.connect()

  try {
    console.log("=== Kategori Seed Scripti ===")
    console.log("Hedef: 4-5 seviye derinlik, temiz kategori hiyerarşisi\n")

    // Önce kategori referanslarını temizle
    console.log("1. Ürünlerin kategori referansları temizleniyor...")
    const productUpdate = await client.query(
      "UPDATE products SET category_id = NULL WHERE category_id IS NOT NULL"
    )
    console.log(`   ${productUpdate.rowCount} ürünün kategori referansı temizlendi.`)

    // ProfitMargins'deki CATEGORY scope'lu kayıtları sil
    console.log("2. Kategori bazlı kar marjları temizleniyor...")
    const marginDelete = await client.query(
      "DELETE FROM profit_margins WHERE scope = 'CATEGORY'"
    )
    console.log(`   ${marginDelete.rowCount} kategori marjı silindi.`)

    // Tüm kategorileri sil (hard delete - cascading ile alt kategoriler de silinir)
    console.log("3. Tüm mevcut kategoriler siliniyor...")
    const catDelete = await client.query("DELETE FROM categories")
    console.log(`   ${catDelete.rowCount} kategori silindi.`)

    console.log("\n4. Yeni kategori ağacı oluşturuluyor...")

    await client.query("BEGIN")

    const count = await createCategories(client, categoryTree)

    await client.query("COMMIT")

    console.log(`\nToplam ${count} kategori oluşturuldu/güncellendi.`)

    // İstatistikler
    const totalResult = await client.query("SELECT COUNT(*) FROM categories WHERE deleted_at IS NULL")
    const rootsResult = await client.query("SELECT COUNT(*) FROM categories WHERE parent_id IS NULL AND deleted_at IS NULL")
    const depthStats = await client.query("SELECT depth, COUNT(*) as cnt FROM categories WHERE deleted_at IS NULL GROUP BY depth ORDER BY depth")

    console.log(`\nİstatistikler:`)
    console.log(`  Toplam aktif kategori: ${totalResult.rows[0].count}`)
    console.log(`  Ana kategori sayısı: ${rootsResult.rows[0].count}`)
    console.log(`  Derinlik dağılımı:`)
    for (const row of depthStats.rows) {
      console.log(`    Depth ${row.depth}: ${row.cnt} kategori`)
    }
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

main()
  .then(() => {
    pool.end()
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    pool.end()
    process.exit(1)
  })
