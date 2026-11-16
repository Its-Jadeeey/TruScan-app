# TruScan/BackEnd/database/firebase.py
# Firebase Admin SDK — connects FastAPI backend to Firestore
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore


def initialize_firebase():
    """
    Initialize Firebase Admin SDK.
    Called once on app startup in main.py

    Credentials are looked up in this order:
      1. FIREBASE_CREDENTIALS_JSON  (the whole key file's contents, used on Render)
      2. FIREBASE_KEY_PATH          (path to a key file)
      3. BackEnd/serviceAccountKey.json  (local development)
    """
    if firebase_admin._apps:
        return

    cred = None
    raw_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    key_path = os.environ.get("FIREBASE_KEY_PATH") or os.path.join(
        os.path.dirname(__file__), '..', 'serviceAccountKey.json'
    )

    if raw_json:
        cred = credentials.Certificate(json.loads(raw_json))
    elif os.path.exists(key_path):
        cred = credentials.Certificate(key_path)

    if cred:
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized successfully")
    else:
        print("⚠️  Firebase credentials not found — Firebase not initialized")
        print("    Put the key at BackEnd/serviceAccountKey.json or set FIREBASE_CREDENTIALS_JSON")


def get_db():
    """
    Returns Firestore client.
    Usage:
        from database.firebase import get_db
        db = get_db()
        db.collection('reported_scams').add({...})
    """
    return firestore.client()