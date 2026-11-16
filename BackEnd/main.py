# TruScan/BackEnd/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.analyze import router as analyze_router
from routes.report import router as report_router
from routes.model_info import router as model_router
from database.firebase import initialize_firebase
from service.machineLearning import load_model

initialize_firebase()
load_model()  # load the model once at startup

# Only the admin panel's browser needs CORS (the mobile app does not).
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://127.0.0.1:8000,http://localhost:8000").split(",")
    if o.strip()
]

app = FastAPI(
    title="TruScan API",
    description="AI-powered scam detection API for Filipino users",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/analyze", tags=["Analysis"])
app.include_router(report_router,  prefix="/report",  tags=["Reports"])
app.include_router(model_router,   prefix="/model",   tags=["Model"])

@app.get("/")
def root():
    return { "status": "online", "app": "TruScan API", "version": "1.0.0" }

@app.get("/health")
def health():
    return { "status": "ok" }
