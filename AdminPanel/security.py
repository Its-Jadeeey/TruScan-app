"""
Minimal cookie-based session handling for the demo admin panel.

Not meant for production use as-is (swap the in-memory `SESSIONS` dict for
Redis/DB-backed sessions, and hash passwords) but keeps auth dependency-free
and easy to follow.
"""
import secrets
from fastapi import Request, HTTPException, status

SESSION_COOKIE_NAME = "truscan_session"

# Hardcoded demo admin account. Replace with a real user store (or Firebase
# Auth) before this goes anywhere real — plain-text password comparison is
# only OK for a local demo.
ADMIN_USER = {"username": "admin", "password": "admin123"}

# token -> username
SESSIONS: dict[str, str] = {}


def create_session(username: str) -> str:
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = username
    return token


def destroy_session(token: str) -> None:
    SESSIONS.pop(token, None)


def get_current_user(request: Request) -> str | None:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    return SESSIONS.get(token)


def require_page_auth(request: Request):
    """Use on page routes: redirects to /login are handled by the caller."""
    return get_current_user(request)


def require_api_auth(request: Request) -> str:
    """Use as a FastAPI dependency on JSON API routes."""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user