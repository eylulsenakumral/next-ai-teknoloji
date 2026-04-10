"""B2B site configurations."""

from dataclasses import dataclass


@dataclass
class SiteConfig:
    code: str
    name: str
    base_url: str
    login_url: str
    category_url: str | None = None
    cloudflare: bool = False
    delay: float = 2.5
    pagination: bool = True
    max_pages: int = 50


SITES: dict[str, SiteConfig] = {
    "ergen": SiteConfig(
        code="ergen",
        name="Ergen Elektronik",
        base_url="https://www.ergenelektronik.com",
        login_url="https://www.ergenelektronik.com/",  # Login form is on homepage
        cloudflare=False,
        delay=2.0,
    ),
    "bayikanali": SiteConfig(
        code="bayikanali",
        name="BayiKanali",
        base_url="https://www.bayikanali.com",
        login_url="https://www.bayikanali.com/Login.aspx",
        cloudflare=True,
        delay=3.0,
    ),
    "b2bdepo": SiteConfig(
        code="b2bdepo",
        name="B2B Depo",
        base_url="https://www.b2bdepo.com",
        login_url="https://www.b2bdepo.com/Account/Login",
        cloudflare=True,
        delay=3.0,
    ),
    "tesan": SiteConfig(
        code="tesan",
        name="Tesan",
        base_url="https://isortagim.tesan.com.tr",
        login_url="https://isortagim.tesan.com.tr/login",
        cloudflare=False,
        delay=2.5,
    ),
    "edenge": SiteConfig(
        code="edenge",
        name="Edenge B2B",
        base_url="https://www.edenge.com.tr",
        login_url="https://www.edenge.com.tr/Account/Login",
        cloudflare=False,
        delay=2.5,
    ),
    "inox": SiteConfig(
        code="inox",
        name="Inox B2B",
        base_url="https://bayi.inox.com.tr",
        login_url="https://bayi.inox.com.tr/kullanici/Hesap.aspx?tab=giris",
        cloudflare=True,
        delay=3.0,
    ),
}

SESSION_DIR = "~/.bayi-sessions"
FLARESOLVERR_URL = "http://localhost:8191/v1"
