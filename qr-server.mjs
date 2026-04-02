import http from 'http';
import fs from 'fs';

const PORT = 9998;

http.createServer((req, res) => {
  try {
    const d = JSON.parse(fs.readFileSync('.whatsapp-state.json', 'utf8'));
    const qr = d.qr || '';
    const status = d.status || 'unknown';
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;margin:0">
  <h2 style="margin-bottom:8px">NexaDepo WhatsApp QR</h2>
  <p style="margin-top:0;color:#aaa;font-size:14px">Durum: ${status}</p>
  ${status === 'connected'
    ? '<p style="font-size:48px">&#10004;&#65039; Baglandi!</p>'
    : `<img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}" style="border:4px solid #25D366;border-radius:12px;max-width:90vw"/>`
  }
  <p style="margin-top:16px;color:#888;font-size:13px">WhatsApp > Ayarlar > Bagli Cihazlar > Cihaz Bagla</p>
  <p style="color:#555;font-size:11px">${new Date().toLocaleTimeString('tr-TR')} - Otomatik yenileme</p>
  <script>setTimeout(()=>location.reload(),10000)</script>
</body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (e) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1 style="color:#fff;background:#111;padding:40px">QR hazirlaniyor...</h1><script>setTimeout(()=>location.reload(),3000)</script>');
  }
}).listen(PORT, '0.0.0.0', () => console.log(`QR server: http://0.0.0.0:${PORT}`));
