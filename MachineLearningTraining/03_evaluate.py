import os
import json
import joblib
import pandas as pd

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)

# ============================================================
# PATHS
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_SPLIT_PATH = os.path.join(BASE_DIR, "data", "test_split.csv")   # written by 02_train_model.py
MODEL_DIR = os.path.join(BASE_DIR, "..", "BackEnd", "model")
MODEL_PATH = os.path.join(MODEL_DIR, "scamClassifier.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")
REPORT_PATH = os.path.join(MODEL_DIR, "evaluation_report.json")

# ============================================================
# LOAD
# ============================================================
print("=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

if not os.path.exists(TEST_SPLIT_PATH):
    raise FileNotFoundError("test_split.csv not found.\nRun 02_train_model.py first.")

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

# Same held-out rows that 02_train_model.py set aside (no second split here)
test_df = pd.read_csv(TEST_SPLIT_PATH)
X_test = test_df["text"].astype(str)
y_test = test_df["label"].astype(str)

# ============================================================
# PREDICT
# ============================================================
X_test_tfidf = vectorizer.transform(X_test)
predictions = model.predict(X_test_tfidf)

# ============================================================
# METRICS
# ============================================================
accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, average="weighted", zero_division=0)
recall = recall_score(y_test, predictions, average="weighted", zero_division=0)
f1 = f1_score(y_test, predictions, average="weighted", zero_division=0)

print(f"\nAccuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, predictions, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, predictions))

# ============================================================
# SAVE REPORT
# ============================================================
report = {
    "accuracy": float(accuracy),
    "precision": float(precision),
    "recall": float(recall),
    "f1_score": float(f1),
    "test_samples": len(y_test),
    "classes": sorted(y_test.unique().tolist()),
}

with open(REPORT_PATH, "w", encoding="utf-8") as file:
    json.dump(report, file, indent=4)

print(f"\nReport saved to:\n{REPORT_PATH}")
print("\nEvaluation complete!")