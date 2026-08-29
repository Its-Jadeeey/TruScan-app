// Firebase initialization for the browser (ES module).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDT6A56DW7Ccqr6LbORH2ivRsmIloJnoIs",
  authDomain: "truscan-148e4.firebaseapp.com",
  projectId: "truscan-148e4",
  storageBucket: "truscan-148e4.firebasestorage.app",
  messagingSenderId: "1064305616846",
  appId: "1:1064305616846:web:98462fd3b683a981752d9f",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);