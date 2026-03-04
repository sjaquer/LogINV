// src/lib/firebase.js
// ⚙️  CONFIGURACIÓN: Reemplaza estos valores con los de tu proyecto Firebase
// Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-6382721178-dadde",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:784395220448:web:0dd9236f6d8ee0f6f12785",
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDOjlI7KdfkID0ieV943dMulcL5-a4_hfo",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-6382721178-dadde.firebaseapp.com",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "784395220448"
};

// Evitar re-inicialización en hot-reload de Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
export default app;
