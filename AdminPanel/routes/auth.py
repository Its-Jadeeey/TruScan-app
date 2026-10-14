import os

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from models.schemas import LoginRequest, LoginResponse, SessionRequest, MeResponse
from security import (
    SESSION_COOKIE_NAME,
    authenticate,
    clear_failures,
    cookie_kwargs,
    create_session,
    destroy_session,
    get_current_user,
    is_locked_out,
    record_failure,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# /session used to create a login for ANY username without checking a password
# (anyone could POST {"username": "x"} and get in). It is now off by default.
# Only set this to 1 for a short local demo of Firestore-created admins.
ALLOW_UNVERIFIED_SESSION = os.environ.get("TRUSCAN_ALLOW_FIRESTORE_ADMINS") == "1"


def _with_session(request: Request, username: str) -> JSONResponse:
    resp = JSONResponse(content={"success": True, "message": "Login successful"})
    resp.set_cookie(SESSION_COOKIE_NAME, create_session(username), **cookie_kwargs(request))
    return resp


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request):
    if is_locked_out(request):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"success": False, "message": "Too many failed attempts. Try again in 15 minutes."},
        )
    if authenticate(payload.username, payload.password):
        clear_failures(request)
        return _with_session(request, payload.username)

    record_failure(request)
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"success": False, "message": "Invalid username or password"},
    )


@router.post("/session", response_model=LoginResponse)
def create_firestore_session(payload: SessionRequest, request: Request):
    if not ALLOW_UNVERIFIED_SESSION:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "message": "Invalid username or password"},
        )
    if not payload.username:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "message": "Missing username"},
        )
    return _with_session(request, payload.username)


@router.get("/me", response_model=MeResponse)
def me(request: Request):
    user = get_current_user(request)
    if not user:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "Not authenticated"})
    return {"username": user}


@router.post("/logout")
def logout(request: Request):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        destroy_session(token)  # the old version only deleted the browser cookie
    resp = JSONResponse(content={"success": True})
    resp.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return resp