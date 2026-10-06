import os
import re
import pandas as pd
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

nltk.download('stopwords', quiet=True)

stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

# ============================================================
# PATHS
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

DATASETS = [
    os.path.join(DATA_DIR, "TruScanDATASET.csv")
]

OUTPUT_PATH = os.path.join(DATA_DIR, "processed_dataset.csv")


# ============================================================
# TEXT CLEANER  (must stay IDENTICAL to BackEnd/service/machineLearning.py)
# ============================================================
def clean_text(text):
    text = str(text).lower()

    # 1. Markdown links [text](url) -> keep both parts
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r' \1 \2 ', text)

    # 2. Links: keep the words INSIDE the link (domain/path) and only mark
    #    that a link exists. Replacing the whole link with "url" made every
    #    bare-URL row identical, so duplicate removal deleted them.
    text = re.sub(r'https?://|www\.', ' url ', text)

    # 3. Phone numbers
    text = re.sub(r'\+?\d[\d\s\-]{7,}', ' phone ', text)

    # 4. Numbers
    text = re.sub(r'\d+', ' num ', text)

    # 5. Remove special characters (this also splits URLs at . / - _ ? =)
    text = re.sub(r'[^\w\s]', ' ', text)

    text = re.sub(r'\s+', ' ', text).strip()

    tokens = [
        stemmer.stem(w)
        for w in text.split()
        if w not in stop_words and len(w) > 1
    ]
    return ' '.join(tokens)


# ============================================================
# FIND TEXT AND LABEL COLUMNS
# ============================================================
def find_column(df, possible_names):
    columns_lower = {str(c).lower().strip(): c for c in df.columns}
    for name in possible_names:
        if name.lower() in columns_lower:
            return columns_lower[name.lower()]
    return None


# ============================================================
# LOAD ONE DATASET
# ============================================================
def load_dataset(path):
    print(f"\nLoading: {os.path.basename(path)}")
    df = pd.read_csv(path)

    print("Columns:", list(df.columns))
    print("Rows:", len(df))

    text_column = find_column(
        df, ["text", "message", "sms", "content", "message_text", "body", "description"]
    )
    label_column = find_column(
        df, ["label", "class", "category", "type", "target", "is_scam"]
    )

    if text_column is None:
        raise ValueError(f"Could not find a text column in {path}.\nAvailable columns: {list(df.columns)}")
    if label_column is None:
        raise ValueError(f"Could not find a label column in {path}.\nAvailable columns: {list(df.columns)}")

    result = pd.DataFrame()
    result["text"] = df[text_column]
    result["label"] = df[label_column]
    return result


# ============================================================
# MAIN
# ============================================================
print("=" * 60)
print("TRUSCAN DATA PREPROCESSING")
print("=" * 60)

all_data = []

for dataset in DATASETS:
    if not os.path.exists(dataset):
        print(f"WARNING: File not found: {dataset}")
        continue
    try:
        all_data.append(load_dataset(dataset))
    except Exception as error:
        print(f"ERROR loading {dataset}: {error}")

if not all_data:
    raise RuntimeError("No datasets could be loaded.")

df = pd.concat(all_data, ignore_index=True)
print("\nCombined rows:", len(df))

df = df.dropna(subset=["text", "label"])
print("After removing missing values:", len(df))

print("Cleaning text...")
df["text"] = df["text"].apply(clean_text)

df = df[df["text"].str.len() > 0]
print("After removing empty messages:", len(df))

df["label"] = df["label"].astype(str).str.strip().str.lower()

# Duplicates are removed ON PURPOSE: if the same message is in both the
# training and test sets, the model is graded on text it already memorised.
before = len(df)
df = df.drop_duplicates(subset=["text"])
print(f"Duplicate messages removed: {before - len(df)}")

# If the same text carries two different labels, it is a labelling conflict.
conflicts = df.groupby("text")["label"].nunique()
print(f"Texts with conflicting labels: {(conflicts > 1).sum()}")

df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8")

print("\nFinal dataset:")
print(df["label"].value_counts())
print(f"\nSaved processed dataset: {OUTPUT_PATH}")
print("\nPreprocessing complete!")