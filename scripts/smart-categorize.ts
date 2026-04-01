import * as fs from 'fs';
import * as path from 'path';

// ---------- Types ----------
interface MisplacedProduct {
  id: string;
  name: string;
  currentCategoryId: string;
  currentCategorySlug: string;
  currentCategoryName: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  path: string;
  productCount: number;
}

interface MatchedProduct {
  productId: string;
  productName: string;
  fromCategory: string;
  toCategory: string;
  toCategorySlug: string;
  confidence: 'high' | 'medium';
  reason: string;
}

interface UnmatchedProduct {
  productId: string;
  productName: string;
  fromCategory: string;
  reason: string;
}

interface Output {
  matched: MatchedProduct[];
  unmatched: UnmatchedProduct[];
  stats: {
    total: number;
    matched: number;
    unmatched: number;
  };
}

// ---------- Category ID / Name Map ----------
// Pre-resolved from legitimate-category-tree.json
const CAT: Record<string, { id: string; name: string }> = {
  // ── Depth-1: top-level CCTV subcategories ──────────────────────────────
  'cctv-hdcvi-kameralar':             { id: '5e0e1e16-675d-42d8-b64a-4811c324e16e', name: 'HDCVI Kameralar' },
  'cctv-ip-kameralar':                { id: '0a1a045b-4a5f-42fd-8f9d-4a53a7d513e5', name: 'IP Kameralar' },
  'cctv-ahd-kameralar':               { id: 'c990120d-99cb-4587-af76-295e36654fec', name: 'AHD Kameralar' },
  'cctv-kayit-cihazi':                { id: 'ce2e6ffa-7c4f-4b0f-bd04-7f8e60c7765b', name: 'Kayıt Cihazı' },
  'cctv-termal-kameralar':            { id: '0459e9f2-ec59-4749-9670-7188e2f99b8c', name: 'Termal Kameralar' },
  'cctv-trafik-dsp-kameralari':       { id: 'b4c90adf-89b2-43ce-bd21-a1764ed84ec6', name: 'Trafik DSP Kameraları' },
  'cctv-aksesuarlar':                 { id: '7fefb540-955a-443d-897f-83552a44c720', name: 'Aksesuarlar' },
  'cctv-analog-kameralar':            { id: 'a2786431-fada-4145-8d4d-4f10dd406271', name: 'Analog Kameralar' },

  // ── Depth-2: IP Kamera subtypes ────────────────────────────────────────
  'ip-kameralar-ir-bullet':           { id: 'b246176d-fbfd-45cb-bd13-6cae85db89fe', name: 'IR Bullet' },
  'ip-kameralar-ir-dome':             { id: '2451233f-d9eb-4132-98fd-f5116354b5d4', name: 'IR Dome' },
  'ip-kameralar-ir-turret':           { id: 'b362d143-8ad5-42d7-ab07-23dd4275b2b3', name: 'IR Turret' },
  'ip-kameralar-ptz-kameralar':       { id: '231ce810-393c-439a-9bcc-1fb4312923b1', name: 'PTZ Kameralar' },
  'ip-kameralar-fisheye':             { id: '4b0483e8-23b4-4dba-837e-8dd398524ed3', name: 'Fisheye' },
  'ip-kameralar-special-kameralar':   { id: '2faa7a12-d0a3-4a4e-9b9b-e797819432ae', name: 'Special Kameralar' },
  'ip-kameralar-lpr-plaka-tanima':    { id: 'f750e4a7-e73b-4ec2-8a01-0ea19880bd4a', name: 'LPR / Plaka Tanıma' },

  // ── Depth-3: IR Bullet by MP ───────────────────────────────────────────
  'ir-bullet-2mp':                    { id: 'a733411f-3977-487d-b82a-b93e0ed55539', name: '2MP' },
  'ir-bullet-4mp':                    { id: '95f1a007-852c-4fc7-b747-a093953ab0d4', name: '4MP' },
  'ir-bullet-5mp':                    { id: 'be435b83-6fff-42bf-8e4c-277037921451', name: '5MP' },
  'ir-bullet-8mp':                    { id: 'cd430298-45db-4f5d-9888-45327700e755', name: '8MP' },

  // ── Depth-3: IR Dome by MP ────────────────────────────────────────────
  'ir-dome-2mp':                      { id: 'e5e988e7-5127-4605-85ca-d732c10f00b3', name: '2MP' },
  'ir-dome-4mp':                      { id: '8bf20150-de82-42f3-9201-5dd477beca3b', name: '4MP' },
  'ir-dome-5mp':                      { id: '63d8f1c7-a230-4bc0-b3f6-67b3b83f4a31', name: '5MP' },
  'ir-dome-8mp':                      { id: '618b2ce6-7194-4a3f-b391-e4d9881030c9', name: '8MP' },

  // ── Depth-3: IR Turret by MP ──────────────────────────────────────────
  'ir-turret-2mp':                    { id: '1104fc49-9ff7-4945-afbc-8ba464e03515', name: '2MP' },
  'ir-turret-4mp':                    { id: '614052ea-76bd-482e-98ec-aea960a3b714', name: '4MP' },
  'ir-turret-5mp':                    { id: 'bc8841b1-3aaa-433d-b1cb-d877d7c4af2d', name: '5MP' },
  'ir-turret-8mp':                    { id: '4a5ee888-a756-4d5b-885c-520056112068', name: '8MP' },

  // ── Depth-3: PTZ by MP ────────────────────────────────────────────────
  'ptz-kameralar-4mp-ptz':            { id: 'a639015e-990c-41e1-ac05-3207b9c5a91f', name: '4MP PTZ' },
  'ptz-kameralar-5mp-ptz':            { id: 'e0f9a1f4-4d86-44e4-b0e6-117c9783774a', name: '5MP PTZ' },
  'ptz-kameralar-8mp-ptz':            { id: 'ad0059d7-bad8-4eea-9649-408f561ba6a7', name: '8MP PTZ' },

  // ── Depth-3: Fisheye by MP ────────────────────────────────────────────
  'fisheye-3mp-fisheye':              { id: '48382d81-ca0a-43c8-a2cc-8e07605eb62c', name: '3MP Fisheye' },
  'fisheye-5mp-fisheye':              { id: '46162137-aba0-45be-8270-6bf937f47434', name: '5MP Fisheye' },
  'fisheye-12mp-fisheye':             { id: '43ad26f3-3792-44a7-8dac-21cb5bffb39f', name: '12MP Fisheye' },

  // ── Depth-3: Special / LPR ───────────────────────────────────────────
  'special-kameralar-body-worn':      { id: '1bdbfbb9-6505-46a7-a6dd-c48651afe511', name: 'Body Worn' },
  'special-kameralar-panomorfik':     { id: '886a51f6-977e-495e-b0df-ff19724ec003', name: 'Panomorfik' },
  'lpr-plaka-tanima-2mp-lpr':         { id: '7c91127a-9a09-442f-ad7d-c5d3ebbe7fef', name: '2MP LPR' },
  'lpr-plaka-tanima-4mp-lpr':         { id: 'f6cbcb53-2514-4df9-89c7-e3b951fc0cbb', name: '4MP LPR' },

  // ── Depth-2: HDCVI subtypes ────────────────────────────────────────────
  'hdcvi-kameralar-hdcvi-bullet':     { id: '3fd863c7-cbeb-4b23-a103-0492e74dde7b', name: 'HDCVI Bullet' },
  'hdcvi-kameralar-hdcvi-dome':       { id: '806a405e-4353-4e73-a304-87e16cc2bc64', name: 'HDCVI Dome' },
  'hdcvi-kameralar-hdcvi-ptz':        { id: 'e7d49e77-ee44-4417-a036-6629a2ca8bfa', name: 'HDCVI PTZ' },

  // ── Depth-3: HDCVI Bullet by MP ───────────────────────────────────────
  'hdcvi-bullet-2mp-hdcvi-bullet':    { id: '7f14d1e8-5bae-4799-a0e8-d0bf9dcc64fa', name: '2MP HDCVI Bullet' },
  'hdcvi-bullet-4mp-hdcvi-bullet':    { id: '724130ba-b0ba-494f-b373-b09014189414', name: '4MP HDCVI Bullet' },
  'hdcvi-bullet-5mp-hdcvi-bullet':    { id: 'db20c4cc-15e1-4609-bf50-c0b9676a353e', name: '5MP HDCVI Bullet' },
  'hdcvi-bullet-8mp-hdcvi-bullet':    { id: '4e01f7f0-4e0c-4e3f-ab39-d0fdef6802a6', name: '8MP HDCVI Bullet' },

  // ── Depth-3: HDCVI Dome by MP ─────────────────────────────────────────
  'hdcvi-dome-2mp-hdcvi-dome':        { id: '87321d3a-b817-45b5-af8f-83c6c0c4ead3', name: '2MP HDCVI Dome' },
  'hdcvi-dome-4mp-hdcvi-dome':        { id: '7b09876d-a969-4bdc-94e2-33d6b5798038', name: '4MP HDCVI Dome' },
  'hdcvi-dome-5mp-hdcvi-dome':        { id: '3889d8d6-8857-4be5-96bb-0ba82bc8ee2c', name: '5MP HDCVI Dome' },

  // ── Depth-2: AHD subtypes ─────────────────────────────────────────────
  'ahd-kameralar-ahd-bullet':         { id: '1b6fb9c2-d448-47cb-9261-7a51c7ece81b', name: 'AHD Bullet' },
  'ahd-kameralar-ahd-dome':           { id: 'd12a8ee8-f8b6-4113-aaf6-6b8144580a77', name: 'AHD Dome' },

  // ── Depth-3: AHD Bullet/Dome by resolution ────────────────────────────
  'ahd-bullet-1080p-ahd-bullet':      { id: 'c2ee5a86-4966-4237-bf99-7f871ea6d00c', name: '1080P AHD Bullet' },
  'ahd-bullet-4mp-ahd-bullet':        { id: 'eaef0958-25a9-46a7-8650-b764087c6714', name: '4MP AHD Bullet' },
  'ahd-bullet-5mp-ahd-bullet':        { id: '3186d19f-850f-4d8e-a54c-f39c0c53bca8', name: '5MP AHD Bullet' },
  'ahd-dome-1080p-ahd-dome':          { id: 'c55b812d-d4b0-472b-9cee-2fb1ad1e7176', name: '1080P AHD Dome' },
  'ahd-dome-4mp-ahd-dome':            { id: 'c6879999-acac-494e-81fe-3859ef210104', name: '4MP AHD Dome' },
  'ahd-dome-5mp-ahd-dome':            { id: '5e30781a-38e6-4b92-a60f-5e7130fd2584', name: '5MP AHD Dome' },

  // ── Depth-2: Kayıt Cihazı subtypes ────────────────────────────────────
  'kayit-cihazi-dvr':                 { id: '86315426-2d09-4713-9be9-70850c717fdf', name: 'DVR' },
  'kayit-cihazi-nvr':                 { id: '548cda90-2826-409a-bf34-e6f6df181792', name: 'NVR' },
  'kayit-cihazi-xvr':                 { id: 'e4de154f-f32f-4f20-95b2-098ff948ae80', name: 'XVR' },

  // ── Depth-3: DVR by channel ────────────────────────────────────────────
  'dvr-4-kanal-dvr':                  { id: '296322d1-fc0b-4928-afad-20b61474e917', name: '4 Kanal DVR' },
  'dvr-8-kanal-dvr':                  { id: '57e9e0d7-8e6c-40d3-837c-081d74bfa24e', name: '8 Kanal DVR' },
  'dvr-16-kanal-dvr':                 { id: '9761b947-d9f7-4adc-9d01-ebb7f412f36f', name: '16 Kanal DVR' },
  'dvr-32-kanal-dvr':                 { id: '6fca3416-e7c7-483e-822e-1f616c4c5e9a', name: '32 Kanal DVR' },

  // ── Depth-3: NVR by channel ────────────────────────────────────────────
  'nvr-4-kanal-nvr':                  { id: '80aba6b8-c9fd-41b4-8bcb-f82d819b5d2d', name: '4 Kanal NVR' },
  'nvr-8-kanal-nvr':                  { id: '9fec24ab-85b3-4080-8889-7986c3647745', name: '8 Kanal NVR' },
  'nvr-16-kanal-nvr':                 { id: 'a12612d0-a01f-4c54-ae65-0e566d3ea732', name: '16 Kanal NVR' },
  'nvr-32-kanal-nvr':                 { id: '74c0624d-4e74-447b-aef2-05ae0b4a7ad0', name: '32 Kanal NVR' },
  'nvr-64-kanal-nvr':                 { id: 'be5b2718-ad33-4acc-bdc6-cf203912e6bc', name: '64 Kanal NVR' },
  'nvr-128-kanal-nvr':                { id: '09151807-14a8-4e57-919c-b259f5bacf0f', name: '128 Kanal NVR' },

  // ── Depth-3: XVR by channel ────────────────────────────────────────────
  'xvr-4-kanal-xvr':                  { id: 'dfe49739-3bd7-4bcf-8921-47b7f51ac5df', name: '4 Kanal XVR' },
  'xvr-8-kanal-xvr':                  { id: '99fa2978-8482-4c27-b384-f6cb0f3ed8c0', name: '8 Kanal XVR' },
  'xvr-16-kanal-xvr':                 { id: 'e1f7a43e-3076-458d-920f-28f523f1719c', name: '16 Kanal XVR' },

  // ── Depth-2: Termal subtypes ───────────────────────────────────────────
  'termal-kameralar-el-tipi-termal':  { id: 'd57fc435-0f60-48b7-b030-d61960570085', name: 'El Tipi Termal' },
  'termal-kameralar-sabit-termal':    { id: 'df94ec8e-54bd-49a9-9db4-7a4d0f564447', name: 'Sabit Termal' },
  'termal-kameralar-ptz-termal':      { id: '2bb5bb42-3525-4350-b137-53d9c601debb', name: 'PTZ Termal' },

  // ── Other categories ───────────────────────────────────────────────────
  'network-fiber-switch':             { id: '2e65418e-1c88-442e-8ec0-c20dbea06e9f', name: 'Switch' },
  'network-fiber-poe-switchler':      { id: '5523479f-c6b0-433d-8c57-29f2118a15ff', name: 'POE Switchler' },
  'network-fiber-fiber-optik':        { id: '2f689991-ada8-4890-ba00-518a4bdc8197', name: 'Fiber Optik' },
  'bilgisayar-sunucu-monitor':        { id: '91144e1e-f2d9-4c54-8606-7244b05dca55', name: 'Monitör' },
  'gecis-kontrol-alarm-yangin-alarm': { id: '0d446a13-0550-4165-b287-a15ed16f97d3', name: 'Yangın Alarm' },
  'gecis-kontrol-kapi-i-stasyonu':    { id: '8bc8b012-10f7-4da4-88ce-5994a9116943', name: 'Kapı İstasyonu' },
  'gecis-kontrol-alarm':              { id: '7593b74a-394c-4e7b-bcf6-2380c9b6eee3', name: 'Geçiş Kontrol & Alarm' },
  'gecis-kontrol-alarm-gecis-kontrol':{ id: 'a40e6d27-ccd8-4e25-b1f3-3a4034a38db2', name: 'Geçiş Kontrol' },
  'gecis-kontrol-alarm-hirsiz-alarm': { id: 'a704606e-e8d6-431c-9c90-d63877fd4375', name: 'Hırsız Alarm' },
  'guc-elektronigi-aku':              { id: '2b651e96-c5a8-41c7-81de-b3438c26de99', name: 'Akü' },
  'yazilim-lisans':                   { id: '1101198b-86d0-4172-b23c-fdb15c3b0a23', name: 'Yazılım & Lisans' },
  'kablo-aksesuar-goruntu-kablolari': { id: '31cacdaf-be6e-4bdf-8bf0-80cf2d7f9a4c', name: 'Görüntü Kabloları' },
  'network-fiber':                    { id: '8479356b-5f63-4904-a434-6ab97efe3f75', name: 'Network & Fiber' },
  'cctv':                             { id: '55fbfe09-59db-4a47-bab6-7672c561e843', name: 'CCTV' },
};

// ---------- Helper functions ----------
function u(s: string): string {
  return s.toUpperCase();
}

type MatchResult = { slug: string; confidence: 'high' | 'medium'; reason: string } | null;

// ── Extract megapixel from a Dahua IPC model number ────────────────────────
// Dahua IPC numbering: IPC-HFW2441 → digits after model-type prefix
// The numeric portion typically contains MP info: 2xxx=2MP, 3xxx=3MP, 4xxx=4MP, 5xxx=5MP, 8xxx=8MP
function dahuaIpcMp(name: string): number | null {
  // After IPC-HFW / IPC-HDBW / IPC-HDW / IPC-HFW etc., extract the digit block
  const m = name.match(/^IPC-[A-Z]{2,5}(\d{4})/i);
  if (m) {
    const code = m[1];
    const lead = parseInt(code[0], 10);
    // Map leading digit of 4-digit code: 1→1MP, 2→2MP, 3→3MP, 4→4MP, 5→5MP, 8→8MP
    if (lead === 8) return 8;
    if (lead === 5) return 5;
    if (lead === 4) return 4;
    if (lead === 3) return 3;
    if (lead === 2) return 2;
    if (lead === 1) return 1;
  }
  return null;
}

// ── Extract megapixel from a Tiandy TC-C model number ────────────────────
// TC-C32 = 2MP, TC-C34 = 4MP, TC-C35 = 5MP, TC-C38 = 8MP
function tiandyCamMp(name: string): number | null {
  const m = name.match(/^TC-C3([2458])/i);
  if (m) {
    const d = parseInt(m[1], 10);
    if (d === 2) return 2;
    if (d === 4) return 4;
    if (d === 5) return 5;
    if (d === 8) return 8;
  }
  return null;
}

// ── Determine if IPC model is Bullet, Dome, or Turret ─────────────────────
// HFW / CB / EBW = Bullet  |  HDBW / HDW = Dome  |  HDT / HDW+turret = Turret
// IPC-HFW → Bullet, IPC-HDBW → Dome, IPC-HDW → Dome, IPC-CB → Bullet
// IPC-EB → Eyeball (Bullet), IPC-EBW → Eyeball wide (Bullet)
// IPC-HDPW → Dome, IPC-MFW → Multi-sensor (Special)
// IPC-EW → Panoramic (Special / Fisheye area)
function ipcFormFactor(name: string): 'bullet' | 'dome' | 'turret' | 'ptz' | 'fisheye' | 'special' | 'lpr' | null {
  const up = name.toUpperCase();

  // Fisheye / Panoramic
  if (/^IPC-EB[W5]/i.test(name) || /^IPC-EW/i.test(name) || /FISHEYE/i.test(up)) {
    return 'fisheye';
  }
  // Multi-sensor / special
  if (/^IPC-MFW/i.test(name) || /^IPC-MSD/i.test(name)) {
    return 'special';
  }
  // LPR / traffic
  if (/^IPC-HF[BT]W|LPR|PLAKA/i.test(up)) {
    return 'lpr';
  }
  // Bullet: HFW, CB, CF, HFW
  if (/^IPC-HFW/i.test(name) || /^IPC-CB/i.test(name) || /^IPC-CF/i.test(name)) {
    return 'bullet';
  }
  // Dome: HDBW, HDW, HDPW
  if (/^IPC-HDBW/i.test(name) || /^IPC-HDW/i.test(name) || /^IPC-HDPW/i.test(name)) {
    return 'dome';
  }
  // Turret: HFW2xxx with T suffix or CT prefix
  if (/^IPC-CT/i.test(name) || /^IPC-HFW.*T-/i.test(name)) {
    return 'turret';
  }
  return null;
}

// ── Determine HDCVI HAC form factor ───────────────────────────────────────
function hacFormFactor(name: string): 'bullet' | 'dome' | 'ptz' | 'special' | null {
  // PTZ
  if (/SD\d|PTZ/i.test(name)) return 'ptz';
  // Bullet: HFW, B (standalone B), ME (Motion Eye — special case, goes special)
  if (/^HAC-HFW/i.test(name) || /^HAC-B[^D]/i.test(name)) return 'bullet';
  // Dome: HDBW, HDW, T (turret is basically dome in HDCVI), HDW
  if (/^HAC-HDBW/i.test(name) || /^HAC-HDW/i.test(name) || /^HAC-T/i.test(name)) return 'dome';
  // Special
  if (/^HAC-ME/i.test(name) || /^HAC-LC/i.test(name)) return 'special';
  return null;
}

// ── Extract MP from HAC model number ─────────────────────────────────────
// HAC-HDBW1230 → 2MP (12xx = 1MP, 22xx = 2MP, 23xx = 2MP, 31xx = 1MP)
// HAC-B1A21 → 2MP, HAC-HDBW2231 → 2MP
function hacMp(name: string): number | null {
  // Look for 4-digit code in HAC model
  const m = name.match(/HAC-[A-Z]{1,5}(\d{4})/i);
  if (m) {
    const code = m[1];
    const lead2 = parseInt(code.substring(0, 2), 10);
    // Resolution encoding: 10xx or 11xx = 1MP, 12xx or 13xx = 1MP,
    // 22xx or 23xx = 2MP, 31xx = 1MP, 42xx = 4MP, 52xx = 5MP, 81xx = 8MP
    if (lead2 >= 80) return 8;
    if (lead2 >= 50) return 5;
    if (lead2 >= 40) return 4;
    if (lead2 >= 20) return 2;
    return 1;
  }
  return null;
}

// ── Extract channel count from NVR/DVR/XVR model ─────────────────────────
// NVR5208 → 8ch, NVR4216 → 16ch, DVR5104 → 4ch, XVR5108 → 8ch
// DHI-NVR2108HS → 8ch, TC-R3105 → 5ch (treat as 4ch), TC-R3110 → 10ch (→16), TC-R3120 → 20ch (→32)
function recorderChannels(name: string): number | null {
  // TC-R3105 → 5ch, TC-R3110 → 10ch, TC-R3120 → 20ch, TC-R3220 → 20ch
  const tcr = name.match(/^TC-R3[12](\d{2})/i);
  if (tcr) {
    const n = parseInt(tcr[1], 10);
    // Map to nearest standard channel: 05→4, 10→8, 16→16, 20→16 or 32 is ambiguous, 32→32
    if (n <= 5) return 4;
    if (n <= 10) return 8;
    if (n <= 16) return 16;
    return 32;
  }

  // Standard Dahua / generic: extract 2-digit channel code before suffix
  // NVR5208-4KS2 → 08, NVR4216 → 16, DVR5104 → 04
  // DHI-NVR2108HS-8P-4KS2 → 08
  const m = name.match(/(?:NVR|DVR|XVR|HCVR)\d*(\d{2})(?:\d{2})?(?:HS|H|$|-)/i);
  if (m) {
    const ch = parseInt(m[1], 10);
    // Handle padded 2-digit: 04→4, 08→8, 16→16 etc.
    return ch;
  }

  // Direct digit extraction: find 2-digit channel hint in model code
  // More aggressive: look for 04, 08, 16, 32, 64, 128 in the name
  const chMatch = name.match(/(\d+)(?:CH|KAN|KANAL)/i);
  if (chMatch) return parseInt(chMatch[1], 10);

  return null;
}

// ── Map channels to DVR slug ──────────────────────────────────────────────
function dvrSlugByChannel(ch: number): string {
  if (ch <= 4)  return 'dvr-4-kanal-dvr';
  if (ch <= 8)  return 'dvr-8-kanal-dvr';
  if (ch <= 16) return 'dvr-16-kanal-dvr';
  return 'dvr-32-kanal-dvr';
}

// ── Map channels to NVR slug ──────────────────────────────────────────────
function nvrSlugByChannel(ch: number): string {
  if (ch <= 4)   return 'nvr-4-kanal-nvr';
  if (ch <= 8)   return 'nvr-8-kanal-nvr';
  if (ch <= 16)  return 'nvr-16-kanal-nvr';
  if (ch <= 32)  return 'nvr-32-kanal-nvr';
  if (ch <= 64)  return 'nvr-64-kanal-nvr';
  return 'nvr-128-kanal-nvr';
}

// ── Map channels to XVR slug ──────────────────────────────────────────────
function xvrSlugByChannel(ch: number): string {
  if (ch <= 4)  return 'xvr-4-kanal-xvr';
  if (ch <= 8)  return 'xvr-8-kanal-xvr';
  return 'xvr-16-kanal-xvr';
}

// ── Map MP to IR Bullet slug ──────────────────────────────────────────────
function irBulletSlug(mp: number | null): string {
  if (mp === 2) return 'ir-bullet-2mp';
  if (mp === 4) return 'ir-bullet-4mp';
  if (mp === 5) return 'ir-bullet-5mp';
  if (mp === 8) return 'ir-bullet-8mp';
  return 'ip-kameralar-ir-bullet'; // depth-2 fallback
}

function irDomeSlug(mp: number | null): string {
  if (mp === 2) return 'ir-dome-2mp';
  if (mp === 4) return 'ir-dome-4mp';
  if (mp === 5) return 'ir-dome-5mp';
  if (mp === 8) return 'ir-dome-8mp';
  return 'ip-kameralar-ir-dome';
}

function irTurretSlug(mp: number | null): string {
  if (mp === 2) return 'ir-turret-2mp';
  if (mp === 4) return 'ir-turret-4mp';
  if (mp === 5) return 'ir-turret-5mp';
  if (mp === 8) return 'ir-turret-8mp';
  return 'ip-kameralar-ir-turret';
}

function ptzSlug(mp: number | null): string {
  if (mp === 4) return 'ptz-kameralar-4mp-ptz';
  if (mp === 5) return 'ptz-kameralar-5mp-ptz';
  if (mp === 8) return 'ptz-kameralar-8mp-ptz';
  return 'ip-kameralar-ptz-kameralar';
}

function fisheyeSlug(mp: number | null): string {
  if (mp === 3)  return 'fisheye-3mp-fisheye';
  if (mp === 5)  return 'fisheye-5mp-fisheye';
  if (mp === 12) return 'fisheye-12mp-fisheye';
  return 'ip-kameralar-fisheye';
}

function hdcviBulletSlug(mp: number | null): string {
  if (mp === 2) return 'hdcvi-bullet-2mp-hdcvi-bullet';
  if (mp === 4) return 'hdcvi-bullet-4mp-hdcvi-bullet';
  if (mp === 5) return 'hdcvi-bullet-5mp-hdcvi-bullet';
  if (mp === 8) return 'hdcvi-bullet-8mp-hdcvi-bullet';
  return 'hdcvi-kameralar-hdcvi-bullet';
}

function hdcviDomeSlug(mp: number | null): string {
  if (mp === 2) return 'hdcvi-dome-2mp-hdcvi-dome';
  if (mp === 4) return 'hdcvi-dome-4mp-hdcvi-dome';
  if (mp === 5) return 'hdcvi-dome-5mp-hdcvi-dome';
  return 'hdcvi-kameralar-hdcvi-dome';
}

// ---------- Main categoriser ----------
function categorise(product: MisplacedProduct): MatchResult {
  const name = product.name.trim();
  const up   = u(name);
  const src  = product.currentCategorySlug;

  // ================================================================
  // 1. HAC-* → HDCVI cameras (deepest possible)
  // ================================================================
  if (/^HAC-/i.test(name)) {
    const ff = hacFormFactor(name);
    const mp = hacMp(name);

    if (ff === 'ptz') {
      return { slug: 'hdcvi-kameralar-hdcvi-ptz', confidence: 'high', reason: 'HAC- PTZ → HDCVI PTZ' };
    }
    if (ff === 'bullet') {
      return { slug: hdcviBulletSlug(mp), confidence: 'high', reason: `HAC- bullet ${mp ?? '?'}MP → HDCVI Bullet` };
    }
    if (ff === 'dome') {
      return { slug: hdcviDomeSlug(mp), confidence: 'high', reason: `HAC- dome ${mp ?? '?'}MP → HDCVI Dome` };
    }
    if (ff === 'special') {
      return { slug: 'cctv-hdcvi-kameralar', confidence: 'medium', reason: 'HAC- special form → HDCVI' };
    }
    // Fallback
    return { slug: 'cctv-hdcvi-kameralar', confidence: 'high', reason: 'HAC- prefix → HDCVI camera' };
  }

  // ================================================================
  // 2. IPC-* → IP cameras (Dahua IP) — deepest possible
  // ================================================================
  if (/^IPC-/i.test(name) || /\bIPC\b/i.test(name)) {
    const ff = ipcFormFactor(name);
    const mp = dahuaIpcMp(name);

    if (ff === 'fisheye') {
      return { slug: fisheyeSlug(mp), confidence: 'high', reason: `IPC fisheye ${mp ?? '?'}MP` };
    }
    if (ff === 'special') {
      return { slug: 'ip-kameralar-special-kameralar', confidence: 'high', reason: 'IPC multi-sensor → Special' };
    }
    if (ff === 'lpr') {
      const lprMp = mp ?? 2;
      if (lprMp >= 4) return { slug: 'lpr-plaka-tanima-4mp-lpr', confidence: 'high', reason: 'IPC LPR 4MP' };
      return { slug: 'lpr-plaka-tanima-2mp-lpr', confidence: 'high', reason: 'IPC LPR 2MP' };
    }
    if (ff === 'bullet') {
      return { slug: irBulletSlug(mp), confidence: 'high', reason: `IPC-HFW bullet ${mp ?? '?'}MP` };
    }
    if (ff === 'dome') {
      return { slug: irDomeSlug(mp), confidence: 'high', reason: `IPC-HDBW/HDW dome ${mp ?? '?'}MP` };
    }
    if (ff === 'turret') {
      return { slug: irTurretSlug(mp), confidence: 'high', reason: `IPC-CT turret ${mp ?? '?'}MP` };
    }
    // Unknown form factor but known MP → put in IR Bullet as safe default for fixed IP
    if (mp !== null) {
      return { slug: irBulletSlug(mp), confidence: 'medium', reason: `IPC unknown form, ${mp}MP → IR Bullet` };
    }
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'IPC- prefix → Dahua IP camera' };
  }

  // ================================================================
  // 3. NVR / DVR / XVR / HCVR → recording device (deepest possible)
  // ================================================================

  // XVR (must check before NVR/DVR generic)
  if (/^XVR\d|^XVR[A-Z]/i.test(name)) {
    const ch = recorderChannels(name);
    if (ch !== null) {
      return { slug: xvrSlugByChannel(ch), confidence: 'high', reason: `XVR ${ch}ch` };
    }
    return { slug: 'kayit-cihazi-xvr', confidence: 'high', reason: 'XVR → XVR kayıt cihazı' };
  }

  // HCVR (Dahua HDCVI DVR) — treat as DVR
  if (/^HCVR/i.test(name)) {
    const ch = recorderChannels(name);
    if (ch !== null) {
      return { slug: dvrSlugByChannel(ch), confidence: 'high', reason: `HCVR (HDCVI DVR) ${ch}ch` };
    }
    return { slug: 'kayit-cihazi-dvr', confidence: 'high', reason: 'HCVR → Dahua HDCVI DVR' };
  }

  // DVR
  if (/^DVR\d|^DVR[A-Z]/i.test(name)) {
    const ch = recorderChannels(name);
    if (ch !== null) {
      return { slug: dvrSlugByChannel(ch), confidence: 'high', reason: `DVR ${ch}ch` };
    }
    return { slug: 'kayit-cihazi-dvr', confidence: 'high', reason: 'DVR → kayıt cihazı' };
  }

  // DHI-NVR / NVR2* / NVR4* / NVR5*
  if (/^DHI-NVR/i.test(name) || /^NVR[245]\d/i.test(name) || /^MCVR|^MNVR/i.test(name)) {
    const ch = recorderChannels(name);
    if (ch !== null) {
      return { slug: nvrSlugByChannel(ch), confidence: 'high', reason: `NVR ${ch}ch` };
    }
    return { slug: 'kayit-cihazi-nvr', confidence: 'high', reason: 'NVR → kayıt cihazı' };
  }

  // ================================================================
  // 4. TC-* Tiandy cameras (deepest possible)
  // ================================================================

  // Tiandy IP cameras: TC-C3x → IP, type from suffix letter
  if (/^TC-C3[2458]/i.test(name)) {
    const mp = tiandyCamMp(name);
    // Suffix codes that indicate form factor:
    // G/H/K/W/R/U/M/Q = typically bullet or dome variants
    // For Tiandy TC-C3x: GN/GS/HN/HS/KN/KS = bullet-style fixed
    // WN/WS/WP = wifi bullet, MN/MS = varifocal dome, UN = varifocal
    // Without definitive per-letter breakdown, use IPC number encoding instead:
    // The 5th char in TC-C32GN: G=bullet, H=bullet, K=bullet, M=dome, U=bullet, W=wifi-bullet
    // Q=special-wifi, R=turret, C=wifi-cube  — approximate mapping
    const modelCode = name.match(/^TC-C3[2458]([A-Z]{1,2})/i)?.[1]?.toUpperCase() ?? '';

    if (/^(G|H|K|W|R|U|X|Z)/.test(modelCode)) {
      // Bullet-style fixed cameras
      return { slug: irBulletSlug(mp), confidence: 'high', reason: `Tiandy TC-C3${mp} ${modelCode} → IR Bullet` };
    }
    if (/^(M|P|S)/.test(modelCode)) {
      // Dome/turret style
      return { slug: irDomeSlug(mp), confidence: 'high', reason: `Tiandy TC-C3${mp} ${modelCode} → IR Dome` };
    }
    if (/^C/.test(modelCode)) {
      // Cube/WiFi → Special
      return { slug: 'ip-kameralar-special-kameralar', confidence: 'medium', reason: `Tiandy TC-C3${mp} CN WiFi cube → Special` };
    }
    // Fallback to bullet for unknown suffix
    return { slug: irBulletSlug(mp), confidence: 'medium', reason: `Tiandy TC-C3${mp} → IR Bullet (suffix unknown)` };
  }

  if (/^TC-H3/i.test(name)) {
    // TC-H3 series: usually fisheye/panoramic
    return { slug: 'ip-kameralar-fisheye', confidence: 'high', reason: 'TC-H3 → Tiandy panoramic/fisheye camera' };
  }

  if (/^TC-NC/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'TC-NC → Tiandy compact IP camera' };
  }

  if (/^TC-A3/i.test(name)) {
    // TC-A series PTZ — extract MP if possible
    const mpMatch = name.match(/^TC-A3(\d)/i);
    const mpVal = mpMatch ? parseInt(mpMatch[1], 10) : null;
    return { slug: ptzSlug(mpVal), confidence: 'high', reason: `TC-A3 → Tiandy PTZ ${mpVal ?? '?'}MP` };
  }

  // Tiandy NVR: TC-NR or TC-R3*
  if (/^TC-.*NVR|^TC-NVR/i.test(up)) {
    const ch = recorderChannels(name);
    if (ch !== null) {
      return { slug: nvrSlugByChannel(ch), confidence: 'high', reason: `Tiandy NVR ${ch}ch` };
    }
    return { slug: 'kayit-cihazi-nvr', confidence: 'high', reason: 'TC-*NVR → Tiandy NVR' };
  }

  if (/^TC-R3/i.test(name)) {
    const ch = recorderChannels(name);
    if (ch !== null) {
      return { slug: nvrSlugByChannel(ch), confidence: 'high', reason: `TC-R3xxx Tiandy NVR ${ch}ch` };
    }
    return { slug: 'kayit-cihazi-nvr', confidence: 'high', reason: 'TC-R3xxx → Tiandy NVR' };
  }

  // TC-EXP → Ex-proof IP camera
  if (/^TC-EXP/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'TC-EXP → Tiandy Ex-proof IP camera' };
  }

  // TC-5xxx → Tiandy 5000-series NVR
  if (/^TC-5[0-9]{3}/i.test(name)) {
    return { slug: 'kayit-cihazi-nvr', confidence: 'high', reason: 'TC-5xxx → Tiandy 5000-series NVR' };
  }

  // TC-N / TC-ND → Tiandy network cameras
  if (/^TC-N[0-9]|^TC-ND/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'TC-N/TC-ND → Tiandy IP camera' };
  }

  // ================================================================
  // 5. DS-2* Hikvision
  // ================================================================
  if (/^DS-2CD/i.test(name)) {
    // Extract form factor and MP for Hikvision
    // DS-2CD2T → bullet (T = turret or bullet), DS-2CD2D → dome, DS-2CD2U → fisheye
    // DS-2CD2xxx: 3rd-4th chars: T=bullet, D=dome, U=fisheye
    const hikFF = name.match(/^DS-2CD2([A-Z]{1,2})/i)?.[1]?.toUpperCase() ?? '';
    // Resolution: DS-2CD-2347 → 4MP (2xxx=2MP, 3xxx=2MP w/new naming, 4xxx=4MP, 6xxx=6MP, 8xxx=8MP)
    const hikMpMatch = name.match(/^DS-2CD[0-9A-Z]{0,2}(\d)(\d{2})/i);
    let hikMp: number | null = null;
    if (hikMpMatch) {
      const code = parseInt(hikMpMatch[1], 10);
      if (code === 2 || code === 3) hikMp = 2;
      else if (code === 4) hikMp = 4;
      else if (code === 5) hikMp = 5;
      else if (code === 6) hikMp = 6;
      else if (code === 8) hikMp = 8;
    }
    if (/^T|^2T/.test(hikFF)) {
      return { slug: irBulletSlug(hikMp), confidence: 'high', reason: `DS-2CDT Hikvision bullet ${hikMp ?? '?'}MP` };
    }
    if (/^D/.test(hikFF)) {
      return { slug: irDomeSlug(hikMp), confidence: 'high', reason: `DS-2CDD Hikvision dome ${hikMp ?? '?'}MP` };
    }
    if (/^U/.test(hikFF)) {
      return { slug: 'ip-kameralar-fisheye', confidence: 'high', reason: 'DS-2CDU Hikvision fisheye' };
    }
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'DS-2CD → Hikvision IP camera' };
  }

  if (/^DS-2CE/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'high', reason: 'DS-2CE → Hikvision analog camera' };
  }

  if (/^DS-2TD/i.test(name) || /^DS-2TP/i.test(name)) {
    if (/PTZ/i.test(up)) {
      return { slug: 'termal-kameralar-ptz-termal', confidence: 'high', reason: 'DS-2TD PTZ → Hikvision PTZ thermal' };
    }
    return { slug: 'termal-kameralar-sabit-termal', confidence: 'high', reason: 'DS-2TD/TP → Hikvision fixed thermal' };
  }

  if (/^AE-VC/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'high', reason: 'AE-VC → Hikvision analog camera' };
  }

  // ================================================================
  // 6. SD4* / SD5* / SD6* → Dahua PTZ / speed dome
  // ================================================================
  if (/^SD6/i.test(name) || /^EPC/i.test(name)) {
    // SD6 are large speed domes, typically 4MP or 5MP; extract if possible
    const sdMpMatch = name.match(/SD6[A-Z]+(\d)(\d{2})/i);
    let sdMp: number | null = null;
    if (sdMpMatch) {
      const c = parseInt(sdMpMatch[1], 10);
      if (c === 2) sdMp = 2;
      else if (c === 4) sdMp = 4;
      else if (c === 5) sdMp = 5;
      else if (c === 8) sdMp = 8;
    }
    return { slug: ptzSlug(sdMp), confidence: 'high', reason: `SD6/EPC Dahua IP PTZ ${sdMp ?? '?'}MP` };
  }

  if (/^SD4[0-9A]/i.test(name) || /^SD5[0-9A]/i.test(name)) {
    if (/-HC/i.test(name)) {
      return { slug: 'hdcvi-kameralar-hdcvi-ptz', confidence: 'high', reason: 'SD4x/SD5x-HC → Dahua HDCVI PTZ' };
    }
    // IP PTZ — try to extract MP
    const sdMpMatch = name.match(/SD[45][0-9A][A-Z]*(\d{2,3})/i);
    let sdMp: number | null = null;
    if (sdMpMatch) {
      const c = parseInt(sdMpMatch[1].charAt(0), 10);
      if (c === 2) sdMp = 2; else if (c === 4) sdMp = 4;
      else if (c === 5) sdMp = 5; else if (c === 8) sdMp = 8;
    }
    return { slug: ptzSlug(sdMp), confidence: 'high', reason: `SD4x/SD5x IP PTZ ${sdMp ?? '?'}MP` };
  }

  // ================================================================
  // 7. TPC-* (Hikvision thermal) → thermal cameras
  // ================================================================
  if (/^TPC-/i.test(name)) {
    if (/PTZ/i.test(up)) {
      return { slug: 'termal-kameralar-ptz-termal', confidence: 'high', reason: 'TPC- PTZ → Hikvision PTZ thermal' };
    }
    return { slug: 'termal-kameralar-sabit-termal', confidence: 'high', reason: 'TPC- → Hikvision fixed thermal' };
  }

  // ================================================================
  // 8. SK-T* / OT-* / SYTS / IPMPGS → thermal (temperature scanning)
  // ================================================================
  if (/^SK-T|^OT-\d|^SYTS|^IPMPGS/i.test(name)) {
    return { slug: 'termal-kameralar-sabit-termal', confidence: 'high', reason: 'Temperature scanner → Sabit Termal' };
  }

  // ================================================================
  // 9. PRO-MP / EX-MP / OK-* / ECLIPSE / EX-* → Ex-proof IP cameras
  // ================================================================
  if (/^PRO-MP/i.test(name)) {
    return { slug: 'ip-kameralar-ir-bullet', confidence: 'high', reason: 'PRO-MP → Ex-proof IR Bullet' };
  }

  if (/^EX-MP/i.test(name) || /^EX-\d/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'EX-MP → Ex-proof IP camera' };
  }

  if (/^OK[-\s]/i.test(name) || /^OK100|^OKS/i.test(name)) {
    if (/OK[-\s]?(7\d{2}|S24)/i.test(name)) {
      return { slug: 'ip-kameralar-ptz-kameralar', confidence: 'high', reason: 'OK-7xx → Ex-proof PTZ IP camera' };
    }
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'OK- series → Ex-proof IP camera' };
  }

  if (/^ECLIPSE/i.test(name)) {
    if (/LCD|MONITOR|MONİTÖR/i.test(up)) {
      return { slug: 'bilgisayar-sunucu-monitor', confidence: 'high', reason: 'ECLIPSE LCD → Ex-proof monitor' };
    }
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'ECLIPSE camera → Ex-proof IP camera' };
  }

  // ================================================================
  // 10. ICT / ITA / ITC → traffic cameras
  // ================================================================
  if (/^ICT\d|^ITA[A-Z]|^ITC\d/i.test(name)) {
    return { slug: 'cctv-trafik-dsp-kameralari', confidence: 'high', reason: 'ICT/ITA/ITC → Dahua trafik kamerası' };
  }

  // ================================================================
  // 11. Switches
  // ================================================================
  if (/^S5500/i.test(name)) {
    return { slug: 'network-fiber-switch', confidence: 'high', reason: 'S5500 → Dahua managed switch' };
  }
  if (/^S3000|^S4000/i.test(name)) {
    return { slug: 'network-fiber-switch', confidence: 'high', reason: 'S3000/S4000 → Dahua switch' };
  }
  if (/^EPS-/i.test(name)) {
    if (/POE|PW/i.test(up)) {
      return { slug: 'network-fiber-poe-switchler', confidence: 'high', reason: 'EPS-PW → Tiandy PoE switch' };
    }
    return { slug: 'network-fiber-switch', confidence: 'high', reason: 'EPS- → Tiandy switch' };
  }
  if (/^HPS-/i.test(name)) {
    return { slug: 'network-fiber-switch', confidence: 'high', reason: 'HPS- → Tiandy switch' };
  }
  if (/^YPS-/i.test(name)) {
    return { slug: 'network-fiber-switch', confidence: 'high', reason: 'YPS- → Tiandy L2/L3 managed switch' };
  }
  if (/^RPS-\d/i.test(name)) {
    return { slug: 'network-fiber-switch', confidence: 'medium', reason: 'RPS-130W → redundant power supply for switch' };
  }

  // ================================================================
  // 12. BYS-* → VMS / video management
  // ================================================================
  if (/^BYS-/i.test(name)) {
    return { slug: 'kayit-cihazi-nvr', confidence: 'medium', reason: 'BYS- → Tiandy VMS (NVR category)' };
  }

  // ================================================================
  // 13. Fiber optic products
  // ================================================================
  if (/\bCORE\s+FIBER\b|\bFIBER\s+OPTIK\s+KABLO\b/i.test(up)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'Core Fiber / Fiber Optik Kablo' };
  }
  if (/^(FC|LC|SC|ST)\s*-\s*(FC|LC|SC|ST|APC)/i.test(name) || /^FC\/APC/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'Fiber patch cord / pigtail' };
  }
  if (/^DMC\s|^CMC\s|^CH\s*100/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'Media converter → Fiber Optik' };
  }
  if (/\bSFP\b/i.test(up) && !/^(S[345]\d{3}|EPS-|HPS-)/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'SFP module → Fiber Optik' };
  }
  if (/^LR1002$/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'LR1002 → Dahua transmission/converter' };
  }
  if (/^PFM8/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'PFM88x → Dahua PoE/fiber extender' };
  }
  if (/^PFM79/i.test(name)) {
    return { slug: 'network-fiber-poe-switchler', confidence: 'high', reason: 'PFM79x → Dahua PoE switch' };
  }
  if (/^PFM9/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'PFM90x → Dahua media converter' };
  }
  if (/KONEKTÖR|PIGTAIL|ADAPTÖR|TEMIZLEME/i.test(up) ||
      /^(FC|LC|SC|ST)[-\s]+(MM|SM|OS1|APC)/i.test(name) ||
      /FIBER\s*ADAPTÖR|FIBER\s*TEMIZ/i.test(up)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'Fiber connector/pigtail/adapter → Fiber Optik' };
  }
  if (/^FTB\s*\d+/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'FTB → fiber tool box' };
  }
  if (/^MC\s*\d{3,4}\s*[A-Z]{2}/i.test(name) || /^MC1001/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'MC-series → media converter' };
  }
  if (/^MFC\s*\d{4}/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'MFC-series → fiber converter chassis' };
  }
  if (/^MS\s*\d{5}/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'MS-series → fiber management' };
  }
  if (/^BNC/i.test(name)) {
    return { slug: 'kablo-aksesuar-goruntu-kablolari', confidence: 'high', reason: 'BNC connector → görüntü kablosu' };
  }
  if (/EPOKSI|EPOXY/i.test(up)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'medium', reason: 'Fiber epoxy adhesive → Fiber Optik' };
  }
  if (/^POWER\s+SUPPLY\s+ADAPTÖR/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'medium', reason: 'Power supply adapter → fiber rack' };
  }
  if (/^ST\s*0[12]$/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'medium', reason: 'ST 01/02 → fiber splice tray' };
  }
  if (/^OM\s*\d{4}/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'medium', reason: 'OM → optical module / media converter' };
  }

  // ================================================================
  // 14. Monitors
  // ================================================================
  if (/LED\s*MONİTÖR|LED\s*MONITOR/i.test(up)) {
    return { slug: 'bilgisayar-sunucu-monitor', confidence: 'high', reason: 'LED Monitör → Monitör' };
  }
  if (/^DHL\d/i.test(name)) {
    return { slug: 'bilgisayar-sunucu-monitor', confidence: 'high', reason: 'DHL → Dahua monitor' };
  }
  if (/^TM-LED/i.test(name)) {
    return { slug: 'bilgisayar-sunucu-monitor', confidence: 'high', reason: 'TM-LED → Tiandy monitor' };
  }
  if (/^LM\d{2}/i.test(name) && !/SINIRSIZ/i.test(up)) {
    return { slug: 'bilgisayar-sunucu-monitor', confidence: 'high', reason: 'LM-series → Dahua monitor' };
  }
  if (/^KIV[-\s]\d{3}/i.test(name)) {
    return { slug: 'bilgisayar-sunucu-monitor', confidence: 'high', reason: 'KIV → CCTV monitor/videowall' };
  }
  if (/^MNTR\d/i.test(name) || /MONİTÖR|MONITOR/i.test(up)) {
    return { slug: 'bilgisayar-sunucu-monitor', confidence: 'high', reason: 'Monitor product → Monitör' };
  }
  if (/^TC\s+\d{3}\s*-\s*TC\s+\d{3}\s+LED/i.test(name)) {
    return { slug: 'bilgisayar-sunucu-monitor', confidence: 'high', reason: 'TC-range LED HD → monitor' };
  }

  // ================================================================
  // 15. VTH / VTO / VTS / VTT → door station / intercom
  // ================================================================
  if (/^VTH|^VTO[-\d]|^VTO\d|^VTS|^VTT/i.test(name)) {
    return { slug: 'gecis-kontrol-kapi-i-stasyonu', confidence: 'high', reason: 'VTH/VTO/VTS/VTT → Dahua kapı istasyonu' };
  }

  // ================================================================
  // 16. EATON fire alarm products
  // ================================================================
  if (/^CF\d|^CSC\d|^CIO\d|^CXPC|^DF\d|^EC\d|^FX\d|^LP\d|^MAB|^MAH|^MAOH|^MAP|^MAS|^MASB|^MBG|^MIU|^MMIM|^MMOM|^SPS-24|^ROLP/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-yangin-alarm', confidence: 'high', reason: 'EATON fire alarm product' };
  }

  // ================================================================
  // 17. Alarm / access control
  // ================================================================
  if (/^KSI\d/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'high', reason: 'KSI* → Risco hırsız alarm ürünü' };
  }
  if (/SIREN|HARICI SİREN/i.test(up)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'high', reason: 'Siren → Hırsız Alarm' };
  }
  if (/^GK[-\s]\d{4}/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'high', reason: 'GK-1224 → alarm panel' };
  }
  if (/^AC[-\s]\d+\s*RF/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'high', reason: 'AC-4000 RF → alarm receiver' };
  }
  if (/^ESP\s*\d{4}/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'high', reason: 'ESP → alarm panel' };
  }
  if (/^ABX\s*\d{3,4}/i.test(name) || /^ABL\s*\d+/i.test(name) || /^ABI\s*-/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'high', reason: 'ABX/ABL/ABI → alarm module' };
  }
  if (/^\d+\s+SU$/i.test(name) || /^\d+\s+FP$/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'SU/FP panel → alarm panel' };
  }
  if (/^BT\s+00[34]$/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'high', reason: 'BT 003/004 → alarm remote' };
  }
  if (/^DB\s*-?\s*111$/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'DB-111 → alarm contact' };
  }
  if (/^MC[-\s]+\d+$/i.test(name) || /^MC-\s*\d+/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'high', reason: 'MC-series → alarm keypad' };
  }
  if (/^TRAFO/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'Trafo → alarm transformer' };
  }
  if (/^SR\s*400|^SBR[-\s]/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'SR/SBR → alarm siren/detector' };
  }
  if (/^TD[-\s]/i.test(name) && /\d{3}/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'TD-series → alarm detector' };
  }
  if (/^TP[-\s]/i.test(name) && /\d{2}/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'TP-series → alarm peripheral' };
  }
  if (/^TS[-\s]/i.test(name) && /\d{3}/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'TS-series → alarm sensor' };
  }
  if (/^P\s*-\s*2000/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'P-2000 → alarm panel' };
  }
  if (/^OKS[-\s]\d+/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'OKS-500M → alarm siren' };
  }
  if (/^BEL00[25]/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'BEL002/005 → alarm accessory' };
  }
  if (/^INS\s*\d{4}/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'INS → alarm panel' };
  }
  if (/^KUMANDA$/i.test(name.trim())) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'Kumanda → alarm remote' };
  }
  if (/^TC[-\s]\d{3}/i.test(name) && src === 'akilli-ev-otomasyon') {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'TC-series alarm (from akilli-ev)' };
  }
  if (/^TC[-\s]+2100C/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-gecis-kontrol', confidence: 'medium', reason: 'TC-2100C → access control reader' };
  }
  if (/^MD\s*\d{3}/i.test(name)) {
    return { slug: 'gecis-kontrol-alarm-hirsiz-alarm', confidence: 'medium', reason: 'MD → motion detector' };
  }

  // ================================================================
  // 18. Batteries / Akü
  // ================================================================
  if (/AH\s*-?\s*\d|\bAKÜ\b|\bAH\b.*VOLT|\bVOLT\b.*AKÜ/i.test(up)) {
    return { slug: 'guc-elektronigi-aku', confidence: 'high', reason: 'Akü / battery product' };
  }

  // ================================================================
  // 19. CNB brand cameras → analog
  // ================================================================
  if (/^(BBB|BBF|BE\d|BFE|BFF|CCM\s|DBB|DBF|DBM|DFL|IDC|IDP|LBB|LBM|LCB|LCM|MPC|PTD|VBM|VC\s|VLL|XCB|XCL|XCM|VBF)/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'high', reason: 'CNB brand → Analog camera' };
  }

  // ================================================================
  // 20. diger-urunler / generic remaining rules
  // ================================================================

  // DVR (generic)
  if (/^DVR\d/i.test(name)) {
    const ch = recorderChannels(name);
    if (ch !== null) return { slug: dvrSlugByChannel(ch), confidence: 'high', reason: `DVR ${ch}ch` };
    return { slug: 'kayit-cihazi-dvr', confidence: 'high', reason: 'DVR → kayıt cihazı' };
  }

  // NVR-716 / NVS-04R
  if (/^NVR[-\s]/i.test(name) || /^NVS\s*\d/i.test(name)) {
    const ch = recorderChannels(name);
    if (ch !== null) return { slug: nvrSlugByChannel(ch), confidence: 'high', reason: `NVR ${ch}ch` };
    return { slug: 'kayit-cihazi-nvr', confidence: 'high', reason: 'NVR → kayıt cihazı' };
  }

  // RYK-IP* → IP cameras
  if (/^RYK-IP/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'high', reason: 'RYK-IP → IP camera' };
  }

  // RYK brand analog cameras
  if (/^RYK[-\s]/i.test(name) && !/IP/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'medium', reason: 'RYK → analog camera' };
  }

  // HD/HDS/HT series DVR
  if (/^HD[-\s]\d{4}/i.test(name) || /^HD4\d{3}/i.test(name) || /^HDS\s*\d/i.test(name) || /^HT\s*\d/i.test(name)) {
    return { slug: 'kayit-cihazi-dvr', confidence: 'medium', reason: 'HD/HDS/HT series → DVR' };
  }

  // PLUS-1648, PLUS-824 → DVR
  if (/^PLUS\s*\d{3,4}/i.test(name) || /^PLUS\s*412/i.test(name)) {
    return { slug: 'kayit-cihazi-dvr', confidence: 'medium', reason: 'PLUS series → DVR' };
  }

  // ES-1648, ES-824 → DVR
  if (/^ES\s*\d{3,4}/i.test(name)) {
    return { slug: 'kayit-cihazi-dvr', confidence: 'medium', reason: 'ES series → DVR' };
  }

  // AL-540 → analog cameras
  if (/^AL\s*\d{3}/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'medium', reason: 'AL → analog camera' };
  }

  // CM-480 → analog camera
  if (/^CM\s*\d{3}/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'medium', reason: 'CM → color module analog camera' };
  }

  // IGP / ISS → IP camera
  if (/^IGP\s*\d{4}/i.test(name) || /^ISS\s*\d{4}/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'medium', reason: 'IGP/ISS → IP camera' };
  }

  // IR-624 / IR-608 → analog cameras
  if (/^IR[-\s]\d{3}/i.test(name)) {
    if (/IRD|DMB/i.test(up)) {
      return { slug: 'cctv-aksesuarlar', confidence: 'medium', reason: 'IR-DMB/IRD → IR illuminator accessory' };
    }
    return { slug: 'cctv-analog-kameralar', confidence: 'medium', reason: 'IR → analog camera' };
  }

  // LML → analog
  if (/^LML\s*\d{2}/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'medium', reason: 'LML → analog camera module' };
  }

  // PR-E700 → recorder
  if (/^PR-E\d/i.test(name)) {
    return { slug: 'cctv-kayit-cihazi', confidence: 'medium', reason: 'PR-E → recorder' };
  }

  // PRO-361 → IP camera
  if (/^PRO[-\s]\d{3}/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'medium', reason: 'PRO-361 → IP camera' };
  }

  // SM-724 → analog
  if (/^SM\s*\d{3}/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'medium', reason: 'SM → analog surveillance camera' };
  }

  // SMB / SDN → analog
  if (/^SMB[-\s]\d|^SDN\s*\d/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'medium', reason: 'SMB/SDN → analog camera' };
  }

  // TC-402 NVR / TC-504 / TC-508 / TC-516 P (in diger-urunler)
  if (/^TC[-\s]\d{3}|^TC-\d{3}/i.test(name)) {
    if (/NVR|DVR/i.test(up)) {
      return { slug: 'cctv-kayit-cihazi', confidence: 'high', reason: 'TC NVR/DVR → kayıt cihazı' };
    }
    if (src === 'diger-urunler') {
      return { slug: 'cctv-kayit-cihazi', confidence: 'medium', reason: 'TC-series (diger) → kayıt cihazı' };
    }
  }

  // V1862 / VBF → analog
  if (/^V\d{4}|^VBF/i.test(name)) {
    return { slug: 'cctv-analog-kameralar', confidence: 'medium', reason: 'V-series/VBF → analog camera' };
  }

  // ================================================================
  // 21. Ex-proof / cable accessories
  // ================================================================
  if (/^RG[-\s]\d+/i.test(name)) {
    return { slug: 'kablo-aksesuar-goruntu-kablolari', confidence: 'high', reason: 'RG coax cable → görüntü kablosu' };
  }
  if (/^GO\s+AUDIO/i.test(name)) {
    return { slug: 'cctv-aksesuarlar', confidence: 'medium', reason: 'GO Audio → CCTV audio accessory' };
  }
  if (/^EX[-\s]\d[,.]?\d?M$/i.test(name) || /^EX[-\s]\d+M$/i.test(name)) {
    return { slug: 'kablo-aksesuar-goruntu-kablolari', confidence: 'medium', reason: 'Ex-xM → cable extension' };
  }

  // ================================================================
  // 22. CCTV accessories
  // ================================================================
  if (/^AA002/i.test(name)) {
    return { slug: 'cctv-aksesuarlar', confidence: 'medium', reason: 'AA002 → camera accessory' };
  }
  if (/^PFT[-\s]?\d{4}/i.test(name)) {
    return { slug: 'cctv-aksesuarlar', confidence: 'high', reason: 'PFT-series → Tiandy camera accessory' };
  }
  if (/^OTC\s*\d/i.test(name)) {
    return { slug: 'cctv-aksesuarlar', confidence: 'high', reason: 'OTC → HDCVI optical transmitter' };
  }

  // ================================================================
  // 23. DH-* Dahua named products
  // ================================================================
  if (/^DH-/i.test(name)) {
    if (/NVR/i.test(up)) {
      const ch = recorderChannels(name);
      if (ch !== null) return { slug: nvrSlugByChannel(ch), confidence: 'high', reason: `DH-NVR ${ch}ch` };
      return { slug: 'kayit-cihazi-nvr', confidence: 'high', reason: 'DH-*NVR → Dahua NVR' };
    }
    if (/DVR/i.test(up)) {
      const ch = recorderChannels(name);
      if (ch !== null) return { slug: dvrSlugByChannel(ch), confidence: 'high', reason: `DH-DVR ${ch}ch` };
      return { slug: 'kayit-cihazi-dvr', confidence: 'high', reason: 'DH-*DVR → Dahua DVR' };
    }
    if (/XVR/i.test(up)) {
      return { slug: 'kayit-cihazi-xvr', confidence: 'high', reason: 'DH-*XVR → Dahua XVR' };
    }
    return { slug: 'cctv-ip-kameralar', confidence: 'medium', reason: 'DH- prefix → Dahua IP camera' };
  }

  // ================================================================
  // 24. Tiandy PS-* PoE switches
  // ================================================================
  if (/^PS[-\s]?\d{1,4}[EGKP]/i.test(name) || /^PS-END|^PS-1[0-9]{3}|^PS-10014|^PS16-|^PS32-/i.test(name)) {
    if (/POE|PoE|-P/i.test(name) || /-E[0-9]/i.test(name)) {
      return { slug: 'network-fiber-poe-switchler', confidence: 'high', reason: 'PS-* PoE → Tiandy PoE switch' };
    }
    if (/DECODER/i.test(up)) {
      return { slug: 'kayit-cihazi-nvr', confidence: 'high', reason: 'PS-DECODER → video decoder' };
    }
    return { slug: 'network-fiber-switch', confidence: 'high', reason: 'PS-* → Tiandy switch' };
  }
  if (/^PS-1G$/i.test(name)) {
    return { slug: 'network-fiber-switch', confidence: 'medium', reason: 'PS-1G → Tiandy switch/SFP' };
  }

  // ================================================================
  // 25. Wireless bridge
  // ================================================================
  if (/^WA-\d+KM/i.test(name)) {
    return { slug: 'network-fiber', confidence: 'high', reason: 'WA-xKM → Tiandy wireless bridge' };
  }

  // ================================================================
  // 26. Software / Licenses
  // ================================================================
  if (/SINIRSIZ.*PAKET|PAKET.*YENİLEME/i.test(up)) {
    return { slug: 'yazilim-lisans', confidence: 'high', reason: 'Software / license renewal package' };
  }

  // ================================================================
  // 27. Mobile cameras
  // ================================================================
  if (/^OK-713\s*M/i.test(name)) {
    return { slug: 'ip-kameralar-ptz-kameralar', confidence: 'high', reason: 'OK-713 M → Ex-proof mobile PTZ' };
  }
  if (/^MLCDF/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'medium', reason: 'MLCDF → mobile IP camera' };
  }

  // ================================================================
  // 28. C3A (Dahua compact IP)
  // ================================================================
  if (/^C3A$/i.test(name)) {
    return { slug: 'cctv-ip-kameralar', confidence: 'medium', reason: 'C3A → Dahua compact IP camera' };
  }

  // ================================================================
  // 29. Mobile NVR / MXVR / NVR0x → mobile recording (NVR category)
  // ================================================================
  if (/^MXVR\d/i.test(name)) {
    // MXVR = Mobile XVR — treat as XVR
    const ch = recorderChannels(name);
    if (ch !== null) return { slug: xvrSlugByChannel(ch), confidence: 'high', reason: `MXVR mobile ${ch}ch → XVR` };
    return { slug: 'kayit-cihazi-xvr', confidence: 'high', reason: 'MXVR → mobile XVR' };
  }
  // NVR0404MF / NVR0804MF → mobile NVR
  if (/^NVR0[48][0-9]{2}MF/i.test(name)) {
    const chMatch = name.match(/^NVR0([48])/i);
    const ch = chMatch ? parseInt(chMatch[1], 10) : null;
    if (ch !== null) return { slug: nvrSlugByChannel(ch), confidence: 'high', reason: `NVR0x04MF mobile NVR ${ch}ch` };
    return { slug: 'kayit-cihazi-nvr', confidence: 'high', reason: 'NVR0x04MF → mobile NVR' };
  }
  // NVR608-32-4K → 32-channel NVR (large format)
  if (/^NVR6\d{2}-(\d+)/i.test(name)) {
    const ch = parseInt(name.match(/^NVR6\d{2}-(\d+)/i)![1], 10);
    return { slug: nvrSlugByChannel(ch), confidence: 'high', reason: `NVR6xx-${ch}ch large NVR` };
  }
  // TC-C312 → 2MP IP camera (TC-C31x is a special sub-series)
  if (/^TC-C31[0-9]/i.test(name)) {
    return { slug: 'ir-bullet-2mp', confidence: 'medium', reason: 'TC-C31x → Tiandy 2MP IP camera' };
  }
  // SC/APC - SC/APC fiber patch cord (space-padded variant)
  if (/SC\/APC/i.test(name) || /SC-APC/i.test(name)) {
    return { slug: 'network-fiber-fiber-optik', confidence: 'high', reason: 'SC/APC patch cord → Fiber Optik' };
  }

  // ================================================================
  // 30. Space-padded name normalization (recursive)
  // ================================================================
  const normalized = name.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
  if (normalized !== name) {
    const product2: MisplacedProduct = { ...product, name: normalized };
    const result2 = categorise(product2);
    if (result2) return result2;
  }

  return null;
}

// ---------- Main ----------
function main() {
  const dataDir = path.join('/home/tolgabrk/projects/next-ai-teknoloji', 'data');

  const products: MisplacedProduct[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'misplaced-products.json'), 'utf-8')
  );
  const categories: Category[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'legitimate-category-tree.json'), 'utf-8')
  );

  // Build a slug→{id,name} map from the live data to cross-check
  const catMap = new Map<string, { id: string; name: string }>();
  for (const c of categories) {
    catMap.set(c.slug, { id: c.id, name: c.name });
  }

  // Also merge in the pre-resolved CAT map (picks up any slug that the tree might miss)
  for (const [slug, info] of Object.entries(CAT)) {
    if (!catMap.has(slug)) catMap.set(slug, info);
  }

  const matched: MatchedProduct[] = [];
  const unmatched: UnmatchedProduct[] = [];

  for (const product of products) {
    const result = categorise(product);

    if (result) {
      const cat = catMap.get(result.slug) ?? CAT[result.slug];
      if (!cat) {
        unmatched.push({
          productId: product.id,
          productName: product.name,
          fromCategory: product.currentCategorySlug,
          reason: `Pattern matched '${result.slug}' but slug not found in category tree`
        });
        continue;
      }
      matched.push({
        productId: product.id,
        productName: product.name,
        fromCategory: product.currentCategorySlug,
        toCategory: cat.name,
        toCategorySlug: result.slug,
        confidence: result.confidence,
        reason: result.reason
      });
    } else {
      unmatched.push({
        productId: product.id,
        productName: product.name,
        fromCategory: product.currentCategorySlug,
        reason: 'No matching pattern found'
      });
    }
  }

  const output: Output = {
    matched,
    unmatched,
    stats: {
      total: products.length,
      matched: matched.length,
      unmatched: unmatched.length
    }
  };

  fs.writeFileSync(
    path.join(dataDir, 'category-reassignment.json'),
    JSON.stringify(output, null, 2),
    'utf-8'
  );

  console.log('\n=== Smart Categorization Results ===');
  console.log(`Total products : ${output.stats.total}`);
  console.log(`Matched        : ${output.stats.matched} (${((output.stats.matched / output.stats.total) * 100).toFixed(1)}%)`);
  console.log(`Unmatched      : ${output.stats.unmatched} (${((output.stats.unmatched / output.stats.total) * 100).toFixed(1)}%)`);

  // Depth distribution
  const depthCount: Record<number, number> = {};
  for (const m of matched) {
    const catInfo = catMap.get(m.toCategorySlug);
    // Find depth from categories array
    const catEntry = categories.find(c => c.slug === m.toCategorySlug);
    const d = catEntry?.depth ?? -1;
    depthCount[d] = (depthCount[d] ?? 0) + 1;
  }
  console.log('\n--- Matched by category depth ---');
  for (const [d, count] of Object.entries(depthCount).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const pct = ((count / matched.length) * 100).toFixed(1);
    console.log(`  depth=${d}: ${count} products (${pct}%)`);
  }

  // Breakdown by target category
  const targetCount: Record<string, number> = {};
  for (const m of matched) {
    targetCount[m.toCategorySlug] = (targetCount[m.toCategorySlug] ?? 0) + 1;
  }
  console.log('\n--- Matched breakdown by target category ---');
  for (const [slug, count] of Object.entries(targetCount).sort((a, b) => b[1] - a[1])) {
    const catEntry = categories.find(c => c.slug === slug);
    const d = catEntry?.depth ?? '?';
    console.log(`  [d${d}] ${slug.padEnd(50)} ${count}`);
  }

  if (unmatched.length > 0) {
    console.log('\n--- Unmatched products ---');
    for (const u of unmatched) {
      console.log(`  [${u.fromCategory}] ${u.productName} → ${u.reason}`);
    }
  }

  console.log('\nOutput saved to data/category-reassignment.json');
}

main();
