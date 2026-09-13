import os
import re
import joblib
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

nltk.download('stopwords', quiet=True)

stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "model")

MODEL_PATH = os.path.join(MODEL_DIR, "scamClassifier.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")
LABEL_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")

# ============================================================
# EXACT PREPROCESSING MATCH WITH 01_preprocess.py
# ============================================================
def preprocess(text: str) -> str:
    text = str(text).lower()
    
    # Catch bracketed URLs, http/https, and www links
    text = re.sub(r'\[?https?://[^\s\]]+\]?', ' url ', text)
    text = re.sub(r'www\.[^\s\]]+', ' url ', text)
    
    # Phone numbers
    text = re.sub(r'\+?\d[\d\s\-]{7,}', ' phone ', text)
    
    # Numbers
    text = re.sub(r'\d+', ' num ', text)
    
    # Remove special characters
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Tokenize, remove stopwords, stem
    tokens = [
        stemmer.stem(w)
        for w in text.split()
        if w not in stop_words and len(w) > 1
    ]
    return ' '.join(tokens)

# ── Load Model ───────────────────────────────────────────────
def load_model():
    try:
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        label_encoder = None
        if os.path.exists(LABEL_PATH):
            label_encoder = joblib.load(LABEL_PATH)
        return model, vectorizer, label_encoder
    except Exception as e:
        print(f"Error loading model files: {e}")
        return None, None, None

# ── Predict ──────────────────────────────────────────────────
# ── Predict ──────────────────────────────────────────────────
def predict(text: str) -> dict | None:
    model, vectorizer, label_encoder = load_model()

    if model is None or vectorizer is None:
        return None

    # Preprocess
    cleaned  = preprocess(text)
    features = vectorizer.transform([cleaned])

    # Predict
    label      = model.predict(features)[0]
    proba      = model.predict_proba(features)[0]
    confidence = int(max(proba) * 100)

    # Decode label
    if label_encoder:
        prediction = label_encoder.inverse_transform([label])[0]
    else:
        prediction = str(label)

    # Build indicators from top TF-IDF features
    indicators = extract_indicators(features, vectorizer, prediction)

    return {
        "prediction": prediction,
        "confidence": confidence,
        "scam_type":  "safe" if prediction == "safe" else str(prediction).capitalize(),
        "indicators": indicators,
    }

# ── Explainability layer ──────────────────────────────────────
# NOTE: this is presentation-only. It does not participate in the model's
# decision in any way — it only looks at which TF-IDF terms the ALREADY-
# TRAINED model scored highest for this specific input, and maps those
# terms to a human-readable label. The classification itself is 100% the
# trained classifier's output (see predict() above).
_KEYWORD_LABELS = {
    "verify":         "Requests account verification",
    "otp":            "Requests a one-time PIN (OTP)",
    "password":       "Requests a password or login credentials",
    "click":          "Contains a call-to-action link",
    "url":            "Contains a link",
    "gcash":          "References a financial/eWallet account",
    "maya":           "References a financial/eWallet account",
    "bank":           "References a bank account",
    "suspend":        "Threatens account suspension",
    "urgent":         "Uses urgent or threatening language",
    "prize":          "Claims an unexpected prize or reward",
    "win":            "Claims an unexpected prize or reward",
    "won":            "Claims an unexpected prize or reward",
    "congratulations":"Claims an unexpected prize or reward",
    "limited":        "Creates a false sense of urgency",
    "expire":         "Creates a false sense of urgency",
    "confirm":        "Requests confirmation of personal details",
    "account":        "References your account",
    "phone":          "Contains a phone number",
    "delivery":       "References a parcel or delivery",
    "courier":        "References a parcel or delivery",
    "fee":            "Requests payment of a fee",
    "payment":        "Requests payment",
    "invest":         "Promotes an investment opportunity",
    "guarantee":      "Promises guaranteed returns",
    "job":            "References a job or income opportunity",
    "income":         "Promises easy income",
}

# Stem the lookup keys once, using the SAME stemmer the preprocessing
# pipeline uses, so they match whatever the vectorizer's vocabulary contains
# regardless of the exact stemming behavior for each word.
_STEMMED_LABELS = {stemmer.stem(k): v for k, v in _KEYWORD_LABELS.items()}

_GENERIC_FALLBACK = "Uses language patterns commonly seen in scam messages"
_SAFE_FALLBACK    = "No suspicious patterns detected"


def _label_for(term: str) -> str:
    return _STEMMED_LABELS.get(term, _GENERIC_FALLBACK)


def extract_indicators(features, vectorizer, prediction: str) -> dict:
    """
    Explain the prediction by surfacing the top TF-IDF terms this specific
    input scored highest on, mapped to friendly labels (see note above).
    """
    if prediction == "safe":
        return {"keywords": [], "top_features": [_SAFE_FALLBACK]}

    feature_names = vectorizer.get_feature_names_out()
    scores        = features.toarray()[0]
    top_indices   = scores.argsort()[::-1][:10]
    top_terms     = [feature_names[i] for i in top_indices if scores[i] > 0]

    friendly_labels = []
    for term in top_terms:
        label = _label_for(term)
        if label not in friendly_labels:
            friendly_labels.append(label)
        if len(friendly_labels) >= 5:
            break

    if not friendly_labels:
        friendly_labels = [_GENERIC_FALLBACK]

    return {
        "keywords":     top_terms,        # raw stemmed terms, kept for debugging/logging
        "top_features": friendly_labels,  # what the UI should actually display
    }