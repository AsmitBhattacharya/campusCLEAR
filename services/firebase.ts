
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwAlfCXSSCzP2B1p8HMx36U_lmhxpPR4E",
  authDomain: "campusclear-483408.firebaseapp.com",
  projectId: "campusclear-483408",
  storageBucket: "campusclear-483408.firebasestorage.app",
  messagingSenderId: "398823260400",
  appId: "1:398823260400:web:22ff6146ed4409a2680235"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
