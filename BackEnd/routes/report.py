# TruScan/BackEnd/routes/report.py
# POST /report: the ONLY way the mobile app saves a scam report.
# The backend validates the input, runs the model itself, and writes to
# Firestore with the Admin SDK. The app has no direct database access.
import threading
import time
from collections import defaultdict, deque

from fastapi import APIRouter, HTTPException, Request
from google.cloud import firestore

from database.firebase import get_db
from models.schema import ReportRequest, ReportResponse
from routes.analyze import get_tier
from service.machineLearning import predict

router = APIRouter()

SCAM_CATEGORY_LABELS = {
    "financial": "Financial & eWallet",
    "government": "Government Impersonation",
    "delivery": "Delivery Courier",
    "job": "Job Task",
    "lottery": "Lottery Prize",
    "shopping": "Online Shopping",
    "investment": "Investment",
    "phishing": "Phishing Link",
    "smishing": "Smishing SMS",
    "romance": "Romance",
    "impersonation": "Personal Impersonation",
    "loan": "Online Loan",
    "travel": "Travel Accommodation",
    "simswap": "SIM Swap",
    "charity": "Charity Donations",
}

# Simple per-IP rate limit (in memory; resets when the server restarts).
RATE_LIMIT = 10     # reports allowed ...
RATE_WINDOW = 600   # ... per 10 minutes, per IP
_hits = defaultdict(deque)
_lock = threading.Lock()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")  # set by Render's proxy
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _allow(ip: str) -> bool:
    now = time.time()
    with _lock:
        hits = _hits[ip]
        while hits and now - hits[0] > RATE_WINDOW:
            hits.popleft()
        if len(hits) >= RATE_LIMIT:
            return False
        hits.append(now)
        return True


@router.post("/", response_model=ReportResponse)
def report(request: Request, body: ReportRequest):
    if not _allow(_client_ip(request)):
        raise HTTPException(status_code=429, detail="Too many reports. Please try again later.")

    text = body.text.strip()
    if len(text) < 5:
        raise HTTPException(status_code=400, detail="Text too short to report.")

    # The model result is computed here, never trusted from the phone.
    result = predict(text)
    if result is None:
        raise HTTPException(status_code=503, detail="ML model not available.")

    prediction, risk_level = get_tier(result["scam_probability"])
    indicators = result.get("indicators", {})

    doc = {
        "text": text,
        "category": prediction,
        "channel": body.channel,
        "mode": body.mode,
        "source": body.source,
        "mlPrediction": {
            "riskLevel": risk_level.lower(),
            "confidence": result["confidence"],
            "reasons": indicators.get("top_features") or indicators.get("keywords") or [],
        },
        "status": "pending",
        "usedInTraining": False,
        "reportedBy": "anonymous",
        "timestamp": firestore.SERVER_TIMESTAMP,
    }
    if body.type:
        doc["reportType"] = body.type
    if body.scamCategory:
        doc["scamCategory"] = body.scamCategory
        doc["scamCategoryLabel"] = SCAM_CATEGORY_LABELS[body.scamCategory]
    if body.remark.strip():
        doc["remark"] = body.remark.strip()

    try:
        ref = get_db().collection("reported_scams").add(doc)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not save the report.")

    return ReportResponse(
        success=True,
        id=ref[1].id,
        message="Salamat! Nai-log na ang report sa community database.",
    )