"""Auth module - CDP cookies and FlareSolverr integration."""

import json
import logging
from pathlib import Path

import requests

from .config import SITES, FLARESOLVERR_URL

from .models import ScrapedProduct

logger = logging.getLogger("b2b-scraper.auth")

SESSION_DIR = Path.home() / ".bayi-sessions"


def get_cookies(site: str) -> list[dict]:
    """Read cookies from ~/.bayi-sessions/{site}.json"""
    config = SITES.get(site)
    if not config:
        logger.error("Unknown site: %s", site)
        return []

    # Try different session file naming conventions
    candidates = [
        SESSION_DIR / f"{site}.json",
        SESSION_DIR / f"{site}-loggedin.json",
        SESSION_DIR / f"{site}-cdp.json",
    ]

    for session_file in candidates:
        if session_file.exists():
            try:
                data = json.loads(session_file.read_text())
                cookies = data.get("cookies", [])
                if cookies:
                    logger.info("Loaded %d cookies from %s", len(cookies), session_file.name)
                    return cookies
            except (json.JSONDecodeError, KeyError) as e:
                logger.error("Failed to parse session %s: %s", session_file.name, e)

    logger.warning("No session file found for %s", site)
    return []


def get_session_data(site: str) -> dict | None:
    """Get full session data including cookies and localStorage."""
    candidates = [
        SESSION_DIR / f"{site}.json",
        SESSION_DIR / f"{site}-loggedin.json",
        SESSION_DIR / f"{site}-cdp.json",
    ]

    for session_file in candidates:
        if session_file.exists():
            try:
                return json.loads(session_file.read_text())
            except (json.JSONDecodeError):
                pass
    return None


def is_session_valid(site: str) -> bool:
    """Check if session cookies exist and not expired."""
    cookies = get_cookies(site)
    return len(cookies) > 0


def solve_cloudflare(url: str) -> dict | None:
    """Bypass Cloudflare using FlareSolverr."""
    try:
        response = requests.post(
            FLARESOLVERR_URL,
            json={
                "cmd": "request.get",
                "url": url,
                "maxTimeout": 60000,
            },
            timeout=90,
        )
        data = response.json()
        if data.get("status") == "ok":
            solution = data.get("solution", {})
            logger.info("Cloudflare bypass for %s", url)
            return solution
        logger.warning("FlareSolverr failed for %s", url)
        return None
    except Exception as e:
        logger.error("FlareSolverr error: %s", e)
        return None
