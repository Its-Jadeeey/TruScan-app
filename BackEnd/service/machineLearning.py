# TruScan/BackEnd/service/machineLearning.py
# Loads the trained ML model and vectorizer to predict scam probability

import pickle
import os
import re

# ── Load Model ──────────────────────────────────────────────
MODEL_PATH      = os.path.join(os.path.dirname(__file__), '..', 'model', 'scamClassifier.pkl')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'vectorizer.pkl')

def load_model():
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(VECTORIZER_PATH, 'rb') as f:
            vectorizer = pickle.load(f)
        return model, vectorizer
    except FileNotFoundError:
        return None, None

# ── Preprocess Text ─────────────────────────────────────────
def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', ' url ', text)
    text = re.sub(r'\d+', ' num ', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# ── Predict ─────────────────────────────────────────────────
def predict(text: str) -> dict | None:
    """
    Returns prediction dict or None if model not yet trained.
    """
    model, vectorizer = load_model()

    if model is None or vectorizer is None:
        # Model not trained yet — return None so rule engine takes over
        return None

    cleaned   = preprocess(text)
    features  = vectorizer.transform([cleaned])
    label     = model.predict(features)[0]
    proba     = model.predict_proba(features)[0]
    confidence = int(max(proba) * 100)

    prediction_map = {
        1: "scam",
        0: "safe"
    }

    return {
        "prediction": prediction_map.get(label, "safe"),
        "confidence": confidence,
    }