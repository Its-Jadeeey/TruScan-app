from fastapi import APIRouter, Request, Response, status
from fastapi.responses import JSONResponse

from models.schemas import LoginRequest, LoginResponse, SessionRequest, MeResponse
from security import (
    ADMIN_USER,
    create_session,
    destroy_session,
    get_current_user,
    SESSION_COOKIE_NAME,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(resp: JSONResponse, username: str) -> JSONResponse:
    token = create_session(username)
    resp.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 8,  # 8 hours
    )
    return resp


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, response: Response):
    """Checks the single hardcoded demo admin only. Additional admins created
    in the Firestore `admins` collection are verified client-side and go
    through POST /api/auth/session instead (see login.js)."""
    if payload.username == ADMIN_USER["username"] and payload.password == ADMIN_USER["password"]:
        resp = JSONResponse(content={"success": True, "message": "Login successful"})
        return _set_session_cookie(resp, payload.username)

    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"success": False, "message": "Invalid username or password"},
    )


@router.post("/session", response_model=LoginResponse)
def create_firestore_session(payload: SessionRequest):
    """Establishes a page-access session for an admin who was already
    verified against Firestore's `admins` collection in the browser.

    NOTE: this endpoint trusts the caller and does not re-check a password —
    that check already happened client-side against Firestore. That's a
    deliberate (documented) trade-off for now; the real fix is moving login
    to Firebase Authentication instead of raw Firestore documents.
    """
    if not payload.username:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "message": "Missing username"},
        )
    resp = JSONResponse(content={"success": True, "message": "Login successful"})
    return _set_session_cookie(resp, payload.username)


@router.get("/me", response_model=MeResponse)
def me(request: Request):
    user = get_current_user(request)
    if not user:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Not authenticated"},
        )
    return {"username": user}


@router.post("/logout")
def logout(response: Response):
    resp = JSONResponse(content={"success": True})
    resp.delete_cookie(SESSION_COOKIE_NAME)
    return resp