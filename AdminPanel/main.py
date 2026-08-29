"""
TruScan Admin Panel — FastAPI backend.

Run with:
    uvicorn main:app --reload
Then open http://127.0.0.1:8000/
"""
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from routes import auth
from security import require_page_auth

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="TruScan Admin API")

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

app.include_router(auth.router)


# ---------------------------------------------------------------------------
# Page routes (server-rendered shells; data is loaded client-side straight
# from Firestore — see static/js/firebase-config.js and static/js/*.js)
# ---------------------------------------------------------------------------
@app.get("/")
def hero(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/login")
def login_page(request: Request):
    if require_page_auth(request):
        return RedirectResponse(url="/dashboard")
    return templates.TemplateResponse(request, "login.html")


@app.get("/dashboard")
def dashboard_page(request: Request):
    if not require_page_auth(request):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(request, "dashboard.html", {"active": "dashboard"})


@app.get("/reports")
def reports_page(request: Request):
    if not require_page_auth(request):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(request, "reports.html", {"active": "reports"})


@app.get("/settings")
def settings_page(request: Request):
    if not require_page_auth(request):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse(request, "settings.html", {"active": "settings"})