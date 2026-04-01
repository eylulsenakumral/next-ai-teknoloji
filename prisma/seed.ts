import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcryptjs"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Admin kullanıcı: SUPER_ADMIN
  const adminPasswordHash = await bcrypt.hash("admin123", 12)
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@nextai.com.tr" },
    update: {},
    create: {
      email: "admin@nextai.com.tr",
      passwordHash: adminPasswordHash,
      name: "Sistem Yöneticisi",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  })
  console.log(`Admin oluşturuldu: ${admin.email} (role: ${admin.role})`)

  // Test bayi: APPROVED customer
  const dealerPasswordHash = await bcrypt.hash("test123", 12)
  const dealer = await prisma.customer.upsert({
    where: { dealerCode: "BAY001" },
    update: {},
    create: {
      dealerCode: "BAY001",
      passwordHash: dealerPasswordHash,
      companyName: "Test Bilişim Ltd. Şti.",
      tradeName: "Test Bilişim",
      contactName: "Ahmet Yılmaz",
      phone: "05551234567",
      email: "test@testbilisim.com",
      city: "İstanbul",
      country: "TR",
      status: "APPROVED",
      approvedAt: new Date(),
      balance: 0,
      creditLimit: 50000,
      discountRate: 5,
    },
  })
  console.log(
    `Bayi oluşturuldu: ${dealer.dealerCode} — ${dealer.companyName} (status: ${dealer.status})`
  )

  // =========================================================
  // MARKALAR
  // =========================================================
  const brandsData = [
    { name: "Hikvision", slug: "hikvision", websiteUrl: "https://www.hikvision.com", description: "Güvenlik kamerası ve IP kamera üreticisi" },
    { name: "Dahua", slug: "dahua", websiteUrl: "https://www.dahuasecurity.com", description: "Güvenlik ve gözetleme sistemleri" },
    { name: "TP-Link", slug: "tp-link", websiteUrl: "https://www.tp-link.com", description: "Ağ ekipmanları ve Wi-Fi çözümleri" },
    { name: "ASUS", slug: "asus", websiteUrl: "https://www.asus.com", description: "Bilgisayar ve ağ ekipmanları üreticisi" },
    { name: "HP", slug: "hp", websiteUrl: "https://www.hp.com", description: "Bilgisayar, yazıcı ve kurumsal çözümler" },
    { name: "Dell", slug: "dell", websiteUrl: "https://www.dell.com", description: "Sunucu, dizüstü ve iş istasyonu üreticisi" },
    { name: "Canon", slug: "canon", websiteUrl: "https://www.canon.com", description: "Yazıcı, tarayıcı ve kamera üreticisi" },
    { name: "Kingston", slug: "kingston", websiteUrl: "https://www.kingston.com", description: "Bellek, SSD ve depolama çözümleri" },
    { name: "Logitech", slug: "logitech", websiteUrl: "https://www.logitech.com", description: "Çevre birimleri ve aksesuarlar" },
    { name: "Ubiquiti", slug: "ubiquiti", websiteUrl: "https://www.ui.com", description: "Kurumsal ağ ekipmanları ve çözümleri" },
  ]

  for (const b of brandsData) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        name: b.name,
        slug: b.slug,
        websiteUrl: b.websiteUrl,
        description: b.description,
        isActive: true,
        sortOrder: brandsData.indexOf(b),
      },
    })
  }
  console.log(`${brandsData.length} marka oluşturuldu.`)

  // =========================================================
  // KATEGORİLER (5 Seviye Hiyerarşik)
  // =========================================================

  interface CategoryNode {
    name: string
    slug: string
    sortOrder: number
    children?: CategoryNode[]
  }

  const categoryTree: CategoryNode[] = [
    {
      name: "Güvenlik Sistemleri", slug: "guvenlik-sistemleri", sortOrder: 0,
      children: [
        {
          name: "Kayıt Cihazı (NVR/DVR)", slug: "kayit-cihazi-nvr-dvr", sortOrder: 0,
          children: [
            {
              name: "NVR", slug: "nvr", sortOrder: 0,
              children: [
                { name: "4 Kanal NVR", slug: "4-kanal-nvr", sortOrder: 0 },
                { name: "8 Kanal NVR", slug: "8-kanal-nvr", sortOrder: 1 },
                { name: "16 Kanal NVR", slug: "16-kanal-nvr", sortOrder: 2 },
                { name: "32 Kanal NVR", slug: "32-kanal-nvr", sortOrder: 3 },
              ],
            },
            {
              name: "DVR", slug: "dvr", sortOrder: 1,
              children: [
                { name: "4 Kanal DVR", slug: "4-kanal-dvr", sortOrder: 0 },
                { name: "8 Kanal DVR", slug: "8-kanal-dvr", sortOrder: 1 },
                { name: "16 Kanal DVR", slug: "16-kanal-dvr", sortOrder: 2 },
              ],
            },
          ],
        },
        {
          name: "IP Kamera", slug: "ip-kamera", sortOrder: 1,
          children: [
            {
              name: "Bullet Kamera", slug: "bullet-kamera", sortOrder: 0,
              children: [
                { name: "2MP Bullet", slug: "2mp-bullet", sortOrder: 0 },
                { name: "4MP Bullet", slug: "4mp-bullet", sortOrder: 1 },
                { name: "5MP Bullet", slug: "5mp-bullet", sortOrder: 2 },
                { name: "8MP Bullet", slug: "8mp-bullet", sortOrder: 3 },
              ],
            },
            {
              name: "Dome Kamera", slug: "dome-kamera", sortOrder: 1,
              children: [
                { name: "2MP Dome", slug: "2mp-dome", sortOrder: 0 },
                { name: "4MP Dome", slug: "4mp-dome", sortOrder: 1 },
                { name: "5MP Dome", slug: "5mp-dome", sortOrder: 2 },
                { name: "8MP Dome", slug: "8mp-dome", sortOrder: 3 },
              ],
            },
            {
              name: "PTZ Kamera", slug: "ptz-kamera", sortOrder: 2,
              children: [
                { name: "2MP PTZ", slug: "2mp-ptz", sortOrder: 0 },
                { name: "4MP PTZ", slug: "4mp-ptz", sortOrder: 1 },
              ],
            },
            {
              name: "Turret Kamera", slug: "turret-kamera", sortOrder: 3,
              children: [
                { name: "2MP Turret", slug: "2mp-turret", sortOrder: 0 },
                { name: "4MP Turret", slug: "4mp-turret", sortOrder: 1 },
              ],
            },
            {
              name: "Special Kamera", slug: "special-kamera", sortOrder: 4,
              children: [
                { name: "LPR/Plaka Tanıma", slug: "lpr-plaka-tanima", sortOrder: 0 },
                { name: "Termal Kamera", slug: "termal-kamera", sortOrder: 1 },
                { name: "Panoramik/Fisheye", slug: "panoramik-fisheye", sortOrder: 2 },
              ],
            },
          ],
        },
        {
          name: "HD Kamera (Analog)", slug: "hd-kamera-analog", sortOrder: 2,
          children: [
            { name: "AHD Kamera", slug: "ahd-kamera", sortOrder: 0 },
            { name: "HDCVI Kamera", slug: "hdcvi-kamera", sortOrder: 1 },
            { name: "HDTVI Kamera", slug: "hdtvi-kamera", sortOrder: 2 },
          ],
        },
        {
          name: "Alarm Sistemleri", slug: "alarm-sistemleri", sortOrder: 3,
          children: [
            { name: "Alarm Paneli", slug: "alarm-paneli", sortOrder: 0 },
            { name: "Hareket Sensörü", slug: "hareket-sensoru", sortOrder: 1 },
            { name: "Manyetik Kontak", slug: "manyetik-kontak", sortOrder: 2 },
            { name: "Siren", slug: "siren", sortOrder: 3 },
            { name: "Duman/Gaz Dedektörü", slug: "duman-gaz-dedektoru", sortOrder: 4 },
          ],
        },
        {
          name: "Access Control", slug: "access-control", sortOrder: 4,
          children: [
            { name: "Kartlı Geçiş", slug: "kartli-gecis", sortOrder: 0 },
            { name: "Parmak İzi", slug: "parmak-izi", sortOrder: 1 },
            { name: "Yüz Tanıma", slug: "yuz-tanima", sortOrder: 2 },
            { name: "Turnike/Bariyer", slug: "turnike-bariyer", sortOrder: 3 },
          ],
        },
        {
          name: "İnterkom", slug: "interkom", sortOrder: 5,
          children: [
            { name: "Analog İnterkom", slug: "analog-interkom", sortOrder: 0 },
            { name: "IP İnterkom", slug: "ip-interkom", sortOrder: 1 },
            { name: "Görüntülü İnterkom", slug: "goruntulu-interkom", sortOrder: 2 },
          ],
        },
        {
          name: "Güvenlik Aksesuar", slug: "guvenlik-aksesuar", sortOrder: 6,
          children: [
            { name: "Lens", slug: "lens", sortOrder: 0 },
            { name: "Kamera Kabinı", slug: "kamera-kabinı", sortOrder: 1 },
            { name: "Montaj Aparatı", slug: "montaj-aparati", sortOrder: 2 },
            { name: "Güç Kaynağı", slug: "guc-kaynagi-guvenlik", sortOrder: 3 },
            { name: "HDD (Güvenlik)", slug: "hdd-guvenlik", sortOrder: 4 },
            { name: "Kablo & Konnektör", slug: "kablo-konnektor", sortOrder: 5 },
          ],
        },
      ],
    },
    {
      name: "Bilgisayar & Sunucu", slug: "bilgisayar-sunucu", sortOrder: 1,
      children: [
        {
          name: "Notebook", slug: "notebook", sortOrder: 0,
          children: [
            { name: "İş Notebook", slug: "is-notebook", sortOrder: 0 },
            { name: "Oyun Notebook", slug: "oyun-notebook", sortOrder: 1 },
            { name: "İnce & Hafif", slug: "ince-hafif-notebook", sortOrder: 2 },
          ],
        },
        {
          name: "Masaüstü Bilgisayar", slug: "masaustu-bilgisayar", sortOrder: 1,
          children: [
            { name: "İş İstasyonu", slug: "is-istasyonu", sortOrder: 0 },
            { name: "Ofis PC", slug: "ofis-pc", sortOrder: 1 },
            { name: "Oyun PC", slug: "oyun-pc", sortOrder: 2 },
          ],
        },
        { name: "All-in-One", slug: "all-in-one", sortOrder: 2 },
        { name: "Tablet", slug: "tablet", sortOrder: 3 },
        {
          name: "Sunucu (Server)", slug: "sunucu-server", sortOrder: 4,
          children: [
            { name: "Rack Server", slug: "rack-server", sortOrder: 0 },
            { name: "Tower Server", slug: "tower-server", sortOrder: 1 },
            { name: "Blade Server", slug: "blade-server", sortOrder: 2 },
          ],
        },
      ],
    },
    {
      name: "PC Bileşenleri", slug: "pc-bilesenleri", sortOrder: 2,
      children: [
        { name: "Anakart", slug: "anakart", sortOrder: 0 },
        {
          name: "İşlemci (CPU)", slug: "islemci-cpu", sortOrder: 1,
          children: [
            { name: "Intel İşlemci", slug: "intel-islemci", sortOrder: 0 },
            { name: "AMD İşlemci", slug: "amd-islemci", sortOrder: 1 },
          ],
        },
        {
          name: "RAM Bellek", slug: "ram-bellek", sortOrder: 2,
          children: [
            { name: "DDR4 RAM", slug: "ddr4-ram", sortOrder: 0 },
            { name: "DDR5 RAM", slug: "ddr5-ram", sortOrder: 1 },
            { name: "Laptop RAM", slug: "laptop-ram", sortOrder: 2 },
            { name: "Sunucu RAM (ECC)", slug: "sunucu-ram-ecc", sortOrder: 3 },
          ],
        },
        {
          name: "Ekran Kartı (GPU)", slug: "ekran-karti-gpu", sortOrder: 3,
          children: [
            { name: "NVIDIA GPU", slug: "nvidia-gpu", sortOrder: 0 },
            { name: "AMD GPU", slug: "amd-gpu", sortOrder: 1 },
            { name: "İş İstasyonu GPU", slug: "is-istasyonu-gpu", sortOrder: 2 },
          ],
        },
        {
          name: "SSD & HDD", slug: "ssd-hdd", sortOrder: 4,
          children: [
            { name: "NVMe SSD", slug: "nvme-ssd", sortOrder: 0 },
            { name: "SATA SSD", slug: "sata-ssd", sortOrder: 1 },
            { name: "HDD", slug: "hdd", sortOrder: 2 },
            { name: "Dış SSD", slug: "dis-ssd", sortOrder: 3 },
          ],
        },
        { name: "Kasa", slug: "kasa", sortOrder: 5 },
        { name: "Güç Kaynağı (PSU)", slug: "guc-kaynagi-psu", sortOrder: 6 },
        { name: "Soğutucu", slug: "sogutucu", sortOrder: 7 },
      ],
    },
    {
      name: "Network & Fiber", slug: "network-fiber", sortOrder: 3,
      children: [
        {
          name: "Switch", slug: "switch", sortOrder: 0,
          children: [
            { name: "Yönetilebilir Switch", slug: "yonetilebilir-switch", sortOrder: 0 },
            { name: "Yönetilemez Switch", slug: "yonetilemez-switch", sortOrder: 1 },
            { name: "PoE Switch", slug: "poe-switch", sortOrder: 2 },
          ],
        },
        {
          name: "Router", slug: "router", sortOrder: 1,
          children: [
            { name: "Enterprise Router", slug: "enterprise-router", sortOrder: 0 },
            { name: "VPN Router", slug: "vpn-router", sortOrder: 1 },
          ],
        },
        {
          name: "Access Point", slug: "access-point", sortOrder: 2,
          children: [
            { name: "Indoor AP", slug: "indoor-ap", sortOrder: 0 },
            { name: "Outdoor AP", slug: "outdoor-ap", sortOrder: 1 },
          ],
        },
        { name: "Modem", slug: "modem", sortOrder: 3 },
        {
          name: "Fiber Ekipman", slug: "fiber-ekipman", sortOrder: 4,
          children: [
            { name: "SFP Modül", slug: "sfp-modul", sortOrder: 0 },
            { name: "Fiber Kablo", slug: "fiber-kablo", sortOrder: 1 },
            { name: "Media Converter", slug: "media-converter", sortOrder: 2 },
            { name: "Patch Panel", slug: "patch-panel", sortOrder: 3 },
          ],
        },
        {
          name: "Kablosuz", slug: "kablosuz", sortOrder: 5,
          children: [
            { name: "Anten", slug: "anten", sortOrder: 0 },
            { name: "Bridge", slug: "bridge", sortOrder: 1 },
          ],
        },
      ],
    },
    {
      name: "Yazıcı & Tarayıcı", slug: "yazici-tarayici", sortOrder: 4,
      children: [
        {
          name: "Lazer Yazıcı", slug: "lazer-yazici", sortOrder: 0,
          children: [
            { name: "Mono Lazer", slug: "mono-lazer", sortOrder: 0 },
            { name: "Renkli Lazer", slug: "renkli-lazer", sortOrder: 1 },
            { name: "Multifonksiyon Lazer", slug: "multifonksiyon-lazer", sortOrder: 2 },
          ],
        },
        {
          name: "Mürekkep Yazıcı", slug: "murekkep-yazici", sortOrder: 1,
          children: [
            { name: "Inkjet", slug: "inkjet", sortOrder: 0 },
            { name: "Tanklı Yazıcı", slug: "tankli-yazici", sortOrder: 1 },
          ],
        },
        {
          name: "Tarayıcı", slug: "tarayici", sortOrder: 2,
          children: [
            { name: "Belge Tarayıcı", slug: "belge-tarayici", sortOrder: 0 },
            { name: "Fotoğraf Tarayıcı", slug: "fotograf-tarayici", sortOrder: 1 },
          ],
        },
        { name: "Etiket/Yazarkasa", slug: "etiket-yazarkasa", sortOrder: 3 },
        {
          name: "Sarf Malzeme", slug: "sarf-malzeme", sortOrder: 4,
          children: [
            { name: "Toner", slug: "toner", sortOrder: 0 },
            { name: "Kartuş", slug: "kartuş", sortOrder: 1 },
            { name: "Kağıt", slug: "kagit", sortOrder: 2 },
          ],
        },
      ],
    },
    {
      name: "Güç Elektroniği", slug: "guc-elektronigi", sortOrder: 5,
      children: [
        {
          name: "UPS", slug: "ups", sortOrder: 0,
          children: [
            { name: "Line-Interactive UPS", slug: "line-interactive-ups", sortOrder: 0 },
            { name: "Online UPS", slug: "online-ups", sortOrder: 1 },
            { name: "Rack UPS", slug: "rack-ups", sortOrder: 2 },
          ],
        },
        { name: "İnvertör", slug: "invertor", sortOrder: 1 },
        { name: "Adaptör & Şarj", slug: "adaptor-sarj", sortOrder: 2 },
        { name: "Pil & Akü", slug: "pil-aku", sortOrder: 3 },
        { name: "Jeneratör", slug: "jenerator", sortOrder: 4 },
      ],
    },
    {
      name: "Kablo & Aksesuar", slug: "kablo-aksesuar", sortOrder: 6,
      children: [
        { name: "USB Kablo", slug: "usb-kablo", sortOrder: 0 },
        { name: "HDMI Kablo", slug: "hdmi-kablo", sortOrder: 1 },
        {
          name: "Ethernet Kablo", slug: "ethernet-kablo", sortOrder: 2,
          children: [
            { name: "Cat5e", slug: "cat5e", sortOrder: 0 },
            { name: "Cat6", slug: "cat6", sortOrder: 1 },
            { name: "Cat6a", slug: "cat6a", sortOrder: 2 },
          ],
        },
        { name: "Çevirici & Adaptör", slug: "cevirici-adaptor", sortOrder: 3 },
        { name: "Ses & Video Kablo", slug: "ses-video-kablo", sortOrder: 4 },
        { name: "Montaj Aksesuarı", slug: "montaj-aksesuari", sortOrder: 5 },
      ],
    },
    {
      name: "Yazılım", slug: "yazilim", sortOrder: 7,
      children: [
        {
          name: "Antivirüs & Güvenlik", slug: "antivirus-guvenlik", sortOrder: 0,
          children: [
            { name: "Endpoint Security", slug: "endpoint-security", sortOrder: 0 },
            { name: "Firewall Yazılım", slug: "firewall-yazilim", sortOrder: 1 },
          ],
        },
        {
          name: "İşletim Sistemi", slug: "isletim-sistemi", sortOrder: 1,
          children: [
            { name: "Windows", slug: "windows", sortOrder: 0 },
            { name: "Linux", slug: "linux", sortOrder: 1 },
            { name: "Server OS", slug: "server-os", sortOrder: 2 },
          ],
        },
        {
          name: "Office & Verimlilik", slug: "office-verimlilik", sortOrder: 2,
          children: [
            { name: "Microsoft Office", slug: "microsoft-office", sortOrder: 0 },
            { name: "Google Workspace", slug: "google-workspace", sortOrder: 1 },
          ],
        },
        { name: "Backup & Depolama", slug: "backup-depolama", sortOrder: 3 },
        { name: "CAD & Grafik", slug: "cad-grafik", sortOrder: 4 },
        { name: "ERP/CRM", slug: "erp-crm", sortOrder: 5 },
      ],
    },
  ]

  // Recursive kategori seed fonksiyonu
  let totalCategories = 0
  async function seedCategory(
    node: CategoryNode,
    depth: number,
    parentPath: string,
    parentId: string | null
  ): Promise<void> {
    const path = depth === 0 ? node.slug : `${parentPath}/${node.slug}`
    const cat = await prisma.category.upsert({
      where: { slug: node.slug },
      update: {},
      create: {
        name: node.name,
        slug: node.slug,
        parentId: parentId,
        depth: depth,
        path: path,
        isActive: true,
        sortOrder: node.sortOrder,
      },
    })
    totalCategories++

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        await seedCategory(child, depth + 1, path, cat.id)
      }
    }
  }

  for (const root of categoryTree) {
    await seedCategory(root, 0, "", null)
  }
  console.log(`${totalCategories} kategori oluşturuldu (${categoryTree.length} root, çoklu seviye).`)

  // =========================================================
  // KAR MARJI AYARLARI
  // =========================================================

  // Global marj: %30
  await prisma.profitMargin.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      scope: "GLOBAL",
      scopeId: null,
      marginPct: 30,
      minMarginPct: 5,
      maxMarginPct: 200,
      priority: 0,
      isActive: true,
      notes: "Varsayılan global kar marjı",
    },
  })
  console.log("Global marj oluşturuldu: %30")

  // Kategori marjları
  const categoryMarginData = [
    { slug: "guvenlik-sistemleri", marginPct: 25, notes: "Güvenlik sistemleri kategorisi" },
    { slug: "network-fiber", marginPct: 28, notes: "Network & Fiber kategorisi" },
    { slug: "bilgisayar-sunucu", marginPct: 20, notes: "Bilgisayar kategorisi" },
    { slug: "kablo-aksesuar", marginPct: 35, notes: "Aksesuar kategorisi" },
  ]

  for (const data of categoryMarginData) {
    const cat = await prisma.category.findFirst({ where: { slug: data.slug } })
    if (!cat) continue
    const existing = await prisma.profitMargin.findFirst({
      where: { scope: "CATEGORY", scopeId: cat.id, deletedAt: null },
    })
    if (!existing) {
      await prisma.profitMargin.create({
        data: {
          scope: "CATEGORY",
          scopeId: cat.id,
          marginPct: data.marginPct,
          priority: 0,
          isActive: true,
          notes: data.notes,
        },
      })
    }
  }
  console.log("Kategori marjları oluşturuldu.")

  // Marka marjları
  const brandMarginData = [
    { slug: "hikvision", marginPct: 22, notes: "Hikvision marka marjı" },
    { slug: "asus", marginPct: 18, notes: "ASUS marka marjı" },
  ]

  for (const data of brandMarginData) {
    const brand = await prisma.brand.findFirst({ where: { slug: data.slug } })
    if (!brand) continue
    const existing = await prisma.profitMargin.findFirst({
      where: { scope: "BRAND", scopeId: brand.id, deletedAt: null },
    })
    if (!existing) {
      await prisma.profitMargin.create({
        data: {
          scope: "BRAND",
          scopeId: brand.id,
          marginPct: data.marginPct,
          priority: 0,
          isActive: true,
          notes: data.notes,
        },
      })
    }
  }
  console.log("Marka marjları oluşturuldu.")

  // =========================================================
  // ÖRNEK ÜRÜNLER (20 adet)
  // =========================================================

  // =========================================================
  // TEDARİKÇİLER
  // =========================================================

  const supplierB2b = await prisma.supplier.upsert({
    where: { code: "b2bdepo" },
    update: {
      name: "B2BDepo",
      websiteUrl: "https://www.b2bdepo.com",
      scraperConfig: {
        loginUrl: "https://www.b2bdepo.com",
        fields: ["bayiKodu", "kullaniciAdi", "sifre", "GuvenlikSorusu"],
        productUrl: "https://www.b2bdepo.com/urunler",
        envPrefix: "SCRAPER_B2BDEPO_",
      },
    },
    create: {
      code: "b2bdepo",
      name: "B2BDepo",
      websiteUrl: "https://www.b2bdepo.com",
      scraperType: "PLAYWRIGHT",
      scraperConfig: {
        loginUrl: "https://www.b2bdepo.com",
        fields: ["bayiKodu", "kullaniciAdi", "sifre", "GuvenlikSorusu"],
        productUrl: "https://www.b2bdepo.com/urunler",
        envPrefix: "SCRAPER_B2BDEPO_",
      },
      isActive: true,
      priority: 7,
      syncIntervalMinutes: 360,
    },
  })

  const supplierErgen = await prisma.supplier.upsert({
    where: { code: "ergen" },
    update: { name: "Ergen Elektronik", websiteUrl: "https://www.ergenelektronik.com" },
    create: {
      code: "ergen",
      name: "Ergen Elektronik",
      websiteUrl: "https://www.ergenelektronik.com",
      scraperType: "PLAYWRIGHT",
      isActive: true,
      priority: 6,
      syncIntervalMinutes: 360,
    },
  })

  await prisma.supplier.upsert({
    where: { code: "venas" },
    update: {},
    create: {
      code: "venas",
      name: "Venas",
      websiteUrl: "https://venas.com.tr",
      scraperType: "PLAYWRIGHT",
      isActive: true,
      priority: 5,
      syncIntervalMinutes: 360,
    },
  })

  await prisma.supplier.upsert({
    where: { code: "tesan" },
    update: {},
    create: {
      code: "tesan",
      name: "Tesan",
      websiteUrl: "https://isortagim.tesan.com.tr",
      scraperType: "API",
      isActive: true,
      priority: 4,
      syncIntervalMinutes: 360,
    },
  })

  await prisma.supplier.upsert({
    where: { code: "bayikanali" },
    update: {},
    create: {
      code: "bayikanali",
      name: "BayiKanalı",
      websiteUrl: "https://www.bayikanali.com",
      scraperType: "PLAYWRIGHT",
      isActive: true,
      priority: 3,
      syncIntervalMinutes: 360,
    },
  })

  await prisma.supplier.upsert({
    where: { code: "edenge" },
    update: {},
    create: {
      code: "edenge",
      name: "Edenge",
      websiteUrl: "https://www.edenge.com.tr",
      scraperType: "PLAYWRIGHT",
      isActive: true,
      priority: 2,
      syncIntervalMinutes: 360,
    },
  })

  await prisma.supplier.upsert({
    where: { code: "okisan" },
    update: {
      scraperConfig: {
        loginUrl: "https://www.okisan.com/wp-login.php",
        fields: ["log", "pwd"],
        productUrl: "https://www.okisan.com/shop",
        envPrefix: "SCRAPER_OKISAN_",
        platform: "woocommerce",
      },
    },
    create: {
      code: "okisan",
      name: "Okisan",
      websiteUrl: "https://www.okisan.com",
      scraperType: "PLAYWRIGHT",
      scraperConfig: {
        loginUrl: "https://www.okisan.com/wp-login.php",
        fields: ["log", "pwd"],
        productUrl: "https://www.okisan.com/shop",
        envPrefix: "SCRAPER_OKISAN_",
        platform: "woocommerce",
      },
      isActive: true,
      priority: 1,
      syncIntervalMinutes: 360,
    },
  })

  await prisma.supplier.upsert({
    where: { code: "bizimhesap" },
    update: { name: "BizimHesap", websiteUrl: "https://bizimhesap.com" },
    create: {
      code: "bizimhesap",
      name: "BizimHesap",
      websiteUrl: "https://bizimhesap.com",
      scraperType: "API",
      isActive: true,
      priority: 10,
      syncIntervalMinutes: 360,
    },
  })

  console.log("8 tedarikçi oluşturuldu/güncellendi.")

  // Kategori & marka ID'lerini al
  const catIpKamera = await prisma.category.findFirst({ where: { slug: "ip-kamera" } })
  const catNvrDvr = await prisma.category.findFirst({ where: { slug: "nvr" } })
  const catAlarm = await prisma.category.findFirst({ where: { slug: "alarm-sistemleri" } })
  const catSwitch = await prisma.category.findFirst({ where: { slug: "switch" } })
  const catAccessPoint = await prisma.category.findFirst({ where: { slug: "access-point" } })
  const catNotebook = await prisma.category.findFirst({ where: { slug: "notebook" } })
  const catSunucu = await prisma.category.findFirst({ where: { slug: "sunucu-server" } })
  const catSsdHdd = await prisma.category.findFirst({ where: { slug: "ssd-hdd" } })

  const brandHikvision = await prisma.brand.findFirst({ where: { slug: "hikvision" } })
  const brandDahua = await prisma.brand.findFirst({ where: { slug: "dahua" } })
  const brandTpLink = await prisma.brand.findFirst({ where: { slug: "tp-link" } })
  const brandAsus = await prisma.brand.findFirst({ where: { slug: "asus" } })
  const brandDell = await prisma.brand.findFirst({ where: { slug: "dell" } })
  const brandKingston = await prisma.brand.findFirst({ where: { slug: "kingston" } })
  const brandLogitech = await prisma.brand.findFirst({ where: { slug: "logitech" } })
  const brandUbiquiti = await prisma.brand.findFirst({ where: { slug: "ubiquiti" } })

  const productsData = [
    // --- 5 Güvenlik Ürünü ---
    {
      slug: "hikvision-ds-2cd2143g2-i-4mp-ip-kamera",
      name: "Hikvision DS-2CD2143G2-I 4MP AcuSense IP Kamera",
      barcode: "6941264088967",
      sku: "DS-2CD2143G2-I",
      modelCode: "DS-2CD2143G2-I",
      brandId: brandHikvision?.id,
      categoryId: catIpKamera?.id,
      shortDescription: "4MP çözünürlük, H.265+, IP67, IK10 vandal korumalı, 30m IR mesafeli ağ kamerası",
      description: "Hikvision DS-2CD2143G2-I, AcuSense teknolojisi sayesinde insan ve araç tespiti yapabilen 4MP çözünürlüklü IP kameradır. H.265+ sıkıştırma ile düşük bant genişliği kullanımı sağlar.",
      specs: { "Çözünürlük": "4MP (2688×1520)", "Codec": "H.265+/H.265/H.264+/H.264", "IR Mesafe": "30 metre", "IP Sınıfı": "IP67, IK10", "Lens": "2.8mm", "Gece Görüş": "True WDR 120dB" },
      images: ["https://www.hikvision.com/content/dam/hikvision/products/S000000001/M000000050/A0000001/img/image-2.png"],
      weight: 0.45,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: true,
      isNew: false,
      purchasePrice: 1250.00,
      purchasePrice2: 1280.00,
      stockQty: 45,
      stockQty2: 30,
    },
    {
      slug: "dahua-ipc-hdw2849h-asm-pv-8mp-ip-kamera",
      name: "Dahua IPC-HDW2849H-ASM-PV 8MP Full Color IP Kamera",
      barcode: "6939554983452",
      sku: "IPC-HDW2849H",
      modelCode: "IPC-HDW2849H-ASM-PV",
      brandId: brandDahua?.id,
      categoryId: catIpKamera?.id,
      shortDescription: "8MP tam renkli gece görüş, akıllı hareket algılama, sesli uyarı",
      description: "Dahua IPC-HDW2849H-ASM-PV, 8MP çözünürlük ve tam renkli gece görüşü ile 24 saat renkli görüntü sunan akıllı IP kameradır.",
      specs: { "Çözünürlük": "8MP (3840×2160)", "Gece Görüş": "Full Color", "Lens": "2.8mm", "IP Sınıfı": "IP67", "AI": "SMD 3.0", "Ses": "Dahili mikrofon & hoparlör" },
      images: ["https://dahuasecurity.com/uploads/image/product/20230301/637_1.jpg"],
      weight: 0.38,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: false,
      isNew: true,
      purchasePrice: 980.00,
      purchasePrice2: 1010.00,
      stockQty: 62,
      stockQty2: 25,
    },
    {
      slug: "hikvision-ds-7616nxi-k2-16-kanal-nvr",
      name: "Hikvision DS-7616NXI-K2 16 Kanal 4K NVR",
      barcode: "6941264091622",
      sku: "DS-7616NXI-K2",
      modelCode: "DS-7616NXI-K2",
      brandId: brandHikvision?.id,
      categoryId: catNvrDvr?.id,
      shortDescription: "16 kanal, 4K desteği, 2 HDD yuvası, H.265+, AcuSense NVR",
      description: "Hikvision DS-7616NXI-K2, 16 kanala kadar IP kamera bağlantısı destekleyen, 4K çözünürlüklü NVR kayıt cihazıdır. AcuSense teknolojisi ile yapay zeka destekli analitik sunar.",
      specs: { "Kanal Sayısı": "16", "Kayıt Çözünürlüğü": "4K/8MP", "HDD Yuvası": "2", "Max HDD": "2×10TB", "Çıkış": "HDMI/VGA", "AI": "AcuSense" },
      images: [],
      weight: 1.8,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: true,
      isNew: false,
      purchasePrice: 4200.00,
      purchasePrice2: 4350.00,
      stockQty: 18,
      stockQty2: 8,
    },
    {
      slug: "dahua-sd-49425xb-hnr-ptz-kamera",
      name: "Dahua SD49425XB-HNR 4MP 25x Optik PTZ IP Kamera",
      barcode: "6939554965472",
      sku: "SD49425XB-HNR",
      modelCode: "SD49425XB-HNR",
      brandId: brandDahua?.id,
      categoryId: catIpKamera?.id,
      shortDescription: "4MP, 25x optik zoom, AI algılama, 100m IR mesafe, Speed Dome PTZ kamera",
      description: "Dahua SD49425XB-HNR, 25x optik zoom kapasiteli, 4MP çözünürlüklü speed dome PTZ kameradır. Gelişmiş yapay zeka analitiği ve 100 metre IR aydınlatma mesafesiyle üstün gece görüşü sağlar.",
      specs: { "Çözünürlük": "4MP", "Optik Zoom": "25x", "IR Mesafe": "100 metre", "Pan": "360° sürekli", "Tilt": "-15° ~ 90°", "IP Sınıfı": "IP66, IK10" },
      images: [],
      weight: 3.2,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 8500.00,
      purchasePrice2: 8750.00,
      stockQty: 7,
      stockQty2: 4,
    },
    {
      slug: "hikvision-ds-pd1-e18-we-pir-alarm-sensoru",
      name: "Hikvision DS-PD1-E18-WE Kablosuz PIR Hareket Sensörü",
      barcode: "6941264093831",
      sku: "DS-PD1-E18-WE",
      modelCode: "DS-PD1-E18-WE",
      brandId: brandHikvision?.id,
      categoryId: catAlarm?.id,
      shortDescription: "18m algılama mesafesi, 868MHz, pil ile çalışır, anti-masking",
      description: "Hikvision DS-PD1-E18-WE, 18 metre algılama mesafeli kablosuz PIR hareket sensörüdür. 868MHz frekansında çalışır ve 4 yıla kadar pil ömrü sunar.",
      specs: { "Algılama Mesafesi": "18 metre", "Frekans": "868MHz", "Pil": "2×3.6V Li", "Pil Ömrü": "4 yıl", "IP Sınıfı": "IP54", "Sıcaklık": "-10°C ~ +55°C" },
      images: [],
      weight: 0.12,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 320.00,
      purchasePrice2: 335.00,
      stockQty: 120,
      stockQty2: 85,
    },
    // --- 5 Network Ürünü ---
    {
      slug: "tp-link-tl-sg1024de-24-port-gigabit-switch",
      name: "TP-Link TL-SG1024DE 24 Port Gigabit Kolay Akıllı Switch",
      barcode: "6935364090327",
      sku: "TL-SG1024DE",
      modelCode: "TL-SG1024DE",
      brandId: brandTpLink?.id,
      categoryId: catSwitch?.id,
      shortDescription: "24 port gigabit, VLAN, QoS, yönetilebilir L2+ switch, rafa monte",
      description: "TP-Link TL-SG1024DE, 24 adet gigabit porta sahip kolay akıllı switch modelidir. VLAN, QoS, IGMP Snooping gibi gelişmiş ağ özelliklerini basit arayüz üzerinden yönetmenize olanak tanır.",
      specs: { "Port Sayısı": "24x Gigabit", "Switching Kapasitesi": "48Gbps", "VLAN": "802.1Q VLAN", "QoS": "L2/L3/L4", "Boyut": "440×220×44mm", "Güç": "Max 8.4W" },
      images: [],
      weight: 2.1,
      warrantyMonths: 36,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 1450.00,
      purchasePrice2: 1490.00,
      stockQty: 32,
      stockQty2: 15,
    },
    {
      slug: "ubiquiti-unifi-uap-ac-pro-access-point",
      name: "Ubiquiti UniFi UAP-AC-PRO Dual Band Access Point",
      barcode: "0817882020060",
      sku: "UAP-AC-PRO",
      modelCode: "UAP-AC-PRO",
      brandId: brandUbiquiti?.id,
      categoryId: catAccessPoint?.id,
      shortDescription: "802.11ac Wave 2, 2.4GHz+5GHz, 1300Mbps, PoE, kurumsal Wi-Fi",
      description: "Ubiquiti UniFi UAP-AC-PRO, kurumsal ortamlar için tasarlanmış yüksek performanslı çift bantlı Wi-Fi access point'tir. MU-MIMO teknolojisi ile eş zamanlı çok kullanıcı desteği sunar.",
      specs: { "Standart": "802.11ac Wave 2", "2.4GHz Hız": "450Mbps", "5GHz Hız": "1300Mbps", "Anten": "3×3 MIMO", "Beslenme": "PoE 802.3af/at", "Kapsama": "122 metre" },
      images: [],
      weight: 0.35,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: true,
      isNew: false,
      purchasePrice: 2800.00,
      purchasePrice2: 2900.00,
      stockQty: 22,
      stockQty2: 10,
    },
    {
      slug: "tp-link-er7206-omada-vpn-router",
      name: "TP-Link ER7206 Omada Multi-WAN VPN Yönlendirici",
      barcode: "6935364099825",
      sku: "ER7206",
      modelCode: "ER7206",
      brandId: brandTpLink?.id,
      categoryId: catSwitch?.id,
      shortDescription: "5 WAN portu, OpenVPN, IPsec, L2TP, kurumsal VPN router",
      description: "TP-Link ER7206, kurumsal ağlar için tasarlanmış yüksek performanslı multi-WAN VPN yönlendiricidir. Omada SDN ile merkezi yönetim desteği sunar.",
      specs: { "WAN Portu": "5 (1x SFP + 4x Gigabit)", "LAN Portu": "1x Gigabit", "VPN": "OpenVPN, IPsec, L2TP, PPTP", "Firewall": "SPI Firewall", "İşlemci": "Quad-Core", "Yönetim": "Omada SDN" },
      images: [],
      weight: 1.4,
      warrantyMonths: 36,
      isActive: true,
      isFeatured: false,
      isNew: true,
      purchasePrice: 3200.00,
      purchasePrice2: 3300.00,
      stockQty: 14,
      stockQty2: 6,
    },
    {
      slug: "ubiquiti-unifi-us-24-poe-switch",
      name: "Ubiquiti UniFi US-24-250W 24 Port PoE Managed Switch",
      barcode: "0817882025249",
      sku: "US-24-250W",
      modelCode: "US-24-250W",
      brandId: brandUbiquiti?.id,
      categoryId: catSwitch?.id,
      shortDescription: "24x gigabit PoE+, 2x SFP, 250W toplam PoE bütçesi, L2 managed switch",
      description: "Ubiquiti UniFi US-24-250W, 24 adet PoE+ portlu, toplam 250W PoE bütçesi sunan yönetilebilir kurumsal switch modelidir.",
      specs: { "Port Sayısı": "24x Gigabit PoE+", "SFP": "2x SFP", "PoE Bütçesi": "250W", "Switching Kapasitesi": "52Gbps", "Yönetim": "UniFi Controller", "Boyut": "1U Rack Mount" },
      images: [],
      weight: 3.8,
      warrantyMonths: 12,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 12500.00,
      purchasePrice2: 12800.00,
      stockQty: 8,
      stockQty2: 3,
    },
    {
      slug: "tp-link-tl-sg1008p-8-port-poe-switch",
      name: "TP-Link TL-SG1008P 8 Port Gigabit PoE Switch",
      barcode: "6935364051823",
      sku: "TL-SG1008P",
      modelCode: "TL-SG1008P",
      brandId: brandTpLink?.id,
      categoryId: catSwitch?.id,
      shortDescription: "4 port PoE+, 4 port normal gigabit, 53W PoE bütçesi, masaüstü",
      description: "TP-Link TL-SG1008P, küçük ofis ve SOHO ortamları için ideal, 4 adet PoE+ portlu gigabit switch modelidir.",
      specs: { "Toplam Port": "8x Gigabit", "PoE Port": "4x PoE+", "PoE Bütçesi": "53W", "Switching Kapasitesi": "16Gbps", "Boyut": "158×101×25mm", "Yönetim": "Yönetilemez" },
      images: [],
      weight: 0.45,
      warrantyMonths: 36,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 620.00,
      purchasePrice2: 640.00,
      stockQty: 85,
      stockQty2: 55,
    },
    // --- 5 Bilgisayar Ürünü ---
    {
      slug: "asus-expertbook-b1-b1500-i7-notebook",
      name: "ASUS ExpertBook B1 B1500CBA i7-1255U 16GB 512GB SSD Notebook",
      barcode: "4711387276877",
      sku: "B1500CBA-BQ0834X",
      modelCode: "B1500CBA",
      brandId: brandAsus?.id,
      categoryId: catNotebook?.id,
      shortDescription: "Intel Core i7-1255U, 16GB DDR4, 512GB SSD, 15.6\" FHD, Windows 11 Pro",
      description: "ASUS ExpertBook B1, iş dünyası için tasarlanmış dayanıklı ve güvenilir profesyonel notebook serisidir. MIL-STD-810H sertifikalı gövdesiyle zorlu koşullara dayanıklıdır.",
      specs: { "İşlemci": "Intel Core i7-1255U", "RAM": "16GB DDR4-3200", "Depolama": "512GB NVMe SSD", "Ekran": "15.6\" FHD IPS Anti-glare", "İşletim Sistemi": "Windows 11 Pro", "Pil": "50Wh (yaklaşık 12 saat)" },
      images: [],
      weight: 1.7,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: true,
      isNew: false,
      purchasePrice: 18500.00,
      purchasePrice2: 19000.00,
      stockQty: 12,
      stockQty2: 5,
    },
    {
      slug: "dell-poweredge-r350-sunucu",
      name: "Dell PowerEdge R350 Intel Xeon E-2336 32GB 2TB Sunucu",
      barcode: "5397184632726",
      sku: "R350-XE2336-32-2TB",
      modelCode: "PowerEdge R350",
      brandId: brandDell?.id,
      categoryId: catSunucu?.id,
      shortDescription: "1U rack sunucu, Xeon E-2336, 32GB ECC RAM, 2TB SATA, RAID kontrolcü",
      description: "Dell PowerEdge R350, küçük ve orta ölçekli işletmeler için tasarlanmış 1U rack mount sunucudur. Intel Xeon E-2300 ailesi işlemciler ve gelişmiş güvenlik özellikleriyle iş yüklerinizi güvenle taşır.",
      specs: { "İşlemci": "Intel Xeon E-2336 (6 çekirdek)", "RAM": "32GB DDR4 ECC UDIMM", "Depolama": "2×1TB SATA 7.2K", "RAID": "PERC H355 Adapter", "Güç Kaynağı": "2×600W redundant", "Form Faktör": "1U Rack Mount" },
      images: [],
      weight: 12.5,
      warrantyMonths: 36,
      isActive: true,
      isFeatured: true,
      isNew: false,
      purchasePrice: 45000.00,
      purchasePrice2: 46500.00,
      stockQty: 4,
      stockQty2: 2,
    },
    {
      slug: "asus-pro-b760m-ct-d4-anakart",
      name: "ASUS Pro B760M-CT-D4 Intel B760 DDR4 mATX Anakart",
      barcode: "4711387406893",
      sku: "Pro B760M-CT-D4",
      modelCode: "Pro B760M-CT-D4",
      brandId: brandAsus?.id,
      categoryId: catNotebook?.id,
      shortDescription: "Intel B760, LGA1700, DDR4, PCIe 4.0, M.2, mATX form faktör",
      description: "ASUS Pro B760M-CT-D4, Intel 12./13. nesil işlemciler için tasarlanmış profesyonel sınıf mATX anakart modelidir. Güvenilir bileşen seçimi ve uzun ömürlü kapasitörler ile kurumsal kullanım için uygundur.",
      specs: { "Soket": "LGA1700", "Chipset": "Intel B760", "RAM": "2x DDR4 DIMM (Max 64GB)", "PCIe": "PCIe 5.0 x16 + PCIe 3.0 x1", "M.2": "2× M.2 (PCIe 4.0/SATA)", "LAN": "Intel I219V 1Gbps" },
      images: [],
      weight: 0.58,
      warrantyMonths: 36,
      isActive: true,
      isFeatured: false,
      isNew: true,
      purchasePrice: 3800.00,
      purchasePrice2: 3900.00,
      stockQty: 25,
      stockQty2: 12,
    },
    {
      slug: "dell-optiplex-3000-i5-masaustu-bilgisayar",
      name: "Dell OptiPlex 3000 MT i5-12500 8GB 256GB SSD Windows 11 Pro",
      barcode: "5397184560166",
      sku: "OptiPlex3000-MT-i5",
      modelCode: "OptiPlex 3000 MT",
      brandId: brandDell?.id,
      categoryId: catNotebook?.id,
      shortDescription: "Intel Core i5-12500, 8GB DDR4, 256GB SSD, Mini Tower, Windows 11 Pro",
      description: "Dell OptiPlex 3000 MT, ofis ortamları için tasarlanmış güvenilir ve yönetilebilir masaüstü bilgisayardır. Entegre yönetim araçları ve kurumsal destek seçenekleriyle BT yönetimini kolaylaştırır.",
      specs: { "İşlemci": "Intel Core i5-12500 (6 çekirdek)", "RAM": "8GB DDR4-3200", "Depolama": "256GB M.2 PCIe SSD", "Grafik": "Intel UHD 770", "İşletim Sistemi": "Windows 11 Pro", "Form Faktör": "Mini Tower" },
      images: [],
      weight: 6.8,
      warrantyMonths: 36,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 14500.00,
      purchasePrice2: 14900.00,
      stockQty: 9,
      stockQty2: 4,
    },
    {
      slug: "asus-vivobook-15-x1504za-i5-notebook",
      name: "ASUS Vivobook 15 X1504ZA i5-1235U 8GB 512GB SSD 15.6\" Notebook",
      barcode: "4711387375143",
      sku: "X1504ZA-BQ407W",
      modelCode: "X1504ZA",
      brandId: brandAsus?.id,
      categoryId: catNotebook?.id,
      shortDescription: "Intel Core i5-1235U, 8GB RAM, 512GB SSD, Windows 11 Home, bütçe dostu",
      description: "ASUS Vivobook 15 X1504ZA, günlük kullanım için üretilmiş kompakt ve hafif notebook modelidir. Intel Evo platformu sayesinde hızlı şarj ve uzun pil ömrü sunar.",
      specs: { "İşlemci": "Intel Core i5-1235U", "RAM": "8GB LPDDR4X", "Depolama": "512GB PCIe SSD", "Ekran": "15.6\" FHD (1920×1080)", "İşletim Sistemi": "Windows 11 Home", "Ağırlık": "1.7 kg" },
      images: [],
      weight: 1.7,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 12000.00,
      purchasePrice2: 12400.00,
      stockQty: 18,
      stockQty2: 8,
    },
    // --- 5 Aksesuar ---
    {
      slug: "kingston-a2000-500gb-nvme-m2-ssd",
      name: "Kingston A2000 500GB NVMe M.2 PCIe SSD",
      barcode: "0740617298888",
      sku: "SA2000M8/500G",
      modelCode: "SA2000M8",
      brandId: brandKingston?.id,
      categoryId: catSsdHdd?.id,
      shortDescription: "500GB M.2 2280, PCIe 3.0 NVMe, 2200MB/s okuma, 2000MB/s yazma",
      description: "Kingston A2000, PCIe 3.0 arayüzlü yüksek performanslı NVMe SSD modelidir. NVMe teknolojisi sayesinde SATA SSD'lere kıyasla çok daha hızlı veri aktarım hızı sunar.",
      specs: { "Kapasite": "500GB", "Arayüz": "PCIe 3.0 x4 NVMe", "Form Faktör": "M.2 2280", "Okuma Hızı": "2200 MB/s", "Yazma Hızı": "2000 MB/s", "Garanti": "5 yıl" },
      images: [],
      weight: 0.008,
      warrantyMonths: 60,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 680.00,
      purchasePrice2: 695.00,
      stockQty: 150,
      stockQty2: 95,
    },
    {
      slug: "kingston-fury-beast-32gb-ddr5-5600-ram",
      name: "Kingston FURY Beast 32GB DDR5 5600MHz CL36 RAM Kit (2×16GB)",
      barcode: "0740617336474",
      sku: "KF556C36BBEK2-32",
      modelCode: "KF556C36BBEK2",
      brandId: brandKingston?.id,
      categoryId: catSsdHdd?.id,
      shortDescription: "32GB (2×16GB) DDR5, 5600MHz, CL36, XMP 3.0, Intel/AMD uyumlu",
      description: "Kingston FURY Beast DDR5, en son nesil platformlar için tasarlanmış yüksek performanslı çift kanal RAM kitidir. XMP 3.0 desteği ile kolayca hız ayarı yapılabilir.",
      specs: { "Kapasite": "32GB (2×16GB)", "Tip": "DDR5", "Hız": "5600MHz", "Gecikme": "CL36", "Voltaj": "1.25V", "XMP": "XMP 3.0" },
      images: [],
      weight: 0.06,
      warrantyMonths: 999,
      isActive: true,
      isFeatured: false,
      isNew: true,
      purchasePrice: 2800.00,
      purchasePrice2: 2850.00,
      stockQty: 60,
      stockQty2: 40,
    },
    {
      slug: "logitech-mx-master-3s-mouse",
      name: "Logitech MX Master 3S Kablosuz Ergonomik Mouse",
      barcode: "5099206103528",
      sku: "910-006559",
      modelCode: "MX Master 3S",
      brandId: brandLogitech?.id,
      categoryId: catSsdHdd?.id,
      shortDescription: "8000 DPI, sessiz tıklama, ergonomik tasarım, USB-C şarj, Logi Bolt",
      description: "Logitech MX Master 3S, geliştiriciler ve yaratıcı profesyoneller için tasarlanmış amiral gemisi kablosuz mouse modelidir. 8000 DPI hassasiyeti ve MagSpeed elektromanyetik kaydırma tekerleği ile üstün kontrol sunar.",
      specs: { "DPI": "200-8000 (ayarlanabilir)", "Bağlantı": "Logi Bolt USB / Bluetooth", "Pil Ömrü": "70 gün (tam şarj)", "Şarj": "USB-C", "Düğme Sayısı": "7", "Uyumluluk": "Windows/macOS/Linux/ChromeOS" },
      images: [],
      weight: 0.141,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 1350.00,
      purchasePrice2: 1380.00,
      stockQty: 45,
      stockQty2: 30,
    },
    {
      slug: "logitech-mk470-slim-klavye-mouse-set",
      name: "Logitech MK470 Slim Kablosuz Klavye Mouse Seti",
      barcode: "5099206085718",
      sku: "920-009205",
      modelCode: "MK470",
      brandId: brandLogitech?.id,
      categoryId: catSsdHdd?.id,
      shortDescription: "Sessiz Türkçe klavye, kablosuz mouse, USB nano alıcı, Unifying",
      description: "Logitech MK470, minimalist tasarımlı, sessize alınmış tuşlara sahip kompakt kablosuz klavye ve mouse setidir. Tek USB alıcı ile her iki cihazı birden yönetir.",
      specs: { "Klavye Bağlantı": "Logi Bolt USB", "Mouse Bağlantı": "Logi Bolt USB (Unified)", "Klavye Pil": "2×AAA (24 ay)", "Mouse Pil": "1×AA (18 ay)", "Alıcı": "USB Nano", "Dil": "Türkçe Q" },
      images: [],
      weight: 0.52,
      warrantyMonths: 24,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 580.00,
      purchasePrice2: 595.00,
      stockQty: 78,
      stockQty2: 50,
    },
    {
      slug: "kingston-datatraveler-exodia-128gb-usb-32",
      name: "Kingston DataTraveler Exodia 128GB USB 3.2 Gen 1 Flash Bellek",
      barcode: "0740617307948",
      sku: "DTX/128GB",
      modelCode: "DTX",
      brandId: brandKingston?.id,
      categoryId: catSsdHdd?.id,
      shortDescription: "128GB, USB 3.2 Gen 1, 40MB/s okuma, renkli kapak, anahtarlık deliği",
      description: "Kingston DataTraveler Exodia, günlük kullanım için ideal, kapağı kaybolmayan tasarımıyla dikkat çeken USB 3.2 flash bellek modelidir.",
      specs: { "Kapasite": "128GB", "Arayüz": "USB 3.2 Gen 1", "Okuma Hızı": "40 MB/s", "Yazma Hızı": "10 MB/s", "Boyut": "77.9×21.4×9.9 mm", "Garanti": "5 yıl" },
      images: [],
      weight: 0.01,
      warrantyMonths: 60,
      isActive: true,
      isFeatured: false,
      isNew: false,
      purchasePrice: 185.00,
      purchasePrice2: 190.00,
      stockQty: 200,
      stockQty2: 150,
    },
  ]

  let productCount = 0
  for (const p of productsData) {
    const existingProduct = await prisma.product.findFirst({ where: { slug: p.slug } })
    if (existingProduct) continue

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        barcode: p.barcode,
        sku: p.sku,
        modelCode: p.modelCode,
        brandId: p.brandId ?? null,
        categoryId: p.categoryId ?? null,
        shortDescription: p.shortDescription,
        description: p.description,
        specs: p.specs,
        images: p.images,
        weight: p.weight,
        warrantyMonths: p.warrantyMonths,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        isOutlet: false,
        minOrderQuantity: 1,
        unit: "ADET",
      },
    })

    // Tedarikçi 1 (B2BDepo)
    const sp1 = await prisma.supplierProduct.create({
      data: {
        supplierId: supplierB2b.id,
        productId: product.id,
        externalName: p.name,
        purchasePrice: p.purchasePrice,
        currency: "TRY",
        vatRate: 20,
        stockQuantity: p.stockQty,
        isAvailable: p.stockQty > 0,
        matchMethod: "BARCODE",
        matchConfidence: 95,
        lastScrapedAt: new Date(),
      },
    })

    // Fiyat geçmişi kaydı
    await prisma.priceHistory.create({
      data: {
        supplierProductId: sp1.id,
        oldPrice: p.purchasePrice * 0.92,
        newPrice: p.purchasePrice,
        priceChangePct: 8.7,
        recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Tedarikçi 2 (Ergen)
    await prisma.supplierProduct.create({
      data: {
        supplierId: supplierErgen.id,
        productId: product.id,
        externalName: p.name,
        purchasePrice: p.purchasePrice2,
        currency: "TRY",
        vatRate: 20,
        stockQuantity: p.stockQty2,
        isAvailable: p.stockQty2 > 0,
        matchMethod: "BARCODE",
        matchConfidence: 90,
        lastScrapedAt: new Date(),
      },
    })

    productCount++
  }

  console.log(`${productCount} örnek ürün oluşturuldu.`)

  // =========================================================
  // EK TEST BAYİLERİ
  // =========================================================

  const dealer2PasswordHash = await bcrypt.hash("test123", 12)
  const dealer2 = await prisma.customer.upsert({
    where: { dealerCode: "NAT-1001" },
    update: {},
    create: {
      dealerCode: "NAT-1001",
      passwordHash: dealer2PasswordHash,
      companyName: "Yıldız Teknoloji A.Ş.",
      tradeName: "Yıldız Tech",
      contactName: "Fatma Şahin",
      contactTitle: "Satın Alma Müdürü",
      phone: "05321234567",
      email: "fatma@yildiztech.com",
      city: "Ankara",
      taxOffice: "Çankaya",
      taxNumber: "1234567890",
      status: "APPROVED",
      approvedAt: new Date(),
      balance: -15000,
      creditLimit: 100000,
      discountRate: 8,
    },
  })
  console.log(`Bayi oluşturuldu: ${dealer2.dealerCode} — ${dealer2.companyName} (APPROVED)`)

  const dealer3PasswordHash = await bcrypt.hash("test123", 12)
  const dealer3 = await prisma.customer.upsert({
    where: { dealerCode: "NAT-1002" },
    update: {},
    create: {
      dealerCode: "NAT-1002",
      passwordHash: dealer3PasswordHash,
      companyName: "Mega Bilişim Ltd. Şti.",
      tradeName: "Mega BT",
      contactName: "Kemal Demir",
      phone: "05429876543",
      email: "kemal@megabilisim.com",
      city: "İzmir",
      status: "PENDING",
      balance: 0,
      creditLimit: 0,
      discountRate: 0,
    },
  })
  console.log(`Bayi oluşturuldu: ${dealer3.dealerCode} — ${dealer3.companyName} (PENDING)`)

  const dealer4PasswordHash = await bcrypt.hash("test123", 12)
  const dealer4 = await prisma.customer.upsert({
    where: { dealerCode: "NAT-1003" },
    update: {},
    create: {
      dealerCode: "NAT-1003",
      passwordHash: dealer4PasswordHash,
      companyName: "Pro Network Sistemleri",
      contactName: "Ali Kaya",
      phone: "05551112233",
      email: "ali@pronetwork.com.tr",
      city: "Bursa",
      taxOffice: "Osmangazi",
      taxNumber: "9876543210",
      status: "SUSPENDED",
      approvedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      balance: 8500,
      creditLimit: 50000,
      discountRate: 5,
      notes: "Ödeme gecikmesi nedeniyle askıya alındı.",
    },
  })
  console.log(`Bayi oluşturuldu: ${dealer4.dealerCode} — ${dealer4.companyName} (SUSPENDED)`)

  // =========================================================
  // TEST BAŞVURULARI
  // =========================================================

  const app1 = await prisma.dealerApplication.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyName: "Akıllı Sistemler Ltd. Şti.",
      contactName: "Selin Yıldız",
      phone: "05441234567",
      email: "selin@akillisistemler.com",
      taxOffice: "Bağcılar",
      taxNumber: "5544332211",
      address: "Bağcılar Mah. Teknoloji Cad. No:42",
      city: "İstanbul",
      businessType: "Güvenlik Sistemleri",
      referenceInfo: "Bir müşterimizin tavsiyesi üzerine başvurduk.",
      status: "PENDING",
    },
  })
  console.log(`Başvuru oluşturuldu: ${app1.companyName} (PENDING)`)

  const app2 = await prisma.dealerApplication.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      companyName: "Dijital Çözümler A.Ş.",
      contactName: "Murat Arslan",
      phone: "05387654321",
      email: "murat@dijitalcozumler.com.tr",
      city: "Gaziantep",
      businessType: "Bilgisayar ve Elektronik Toptan",
      status: "PENDING",
    },
  })
  console.log(`Başvuru oluşturuldu: ${app2.companyName} (PENDING)`)

  // =========================================================
  // BAY001 İÇİN TEST CARİ HAREKETLERİ
  // =========================================================

  const existingTx = await prisma.accountTransaction.findFirst({
    where: { customerId: dealer.id },
  })

  if (!existingTx) {
    let runningBalance = 0

    const txData = [
      {
        type: "OPENING_BALANCE" as const,
        amount: 0,
        description: "Açılış bakiyesi",
        referenceType: "MANUAL",
        daysAgo: 60,
      },
      {
        type: "INVOICE" as const,
        amount: 12500,
        description: "Sipariş #NAT-000001 faturası",
        referenceType: "ORDER",
        daysAgo: 45,
      },
      {
        type: "PAYMENT" as const,
        amount: -12500,
        description: "EFT ödemesi - Garanti Bankası",
        referenceType: "MANUAL",
        daysAgo: 42,
      },
      {
        type: "INVOICE" as const,
        amount: 8750,
        description: "Sipariş #NAT-000002 faturası",
        referenceType: "ORDER",
        daysAgo: 20,
      },
      {
        type: "PAYMENT" as const,
        amount: -5000,
        description: "Kısmi ödeme - Havale",
        referenceType: "MANUAL",
        daysAgo: 10,
      },
    ]

    for (const tx of txData) {
      runningBalance += tx.amount
      await prisma.accountTransaction.create({
        data: {
          customerId: dealer.id,
          type: tx.type,
          amount: tx.amount,
          balanceAfter: runningBalance,
          description: tx.description,
          referenceType: tx.referenceType,
          createdAt: new Date(Date.now() - tx.daysAgo * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Bakiyeyi güncelle
    await prisma.customer.update({
      where: { id: dealer.id },
      data: { balance: runningBalance },
    })

    console.log(`BAY001 için 5 cari hareket oluşturuldu. Bakiye: ${runningBalance} TRY`)
  } else {
    console.log("BAY001 cari hareketleri zaten mevcut, atlandı.")
  }

  console.log("Seed tamamlandı.")
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
