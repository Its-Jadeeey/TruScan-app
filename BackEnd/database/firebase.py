# TruScan/BackEnd/database/firebase.py
# Firebase Admin SDK — connects FastAPI backend to Firestore

import firebase_admin
from firebase_admin import credentials, firestore
import os

# ─── INITIALIZE ───────────────────────────────────────────────────────────────

def initialize_firebase():
    """
    Initialize Firebase Admin SDK.
    Called once on app startup in main.py
    """
    if not firebase_admin._apps:
        # Path to your service account key
        key_path = os.path.join(os.path.dirname(__file__), '..', 'serviceAccountKey.json')

        if os.path.exists(key_path):
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
        else:
            print("⚠️  serviceAccountKey.json not found — Firebase not initialized")
            print("    Download it from Firebase Console → Project Settings → Service Accounts")

# ─── GET DATABASE ─────────────────────────────────────────────────────────────

def get_db():
    """
    Returns Firestore client.
    Import and call this in routes to read/write data.
    
    Usage:
        from database.firebase import get_db
        db = get_db()
        db.collection('reported_scams').add({...})
    """
    return firestore.client()