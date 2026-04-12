import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pathsToMerge = [
  'ag-ve-network-urunleri/switch-urunleri/data-non-poe-switchler',
  'network-urunleri/switch-urunleri-1/datanon-poe-switchler',
  'guvenlik-urunleri/kayit-cihazlari/dvr-cihazlar-1',
  'guvenlik-cctv-urunleri/kayit-cihazlari-guvenlik/dvr-cihazlar',
  'kablo-cevirici/ceviriciler/goruntu-aktaricilar',
  'kablo-aksesuar-ceviriciler/goruntu-aktaricilar-ka',
  'guvenlik-urunleri/kayit-cihazlari',
  'guvenlik-cctv-urunleri/kayit-cihazlari-guvenlik',
  'kesintisiz-guc-kaynaklari',
  'kesintisiz-guc-kaynaklari-1',
  'ag-ve-network-urunleri/network-sarf/konnektor',
  'network-urunleri/network-sarf-1/konnektor-1',
  'guvenlik-urunleri/guvenlik-aksesuarlari-1/kontrol-klavyesi-1',
  'guvenlik-cctv-urunleri/guvenlik-aksesuarlari/kontrol-klavyesi',
  'kablo-cevirici/coklayicilar/kvm-switch',
  'kablo-aksesuar-ceviriciler/coklayicilar-ka/kvm-switch-ka',
  'kesintisiz-guc-kaynaklari/line-interactive-ups',
  'kesintisiz-guc-kaynaklari-1/line-interactive-ups-1',
  'bilgisayar-bilesenleri/bellekler/masaustu-bellekler',
  'bilgisayar-bilesenleri-1/bellekler-1/masaustu-bellekler-1',
  'kisisel-bilgisayarlar/masaustu-bilgisayar/masaustu-bilgisayarlar-1',
  'masaustu-bilgisayarlar',
  'kisisel-bilgisayarlar/is-istasyonlari/masaustu-is-istasyonlari',
  'i-s-i-stasyonlari/masaustu-i-s-i-stasyonlari',
  'seslendirme-sistemleri/mikrofonlar',
  'guvenlik-urunleri/ses-sistemleri/mikrofonlar-1',
  'network-urunleri/network-sarf-1',
  'ag-ve-network-urunleri/network-sarf',
  'bilgisayar-bilesenleri/bellekler/notebook-bellekler',
  'bilgisayar-bilesenleri-1/bellekler-1/notebook-bellekler-1',
  'guvenlik-urunleri/kayit-cihazlari/nvr-cihazlar-1',
  'guvenlik-cctv-urunleri/kayit-cihazlari-guvenlik/nvr-cihazlar',
  'yazilim-ve-lisanslar/sunucu-lisanslari/oem-rok-lisans',
  'yazilim/sunucu-lisanslari-1/oem-rok-lisans-1',
  'yazilim-ve-lisanslar/isletim-sistemleri/oem-lisans',
  'yazilim/isletim-sistemleri-1/oem-lisans-1',
  'yazilim-ve-lisanslar/ofis-yazilimlari',
  'yazilim/ofis-yazilimlari-1',
  'kesintisiz-guc-kaynaklari/online-ups',
  'kesintisiz-guc-kaynaklari-1/online-ups-1',
  'otvt-barkod-pdks/pdks-biyometrik-sistemleri/parmak-izi-sistemleri-1',
  'gecis-kontrol-sistemleri/parmak-izi-sistemleri',
  'ag-ve-network-urunleri/ag-kablolari/patch-kablolari',
  'network-urunleri/ag-kablolari-1/patch-kablolar',
  'ag-ve-network-urunleri/switch-urunleri/patch-panel',
  'network-urunleri/patch-panel-1',
  'ag-ve-network-urunleri/ag-iletisim-urunleri/poe-adaptor-enjector',
  'network-urunleri/ag-iletisim-urunleri-1/poe-adaptorenjector',
  'ag-ve-network-urunleri/switch-urunleri/poe-switchler',
  'network-urunleri/switch-urunleri-1/poe-switchler-1',
  'bilgisayar-bilesenleri/power-supply',
  'bilgisayar-bilesenleri-1/bilgisayar-kasalari/power-supply-1',
  'bilgisayar-ve-donanimlari/bilgisayar-bilesenleri/harddiskler/sata-harddiskler',
  'bilgisayar-bilesenleri-1/harddiskler-1/sata-harddiskler-1',
  'ag-ve-network-urunleri/switch-urunleri/sfp-gbic-modul',
  'network-urunleri/switch-urunleri-1/sfpgbic-modul',
  'ag-ve-network-urunleri/network-sarf/sonlandirma-urunleri',
  'network-urunleri/fiber-urunler-1/sonlandirma-urunleri-1',
  'bilgisayar-ve-donanimlari/bilgisayar-bilesenleri/harddiskler/ssd-diskler',
  'bilgisayar-bilesenleri-1/harddiskler-1/ssd-diskler-1',
  'kurumsal-urunler/sunucu-aksesuarlari-1/sunucu-aksamlari-1',
  'sunucular/sunucu-aksamlari',
  'yazilim-ve-lisanslar/sunucu-lisanslari',
  'yazilim/sunucu-lisanslari-1',
  'ag-ve-network-urunleri/switch-urunleri',
  'network-urunleri/switch-urunleri-1',
  'bilgisayar-ve-donanimlari/bilgisayar-bilesenleri/harddiskler/tasinabilir-hdd',
  'bilgisayar-bilesenleri-1/harddiskler-1/tasinabilir-hdd-1',
  'bilgisayar-ve-donanimlari/bilgisayar-bilesenleri/harddiskler/tasinabilir-ssd',
  'bilgisayar-bilesenleri-1/harddiskler-1/tasinabilir-ssd-1',
  'guvenlik-urunleri/termal-isi-olcer-1',
  'guvenlik-cctv-urunleri/termal-isi-olcer',
  'bilgisayar-bilesenleri-1/bellekler-1/usb-bellekler-1',
  'usb-bellekler',
  'kablo-cevirici/ceviriciler/usb-cevirici',
  'kablo-aksesuar-ceviriciler/ceviriciler-ka/usb-cevirici-ka',
  'kurumsal-urunler/video-konferans-cihazlari',
  'kurumsal-urunler/video-konferans-cozumleri/video-konferans-cihazlari-1',
  'guvenlik-urunleri/intercom-urunleri-1/villa-setleri-1',
  'guvenlik-cctv-urunleri/intercom-urunleri/villa-setleri',
  'guvenlik-urunleri/alarm-sistemleri/yangin-alarm-sistemleri',
  'guvenlik-cctv-urunleri/alarm-sistemleri-guvenlik/yangin-alarm-sistemleri-g',
  'kablo-cevirici/ceviriciler',
  'kablo-aksesuar-ceviriciler/ceviriciler-ka',
  'kablo-cevirici/coklayicilar',
  'kablo-aksesuar-ceviriciler/coklayicilar-ka'
];

async function main() {
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
      path: { in: pathsToMerge }
    },
    select: {
      id: true,
      path: true
    },
    orderBy: {
      path: 'asc'
    }
  });

  console.log('Found categories:');
  console.log('ID,Path');
  categories.forEach(c => {
    console.log(`${c.id},${c.path}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
