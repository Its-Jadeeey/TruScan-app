import os
import shutil
import joblib


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "..",
    "BackEnd",
    "model"
)

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


CLASSIFIER = os.path.join(
    MODEL_DIR,
    "scamClassifier.pkl"
)

VECTORIZER = os.path.join(
    MODEL_DIR,
    "vectorizer.pkl"
)


# ============================================================
# VERIFY
# ============================================================

print("=" * 60)
print("MODEL EXPORT / VERIFICATION")
print("=" * 60)


files = [
    CLASSIFIER,
    VECTORIZER
]


for file_path in files:

    filename = os.path.basename(file_path)

    if not os.path.exists(file_path):

        print(
            f"ERROR: {filename} does not exist."
        )

        continue

    size = os.path.getsize(
        file_path
    )

    print(
        f"{filename}: {size:,} bytes"
    )

    if size == 0:

        print(
            f"WARNING: {filename} is EMPTY!"
        )

    else:

        print(
            f"OK: {filename} contains data."
        )


# ============================================================
# TEST LOADING
# ============================================================

if os.path.exists(CLASSIFIER):

    try:

        model = joblib.load(
            CLASSIFIER
        )

        print(
            "\nSVM model loaded successfully."
        )

    except Exception as error:

        print(
            f"\nCould not load SVM: {error}"
        )


if os.path.exists(VECTORIZER):

    try:

        vectorizer = joblib.load(
            VECTORIZER
        )

        print(
            "TF-IDF vectorizer loaded successfully."
        )

    except Exception as error:

        print(
            f"Could not load vectorizer: {error}"
        )


print("\nExport verification complete!")
