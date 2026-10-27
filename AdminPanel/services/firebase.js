import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';


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