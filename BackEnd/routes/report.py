# TruScan/BackEnd/routes/report.py
# POST /report — saves a scam report to Firestore

from fastapi import APIRouter, HTTPException
from models.schema import ReportRequest, ReportResponse
from database.firebase import get_db
from google.cloud import firestore

router = APIRouter()

@router.post("/", response_model=ReportResponse)
async def report(request: ReportRequest):
    try:
        db = get_db()

        doc = {
            "text":           request.text.strip(),
            "category":       request.category,
            "source":         request.source or "mobile_app",
            "ml_prediction":  request.ml_prediction,
            "status":         "pending",
            "used_in_training": False,
            "reported_by":    "anonymous",
            "timestamp":      firestore.SERVER_TIMESTAMP,
        }

        ref = db.collection("reported_scams").add(doc)
        return ReportResponse(
            success = True,
            id      = ref[1].id,
            message = "Salamat! Nai-log na ang report sa community database."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats():
    try:
        db = get_db()
        docs = db.collection("reported_scams").stream()

        stats = { "total": 0, "scam": 0, "suspicious": 0, "safe": 0, "pending": 0, "verified": 0 }
        for doc in docs:
            d = doc.to_dict()
            stats["total"] += 1
            cat = d.get("category")
            status = d.get("status")
            if cat in stats:    stats[cat]    += 1
            if status in stats: stats[status] += 1

        return stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))