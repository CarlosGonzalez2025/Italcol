
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration for deployment
// In a real Vercel deployment, you should use environment variables:
// apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, etc.
export const firebaseConfig = {
  apiKey: "AIzaSyAPr7FIEiGXScUQPsjOow5ZC2D-3AHzc3I",
  authDomain: "italcol-4934d.firebaseapp.com",
  projectId: "italcol-4934d",
  storageBucket: "italcol-4934d.firebasestorage.app",
  messagingSenderId: "949407075604",
  appId: "1:949407075604:web:02bdb633c9bfa368098601"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
