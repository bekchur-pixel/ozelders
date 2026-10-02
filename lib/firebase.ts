import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-key-for-build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "0",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:0:web:dummy",
};

function app() {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

export const firebaseApp = app();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export const isFirebaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
