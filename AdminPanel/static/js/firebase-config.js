// Firebase initialization for the browser (ES module).
// Mirrors services/firebase.js, but imports from the Firebase CDN instead of
// the npm 'firebase' package, since these pages are plain static files with
// no bundler in front of them.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBe9A6isnUsoVJZVpFxaEQpc9Eccz2oeI0",
  authDomain: "truscanv1.firebaseapp.com",
  projectId: "truscanv1",
  storageBucket: "truscanv1.firebasestorage.app",
  messagingSenderId: "544639973606",
  appId: "1:544639973606:web:8dc7bc38fe4bac921c2327",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);