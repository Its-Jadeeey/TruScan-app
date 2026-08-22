# TruScan/BackEnd/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router as analyze_router
from routes.report import router as report_router
from database.firebase import initialize_firebase

initialize_firebase()

app = FastAPI(
    title="TruScan API",
    description="AI-powered scam detection API for Filipino users",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/analyze", tags=["Analysis"])
app.include_router(report_router,  prefix="/report",  tags=["Reports"])

@app.get("/")
def root():
    return { "status": "online", "app": "TruScan API", "version": "1.0.0" }

@app.get("/health")
def health():
    return { "status": "ok" }