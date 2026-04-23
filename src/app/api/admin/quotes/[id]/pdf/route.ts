import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

// GET /api/admin/quotes/[id]/pdf — HTML döndür (client-side jsPDF ile PDF'e çevrilir)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  const { id } = await params

  try {
    const quote = await prisma.quote.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 })
    }

    // Şirket bilgilerini ayarlardan al
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["company_name", "company_address", "company_phone", "company_email", "company_tax_office", "company_tax_number"] } },
    })
    const getSetting = (key: string) => settings.find((s) => s.key === key)?.value ?? ""

    // Logo'yu base64 olarak oku
    const companyName = getSetting("company_name") || "Next AI Teknoloji"
    let logoSrc = ""
    const logoPath = join(process.cwd(), "public", "logobeyaz.png")
    if (existsSync(logoPath)) {
      const logoBuf = readFileSync(logoPath)
      logoSrc = `data:image/png;base64,${logoBuf.toString("base64")}`
    }

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DejaVu Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; color: #2c3e50; font-size: 13px; line-height: 1.5; }

  /* ---- Üst Başlık Çubuğu ---- */
  .top-bar {
    background: linear-gradient(135deg, #021fa3 0%, #021fa3 100%);
    color: white;
    padding: 20px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .top-bar .logo-area { display: flex; align-items: center; }
  .top-bar .logo-area img { height: 100px; }
  .top-bar .logo-area .company-name { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
  .top-bar .quote-title { text-align: right; }
  .top-bar .quote-title h1 { font-size: 32px; font-weight: 700; letter-spacing: 3px; opacity: 0.95; }
  .top-bar .quote-title p { font-size: 12px; opacity: 0.75; margin-top: 4px; }

  /* ---- İçerik ---- */
  .content { padding: 28px 40px 20px; }

  /* ---- Bilgi Kutuları ---- */
  .info-row { display: flex; gap: 20px; margin-bottom: 24px; }
  .info-box { flex: 1; border: 1px solid #d5dce4; border-radius: 6px; overflow: hidden; }
  .info-box .box-header {
    background: #eef2f7;
    padding: 8px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #021fa3;
    border-bottom: 1px solid #d5dce4;
  }
  .info-box .box-body { padding: 12px 14px; }
  .info-box .box-body .field { display: flex; margin-bottom: 5px; font-size: 12px; }
  .info-box .box-body .field:last-child { margin-bottom: 0; }
  .info-box .box-body .field .label { color: #7f8c9b; min-width: 90px; flex-shrink: 0; }
  .info-box .box-body .field .value { font-weight: 600; color: #2c3e50; }

  /* ---- Ürün Tablosu ---- */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d5dce4; border-radius: 6px; overflow: hidden; }
  thead th {
    background: #021fa3;
    color: white;
    padding: 10px 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-align: left;
  }
  thead th.num { text-align: right; }
  thead th.center { text-align: center; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #e8ecf1; font-size: 12px; }
  tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody td.center { text-align: center; }
  tbody tr:nth-child(even) { background: #f8fafb; }
  tbody tr:last-child td { border-bottom: none; }

  /* ---- Toplamlar ---- */
  .totals-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .totals-box { width: 300px; border: 1px solid #d5dce4; border-radius: 6px; overflow: hidden; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 13px; background: #fff; }
  .totals-row + .totals-row { border-top: 1px solid #eef2f7; }
  .totals-row.grand {
    background: #021fa3;
    color: white;
    font-size: 15px;
    font-weight: 700;
    border-top: none;
  }
  .totals-row .label { color: #5a6a7a; }
  .totals-row.grand .label { color: rgba(255,255,255,0.85); }
  .totals-row .value { font-variant-numeric: tabular-nums; }

  /* ---- Notlar ---- */
  .notes-section {
    background: #fef9ef;
    border: 1px solid #f0dca0;
    border-radius: 6px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }
  .notes-section h4 { font-size: 11px; color: #8a6d2b; letter-spacing: 0.5px; margin-bottom: 6px; }
  .notes-section p { font-size: 12px; color: #6b5318; white-space: pre-wrap; }

  /* ---- Geçerlilik ---- */
  .valid-until { text-align: center; font-size: 12px; color: #7f8c9b; margin-bottom: 16px; padding: 10px; border: 1px dashed #c8d0da; border-radius: 6px; }

  /* ---- Alt Bilgi ---- */
  .footer {
    background: #eef2f7;
    padding: 16px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    color: #7f8c9b;
    border-top: 1px solid #d5dce4;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }
  .footer .company-info { line-height: 1.6; }
  .footer .disclaimer { text-align: right; font-style: italic; }
</style>
</head>
<body>

  <!-- Üst Başlık Çubuğu -->
  <div class="top-bar">
    <div class="logo-area">
      ${logoSrc ? `<img src="${logoSrc}" alt="Logo" />` : `<div class="company-name">${companyName}</div>`}
    </div>
    <div class="quote-title">
      <h1>TEKLİF</h1>
      <p>${companyName}</p>
    </div>
  </div>

  <div class="content">

    <!-- Bilgi Kutuları -->
    <div class="info-row">
      <div class="info-box">
        <div class="box-header">MÜŞTERİ BİLGİLERİ</div>
        <div class="box-body">
          <div class="field"><span class="label">Firma</span><span class="value">${quote.customer.companyName}</span></div>
          ${quote.customer.address ? `<div class="field"><span class="label">Adres</span><span class="value">${quote.customer.address}</span></div>` : ""}
          ${quote.customer.city ? `<div class="field"><span class="label">Şehir</span><span class="value">${quote.customer.city}</span></div>` : ""}
          ${quote.customer.phone ? `<div class="field"><span class="label">Telefon</span><span class="value">${quote.customer.phone}</span></div>` : ""}
          ${quote.customer.email ? `<div class="field"><span class="label">E-posta</span><span class="value">${quote.customer.email}</span></div>` : ""}
          ${quote.customer.taxNumber ? `<div class="field"><span class="label">VKN/TCKN</span><span class="value">${quote.customer.taxNumber}</span></div>` : ""}
          <div class="field"><span class="label">Bayi Kodu</span><span class="value">${quote.customer.dealerCode}</span></div>
        </div>
      </div>
      <div class="info-box">
        <div class="box-header">TEKLİF BİLGİLERİ</div>
        <div class="box-body">
          <div class="field"><span class="label">Teklif No</span><span class="value">${quote.quoteNumber}</span></div>
          <div class="field"><span class="label">Tarih</span><span class="value">${formatDate(quote.createdAt)}</span></div>
          ${quote.validUntil ? `<div class="field"><span class="label">Geçerlilik</span><span class="value">${formatDate(quote.validUntil)}</span></div>` : ""}
          <div class="field"><span class="label">Durum</span><span class="value">${quote.status === "DRAFT" ? "Taslak" : quote.status === "SENT" ? "Gönderildi" : quote.status === "ACCEPTED" ? "Kabul Edildi" : quote.status}</span></div>
          <div class="field"><span class="label">Para Birimi</span><span class="value">USD ($)</span></div>
          <div class="field"><span class="label">Kalem Sayısı</span><span class="value">${quote.items.length} ürün</span></div>
        </div>
      </div>
    </div>

    <!-- Ürün Tablosu -->
    <table>
      <thead>
        <tr>
          <th style="width:36px" class="center">#</th>
          <th>Ürün Adı</th>
          <th style="width:60px" class="center">Miktar</th>
          <th style="width:110px" class="num">Birim Fiyat</th>
          <th style="width:90px" class="num">İskonto</th>
          <th style="width:60px" class="center">KDV %</th>
          <th style="width:110px" class="num">Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${quote.items.map((item, i) => `
          <tr>
            <td class="center">${i + 1}</td>
            <td>${item.productName}</td>
            <td class="center">${item.quantity}</td>
            <td class="num">${formatCurrency(Number(item.unitPrice))}</td>
            <td class="num">${Number(item.discountAmount) > 0 ? formatCurrency(Number(item.discountAmount)) : "—"}</td>
            <td class="center">${Number(item.vatRate)}%</td>
            <td class="num">${formatCurrency(Number(item.lineTotal))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Toplamlar -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="label">Ara Toplam</span>
          <span class="value">${formatCurrency(Number(quote.subtotal))}</span>
        </div>
        ${Number(quote.discountTotal) > 0 ? `
        <div class="totals-row" style="color:#c0392b;">
          <span class="label" style="color:#c0392b;">İskonto</span>
          <span class="value">-${formatCurrency(Number(quote.discountTotal))}</span>
        </div>` : ""}
        <div class="totals-row">
          <span class="label">KDV Toplamı</span>
          <span class="value">${formatCurrency(Number(quote.vatTotal))}</span>
        </div>
        <div class="totals-row grand">
          <span>Genel Toplam</span>
          <span>${formatCurrency(Number(quote.grandTotal))}</span>
        </div>
      </div>
    </div>

    ${quote.notes ? `
    <div class="notes-section">
      <h4>NOTLAR</h4>
      <p>${quote.notes}</p>
    </div>` : ""}

    ${quote.validUntil ? `
    <div class="valid-until">
      Bu teklif ${formatDate(quote.validUntil)} tarihine kadar geçerlidir.
    </div>` : ""}

  </div>

  <!-- Alt Bilgi -->
  <div class="footer">
    <div class="company-info">
      <strong>Next AI Teknoloji Yazılım San ve Tic Ltd Şti</strong>
      ${getSetting("company_address") ? `<br/>${getSetting("company_address")}` : ""}
      ${getSetting("company_phone") ? ` | ${getSetting("company_phone")}` : ""}${getSetting("company_email") ? ` | ${getSetting("company_email")}` : ""}
      ${getSetting("company_tax_office") || getSetting("company_tax_number") ? `<br/>${getSetting("company_tax_office") || ""} ${getSetting("company_tax_number") ? "— " + getSetting("company_tax_number") : ""}` : ""}
    </div>
    <div class="disclaimer">
      <div style="font-size:12px;font-weight:600;color:#021fa3;margin-bottom:3px;">Elektronik adına aradığınız herşey için nexadepo.com</div>
      <div>Bu teklif bilgilendirme amaçlıdır, resmi fatura yerine geçmez.</div>
    </div>
  </div>

</body>
</html>`

    // Client-side jsPDF + html2canvas ile PDF oluşturuluyor — sadece HTML döndür
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (err) {
    console.error("[POST /api/admin/quotes/[id]/pdf]", err)
    return NextResponse.json({ error: "PDF oluşturulamadı." }, { status: 500 })
  }
}
