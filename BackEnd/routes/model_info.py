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
DATASET_INFO_PATH = os.path.join(MODEL_DIR, "dataset_info.json")  # written by 02_train_model.py
TEST_FRACTION = 0.30  # same as test_size in 02_train_model.py


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

    # Dataset size: exact if 02_train_model.py wrote dataset_info.json,
    # otherwise estimated from the number of test samples (test = 30%).
    dataset = {}
    if os.path.exists(DATASET_INFO_PATH):
        try:
            with open(DATASET_INFO_PATH, "r", encoding="utf-8") as f:
                info = json.load(f)
            dataset = {
                "size": info.get("dataset_size"),
                "train": info.get("train_samples"),
                "test": info.get("test_samples"),
                "class_counts": info.get("class_counts", {}),
                "estimated": False,
            }
        except (OSError, ValueError):
            dataset = {}
    if not dataset and isinstance(metrics.get("test_samples"), int):
        test_n = metrics["test_samples"]
        dataset = {
            "size": round(test_n / TEST_FRACTION),
            "train": None,
            "test": test_n,
            "class_counts": {},
            "estimated": True,
        }

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
        "dataset": dataset,
        "thresholds": thresholds,
    }