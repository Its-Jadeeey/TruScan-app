import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyBe9A6isnUsoVJZVpFxaEQpc9Eccz2oeI0",
  authDomain: "truscanv1.firebaseapp.com",
  projectId: "truscanv1",
  storageBucket: "truscanv1.firebasestorage.app",
  messagingSenderId: "544639973606",
  appId: "1:544639973606:web:8dc7bc38fe4bac921c2327"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);