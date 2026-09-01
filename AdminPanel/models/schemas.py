"""Pydantic request/response models for the TruScan admin API.

Only auth is left here — dashboard/report/settings data now lives in
Firestore and is read directly from the browser (see static/js/*.js).
"""
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str


class SessionRequest(BaseModel):
    """Used to establish a FastAPI session for an admin who was already
    verified against the Firestore `admins` collection in the browser."""
    username: str


class MeResponse(BaseModel):
    username: str