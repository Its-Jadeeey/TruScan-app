# TruScan/BackEnd/routes/model_info.py
# GET /model/info: model metadata + evaluation metrics for the admin dashboard.

import json
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "model")
MODEL_PATH = os.path.join(MODEL_DIR, "scamClassifier.pkl")
REPORT_PATH = os.path.join(MODEL_DIR, "evaluation_report.json")


@router.get("/info")
async def model_info():
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=503, detail="Model not trained yet.")

    metrics = {}
    if os.path.exists(REPORT_PATH):
        try:
            with open(REPORT_PATH, "r", encoding="utf-8") as f:
                metrics = json.load(f)
        except (OSError, ValueError):
            metrics = {}

    trained_at = datetime.fromtimestamp(
        os.path.getmtime(MODEL_PATH), tz=timezone.utc
    ).isoformat()

    try:
        import sklearn
        sklearn_version = sklearn.__version__
    except Exception:
        sklearn_version = None

    # Risk-tier cut-offs (defined in service/machineLearning.py)
    try:
        from service import machineLearning as ml
        thresholds = {
            "high": getattr(ml, "HIGH_RISK_THRESHOLD", None),
            "low": getattr(ml, "LOW_RISK_THRESHOLD", None),
        }
    except Exception:
        thresholds = {}

    return {
        "model": "Linear SVM + TF-IDF",
        "trained_at": trained_at,
        "sklearn_version": sklearn_version,
        "metrics": metrics,
        "thresholds": thresholds,
    }
