# TruScan/BackEnd/service/machineLearning.py
# Pure NLP+ML prediction using trained Scikit-learn model

import pickle
import os
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

nltk.download('stopwords', quiet=True)

# ── Paths ────────────────────────────────────────────────────
MODEL_PATH      = os.path.join(os.path.dirname(__file__), '..', 'model', 'scamClassifier.pkl')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'vectorizer.pkl')
LABEL_PATH      = os.path.join(os.path.dirname(__file__), '..', 'model', 'labelEncoder.pkl')

# ── Preprocessing ────────────────────────────────────────────
stemmer   = PorterStemmer()
stop_words = set(stopwords.words('english'))

def preprocess(text: str) -> str:
    # Lowercase
    text = text.lower()
    # Remove URLs
    text = re.sub(r'http\S+|www\S+', ' url ', text)
    # Remove phone numbers
    text = re.sub(r'\+?\d[\d\s\-]{7,}', ' phone ', text)
    # Remove numbers
    text = re.sub(r'\d+', ' num ', text)
    # Remove special characters
    text = re.sub(r'[^\w\s]', ' ', text)
    # Remove extra whitespace
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
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(VECTORIZER_PATH, 'rb') as f:
            vectorizer = pickle.load(f)
        # Label encoder is optional
        label_encoder = None
        if os.path.exists(LABEL_PATH):
            with open(LABEL_PATH, 'rb') as f:
                label_encoder = pickle.load(f)
        return model, vectorizer, label_encoder
    except FileNotFoundError:
        return None, None, None

# ── Predict ──────────────────────────────────────────────────
def predict(text: str) -> dict | None:
    """
    Returns prediction dict or None if model not trained yet.

    Returns:
        {
            prediction:  'scam' | 'safe',
            confidence:  0-100,
            scam_type:   str,
            indicators:  dict
        }
    """
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
        prediction = "scam" if label == 1 else "safe"

    # Build indicators from top TF-IDF features
    indicators = extract_indicators(features, vectorizer, prediction)

    return {
        "prediction": prediction,
        "confidence": confidence,
        "scam_type":  "",
        "indicators": indicators,
    }

# ── Extract Indicators ───────────────────────────────────────
def extract_indicators(features, vectorizer, prediction: str) -> dict:
    """
    Extract top keywords from TF-IDF features
    that contributed to the prediction.
    """
    if prediction == "safe":
        return { "keywords": [], "top_features": [] }

    feature_names = vectorizer.get_feature_names_out()
    scores        = features.toarray()[0]
    top_indices   = scores.argsort()[::-1][:10]
    top_keywords  = [
        feature_names[i]
        for i in top_indices
        if scores[i] > 0
    ]

    return {
        "keywords":     top_keywords,
        "top_features": top_keywords[:5],
    }