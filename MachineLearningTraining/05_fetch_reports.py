import os
import json
from datetime import datetime


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

REPORT_PATH = os.path.join(
    MODEL_DIR,
    "evaluation_report.json"
)

OUTPUT_PATH = os.path.join(
    MODEL_DIR,
    "training_report.txt"
)


# ============================================================
# LOAD REPORT
# ============================================================

print("=" * 60)
print("TRUSCAN TRAINING REPORT")
print("=" * 60)


if not os.path.exists(REPORT_PATH):

    print(
        "No evaluation report found."
    )

    print(
        "\nRun this first:"
    )

    print(
        "python 03_evaluate.py"
    )

    exit()


with open(
    REPORT_PATH,
    "r",
    encoding="utf-8"
) as file:

    report = json.load(file)


# ============================================================
# DISPLAY
# ============================================================

accuracy = report.get(
    "accuracy",
    0
)

precision = report.get(
    "precision",
    0
)

recall = report.get(
    "recall",
    0
)

f1 = report.get(
    "f1_score",
    0
)

samples = report.get(
    "test_samples",
    0
)

classes = report.get(
    "classes",
    []
)


print(
    f"\nAccuracy : {accuracy:.2%}"
)

print(
    f"Precision: {precision:.2%}"
)

print(
    f"Recall   : {recall:.2%}"
)

print(
    f"F1 Score : {f1:.2%}"
)

print(
    f"Test samples: {samples}"
)

print(
    f"Classes: {', '.join(classes)}"
)


# ============================================================
# TEXT REPORT
# ============================================================

report_text = f"""
TRUSCAN MACHINE LEARNING REPORT
================================

Generated:
{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

Model:
Support Vector Machine (SVM)

Class Weight:
balanced

Vectorizer:
TF-IDF

Accuracy:
{accuracy:.2%}

Precision:
{precision:.2%}

Recall:
{recall:.2%}

F1 Score:
{f1:.2%}

Test Samples:
{samples}

Classes:
{', '.join(classes)}
"""


with open(
    OUTPUT_PATH,
    "w",
    encoding="utf-8"
) as file:

    file.write(
        report_text
    )


print(
    f"\nText report saved to:\n{OUTPUT_PATH}"
)

print("\nDone!")
