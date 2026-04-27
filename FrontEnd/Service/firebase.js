// TruScan/FrontEnd/Service/firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyDT6A56DW7Ccqr6LbORH2ivRsmIloJnoIs",
  authDomain: "truscan-148e4.firebaseapp.com",
  projectId: "truscan-148e4",
  storageBucket: "truscan-148e4.firebasestorage.app",
  messagingSenderId: "1064305616846",
  appId: "1:1064305616846:web:98462fd3b683a981752d9f"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
