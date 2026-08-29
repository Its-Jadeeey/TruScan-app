from fastapi import APIRouter, Response, status
from fastapi.responses import JSONResponse

from models.schemas import LoginRequest, LoginResponse
from security import ADMIN_USER, create_session, destroy_session, SESSION_COOKIE_NAME

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, response: Response):
    if payload.username == ADMIN_USER["username"] and payload.password == ADMIN_USER["password"]:
        token = create_session(payload.username)
        resp = JSONResponse(content={"success": True, "message": "Login successful"})
        resp.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=token,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 8,  # 8 hours
        )
        return resp

    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"success": False, "message": "Invalid username or password"},
    )


@router.post("/logout")
def logout(response: Response):
    resp = JSONResponse(content={"success": True})
    resp.delete_cookie(SESSION_COOKIE_NAME)
    return resp