import os
import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "processed_dataset.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "..",
    "BackEnd",
    "model"
)

os.makedirs(MODEL_DIR, exist_ok=True)

CLASSIFIER_PATH = os.path.join(
    MODEL_DIR,
    "scamClassifier.pkl"
)

VECTORIZER_PATH = os.path.join(
    MODEL_DIR,
    "vectorizer.pkl"
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("TRUSCAN MODEL TRAINING")
print("=" * 60)

if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        "Processed dataset not found.\n"
        "Run 01_preprocess.py first."
    )

df = pd.read_csv(DATA_PATH)

print(f"Dataset size: {len(df)}")


# ============================================================
# VALIDATE DATA
# ============================================================

required_columns = ["text", "label"]

for column in required_columns:
    if column not in df.columns:
        raise ValueError(
            f"Missing column: {column}"
        )

df = df.dropna(subset=["text", "label"])


print("\nClass distribution:")
print(df["label"].value_counts())


# ============================================================
# FEATURES AND LABELS
# ============================================================

X = df["text"].astype(str)
y = df["label"].astype(str)


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.30,
    random_state=42,
    stratify=y
)


print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ============================================================
# TF-IDF
# ============================================================

print("\nCreating TF-IDF vectorizer...")

vectorizer = TfidfVectorizer(
    lowercase=True,
    max_features=20000,
    ngram_range=(1, 2),
    min_df=1,
    sublinear_tf=True
)

X_train_tfidf = vectorizer.fit_transform(X_train)

X_test_tfidf = vectorizer.transform(X_test)

print(
    "TF-IDF shape:",
    X_train_tfidf.shape
)


# ============================================================
# SVM MODEL
# ============================================================

print("\nTraining SVM...")

model = SVC(
    kernel="linear",
    class_weight="balanced",
    probability=True,
    random_state=42
)

model.fit(
    X_train_tfidf,
    y_train
)


# ============================================================
# QUICK EVALUATION
# ============================================================

predictions = model.predict(X_test_tfidf)

accuracy = accuracy_score(
    y_test,
    predictions
)

print(
    f"\nValidation accuracy: {accuracy:.4f}"
)


# ============================================================
# SAVE MODEL
# ============================================================

print("\nSaving files...")

joblib.dump(
    model,
    CLASSIFIER_PATH
)

joblib.dump(
    vectorizer,
    VECTORIZER_PATH
)


# ============================================================
# VERIFY
# ============================================================

classifier_size = os.path.getsize(
    CLASSIFIER_PATH
)

vectorizer_size = os.path.getsize(
    VECTORIZER_PATH
)

print("\nFiles created:")

print(
    f"scamClassifier.pkl: "
    f"{classifier_size:,} bytes"
)

print(
    f"vectorizer.pkl: "
    f"{vectorizer_size:,} bytes"
)


if classifier_size == 0:
    raise RuntimeError(
        "scamClassifier.pkl is empty!"
    )

if vectorizer_size == 0:
    raise RuntimeError(
        "vectorizer.pkl is empty!"
    )


print("\nTraining completed successfully!")
