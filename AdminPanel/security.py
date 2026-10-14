"""
Cookie-based session handling for the TruScan admin panel.

Hardened version of the demo file:
  * passwords are verified against a scrypt hash (stdlib, no new packages)
  * credentials come from environment variables, not source code
  * sessions expire (8 h absolute) and are capped in number
  * failed logins are rate-limited per IP
  * the old function names still exist, so routes/auth.py and main.py keep working

Set these before starting uvicorn (PowerShell):
    $env:TRUSCAN_ADMIN_USER = "admin"
    $env:TRUSCAN_ADMIN_HASH = "<output of: python make_hash.py>"
If TRUSCAN_ADMIN_HASH is not set, it falls back to the old demo login
(admin / admin123) and prints a warning, so nothing breaks while you migrate.
"""
import base64
import hashlib
import hmac
import os
import secrets
import time

from fastapi import HTTPException, Request, status

SESSION_COOKIE_NAME = "truscan_session"
SESSION_TTL = 8 * 60 * 60          # seconds
MAX_SESSIONS = 200
MAX_FAILS = 5                      # per IP ...
FAIL_WINDOW = 15 * 60              # ... per 15 minutes

# ---------------------------------------------------------------- passwords
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return "scrypt$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(dk).decode()


def _verify_hash(password: str, stored: str) -> bool:
    try:
        scheme, salt_b64, dk_b64 = stored.split("$")
        if scheme != "scrypt":
            return False
        salt, expected = base64.b64decode(salt_b64), base64.b64decode(dk_b64)
        dk = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


_USER = os.environ.get("TRUSCAN_ADMIN_USER", "admin")
_HASH = os.environ.get("TRUSCAN_ADMIN_HASH")

if _HASH:
    ADMIN_USER = {"username": _USER}               # no plaintext password anywhere
else:
    print("[security] WARNING: TRUSCAN_ADMIN_HASH not set - using demo login admin/admin123")
    ADMIN_USER = {"username": _USER, "password": "admin123"}


def authenticate(username: str, password: str) -> bool:
    """Constant-time credential check. Use this in the login route."""
    user_ok = hmac.compare_digest(username.encode(), ADMIN_USER["username"].encode())
    if _HASH:
        pw_ok = _verify_hash(password, _HASH)
    else:
        pw_ok = hmac.compare_digest(password.encode(), ADMIN_USER["password"].encode())
    return user_ok and pw_ok


# ------------------------------------------------------------ rate limiting
_FAILS: dict[str, list[float]] = {}


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def is_locked_out(request: Request) -> bool:
    ip, now = client_ip(request), time.time()
    _FAILS[ip] = [t for t in _FAILS.get(ip, []) if now - t < FAIL_WINDOW]
    return len(_FAILS[ip]) >= MAX_FAILS


def record_failure(request: Request) -> None:
    _FAILS.setdefault(client_ip(request), []).append(time.time())


def clear_failures(request: Request) -> None:
    _FAILS.pop(client_ip(request), None)


# ----------------------------------------------------------------- sessions
# token -> (username, expires_at)
SESSIONS: dict[str, tuple[str, float]] = {}


def _purge() -> None:
    now = time.time()
    for tok in [t for t, (_, exp) in SESSIONS.items() if exp < now]:
        SESSIONS.pop(tok, None)


def create_session(username: str) -> str:
    _purge()
    if len(SESSIONS) >= MAX_SESSIONS:
        SESSIONS.pop(min(SESSIONS, key=lambda t: SESSIONS[t][1]), None)
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = (username, time.time() + SESSION_TTL)
    return token


def destroy_session(token: str) -> None:
    SESSIONS.pop(token, None)


def cookie_kwargs(request: Request) -> dict:
    """Pass to response.set_cookie(SESSION_COOKIE_NAME, token, **cookie_kwargs(request))."""
    return dict(
        httponly=True,
        samesite="strict",
        secure=request.url.scheme == "https",
        max_age=SESSION_TTL,
        path="/",
    )


def get_current_user(request: Request) -> str | None:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    entry = SESSIONS.get(token) if token else None
    if not entry:
        return None
    username, exp = entry
    if exp < time.time():
        SESSIONS.pop(token, None)
        return None
    return username


def require_page_auth(request: Request):
    """Use on page routes: redirects to /login are handled by the caller."""
    return get_current_user(request)


def require_api_auth(request: Request) -> str:
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user