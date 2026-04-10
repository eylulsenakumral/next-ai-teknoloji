#!/usr/bin/env python3
"""B2B Otomatik Login - Ergen credentials ile, diğerleri interaktif."""

import asyncio
import json
import re
import sys
from pathlib import Path
from datetime import datetime
from playwright.async_api import async_playwright

SESSION_DIR = Path.home() / ".bayi-sessions"


async def login_ergen(context):
    """Ergen'e credentials ile otomatik login.
    Login form ana sayfadadır (/giris sayfası yoktur, Error Page döner).
    """
    print("\n" + "=" * 60)
    print("  Ergen Elektronik - Otomatik Login")
    print("=" * 60)

    page = await context.new_page()

    # Ana sayfayı yükle - login formu burada
    print("  Ana sayfa yükleniyor...")
    await page.goto("https://www.ergenelektronik.com/", timeout=30000)
    await page.wait_for_load_state('networkidle', timeout=20000)
    await asyncio.sleep(3)

    title = await page.title()
    print(f"  Sayfa: {title}")

    # Login form alanları - ana sayfada bulunur
    username_field = await page.query_selector('input[name="ctl00$login1$txt_username"]')
    password_field = await page.query_selector('input[name="ctl00$login1$txt_password"]')
    submit_btn = await page.query_selector('input[name="ctl00$login1$btn_login"]')

    print(f"  Username field: {'bulundu' if username_field else 'BULUNAMADI'}")
    print(f"  Password field: {'bulundu' if password_field else 'BULUNAMADI'}")
    print(f"  Submit button:  {'bulundu' if submit_btn else 'BULUNAMADI'}")

    if username_field and password_field:
        print(f"\n  >> Form dolduruluyor...")

        # Alanları temizle ve doldur
        await username_field.click()
        await asyncio.sleep(0.2)
        await username_field.fill("Next")
        await asyncio.sleep(0.3)

        await password_field.click()
        await asyncio.sleep(0.2)
        await password_field.fill("8331")
        await asyncio.sleep(0.3)

        # Submit
        if submit_btn:
            print(f"     Submit butonuna tıklanıyor...")
            await submit_btn.click()
        else:
            print(f"     Enter ile submit...")
            await password_field.press('Enter')

        # Sonuç bekle
        print("     Sonuç bekleniyor (8sn)...")
        await asyncio.sleep(8)

        # Sayfa kontrolü
        current_url = page.url
        print(f"     Son URL: {current_url}")

        # Login sonrası doğrulama - ürün sayfasına git
        print("\n  Fiyat/stok kontrolü için ürün listesi...")
        await page.goto("https://www.ergenelektronik.com/bildirim/yeni_urunler", timeout=20000)
        await page.wait_for_load_state('networkidle', timeout=15000)
        await asyncio.sleep(3)

        text = await page.inner_text('body')
        prices = re.findall(r'[\d.]+,\d{2}\s*(USD|TL|EUR)', text)
        stocks = re.findall(r'Stok\s*:\s*\d+', text)

        if prices:
            print(f"  ✅ LOGIN BAŞARILI - Fiyatlar görünür! ({len(prices)} adet)")
            print(f"     Örnek: {prices[:5]}")
        else:
            print(f"  ⚠️  Fiyat bulunamadı - login başarısız olabilir")

        if stocks:
            print(f"  ✅ Stok bilgisi görünür! ({len(stocks)} adet)")

        # "Çıkış" metni var mı (login göstergesi)
        if 'çıkış' in text.lower() or 'cikis' in text.lower():
            print(f"  ✅ Çıkış linki bulundu - login aktif!")
    else:
        print("\n  ❌ Login form alanları bulunamadı!")

    # Cookie'leri kaydet
    cookies = await context.cookies()
    relevant = [c for c in cookies if 'ergenelektronik.com' in c.get('domain', '')]

    session_file = SESSION_DIR / "ergen.json"
    state_data = {
        "cookies": cookies,
        "origins": [],
        "timestamp": datetime.now().isoformat(),
        "site": "ergen",
        "domain": "www.ergenelektronik.com",
    }
    session_file.write_text(json.dumps(state_data, indent=2, ensure_ascii=False))
    print(f"\n  📁 {len(relevant)} site cookie / {len(cookies)} total")

    await page.close()
    return len(relevant)


async def login_interactive(context, site_key, name, login_url, base_url):
    """İnteraktif login."""
    print(f"\n{'='*60}")
    print(f"  {name} - İnteraktif Login")
    print(f"{'='*60}")

    page = await context.new_page()
    await page.goto(login_url, timeout=30000)
    await asyncio.sleep(2)

    title = await page.title()
    print(f"  Sayfa: {title}")
    print(f"\n  👆 Tarayıcıda login olun, sonra Enter'a basın...")

    await asyncio.get_event_loop().run_in_executor(None, input)

    cookies = await context.cookies()
    domain = base_url.split('/')[2]
    relevant = [c for c in cookies if domain in c.get('domain', '')]

    session_file = SESSION_DIR / f"{site_key}.json"
    state_data = {
        "cookies": cookies,
        "origins": [],
        "timestamp": datetime.now().isoformat(),
        "site": site_key,
        "domain": domain,
    }
    session_file.write_text(json.dumps(state_data, indent=2, ensure_ascii=False))
    print(f"  ✅ {len(relevant)} site cookie / {len(cookies)} total")

    await page.close()
    return len(relevant)


async def main():
    SESSION_DIR.mkdir(parents=True, exist_ok=True)

    target = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in (
        "ergen", "bayikanali", "b2bdepo", "tesan", "edenge", "inox"
    ) else None

    print("🚀 B2B Auto Login Manager")

    playwright = await async_playwright().start()

    browser = await playwright.chromium.launch_persistent_context(
        user_data_dir=str(Path.home() / ".config/google-chrome-cdp"),
        headless=False,
        channel="chrome",
        args=[
            '--disable-blink-features=AutomationControlled',
            '--profile-directory=Profile 1',
        ],
        no_viewport=True,
    )

    try:
        if target == "ergen" or target is None:
            await login_ergen(browser)

        other_sites = [
            ("bayikanali", "BayiKanali", "https://www.bayikanali.com/Login.aspx", "https://www.bayikanali.com"),
            ("b2bdepo", "B2B Depo", "https://b2bdepo.com/Account/Login", "https://b2bdepo.com"),
            ("tesan", "Tesan", "https://isortagim.tesan.com.tr/login", "https://isortagim.tesan.com.tr"),
            ("edenge", "Edenge B2B", "https://www.edenge.com.tr/Account/Login", "https://www.edenge.com.tr"),
            ("inox", "Inox B2B", "https://bayi.inox.com.tr/kullanici/Hesap.aspx?tab=giris", "https://bayi.inox.com.tr"),
        ]

        for sk, sn, lu, bu in other_sites:
            if target == sk or target is None:
                await login_interactive(browser, sk, sn, lu, bu)

    finally:
        await browser.close()
        await playwright.stop()

    # Özet
    print("\n" + "=" * 60)
    print("📊 Session Özeti:")
    all_sites = ["ergen"] + [s[0] for s in other_sites]
    for sk in all_sites:
        sf = SESSION_DIR / f"{sk}.json"
        if target and target != sk:
            continue
        if sf.exists():
            data = json.loads(sf.read_text())
            ts = data.get('timestamp', '?')
            domain = data.get('domain', '?')
            count = len([c for c in data.get('cookies', []) if domain in c.get('domain', '')])
            print(f"  {sk:<15} ✅ {count} cookie ({ts[:16]})")
        else:
            print(f"  {sk:<15} ❌ Yok")

    print("\n✅ Tamamlandı!")


if __name__ == "__main__":
    asyncio.run(main())
