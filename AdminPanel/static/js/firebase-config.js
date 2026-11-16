// Firebase initialization for the browser (ES module).
// Mirrors services/firebase.js, but imports from the Firebase CDN instead of
// the npm 'firebase' package, since these pages are plain static files with
// no bundler in front of them.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// These values are public by design (they identify the project, they are not secrets).
// What actually protects the data is the Firestore rules + the admin sign-in.
const firebaseConfig = {
  apiKey: "AIzaSyBByUnFiVg7or2e98uA5BIg_TpBPWEN5nk",
  authDomain: "truscanv2.firebaseapp.com",
  projectId: "truscanv2",
  storageBucket: "truscanv2.firebasestorage.app",
  messagingSenderId: "148816061446",
  appId: "1:148816061446:web:9ed6cb169b10802b034f87",
  measurementId: "G-JB609SZB7H"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);