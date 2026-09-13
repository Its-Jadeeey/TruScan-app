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
# TEXT CLEANER (UPDATED WITH MARKDOWN + URL MATCHING)
# ============================================================

def clean_text(text):
    text = str(text).lower()
    
    # 1. Clean Markdown syntax like [text](url)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r' \1 \2 ', text)
    
    # 2. Catch bracketed URLs, http/https schemes, and www links
    text = re.sub(r'\[?https?://[^\s\]]+\]?', ' url ', text)
    text = re.sub(r'www\.[^\s\]]+', ' url ', text)
    
    # 3. Phone numbers
    text = re.sub(r'\+?\d[\d\s\-]{7,}', ' phone ', text)
    
    # 4. Numbers
    text = re.sub(r'\d+', ' num ', text)
    
    # 5. Remove special characters
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Extra whitespace cleanup
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Tokenize, remove stopwords, stem (Exact match to BackEnd/service/machineLearning.py)
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
    columns_lower = {
        str(column).lower().strip(): column
        for column in df.columns
    }

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
        df,
        ["text", "message", "sms", "content", "message_text", "body", "description"]
    )

    label_column = find_column(
        df,
        ["label", "class", "category", "type", "target", "is_scam"]
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
        data = load_dataset(dataset)
        all_data.append(data)
    except Exception as error:
        print(f"ERROR loading {dataset}: {error}")

if not all_data:
    raise RuntimeError("No datasets could be loaded.")

# combine datasets
df = pd.concat(all_data, ignore_index=True)
print("\nCombined rows:", len(df))

# remove missing values
df = df.dropna(subset=["text", "label"])

# clean text
print("Cleaning text...")
df["text"] = df["text"].apply(clean_text)

# remove empty messages
df = df[df["text"].str.len() > 0]

# normalize labels
df["label"] = df["label"].astype(str).str.strip().str.lower()

# remove duplicate messages
df = df.drop_duplicates(subset=["text"])

# save
df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8")

print("\nFinal dataset:")
print(df["label"].value_counts())
print(f"\nSaved processed dataset: {OUTPUT_PATH}")
print("\nPreprocessing complete!")