// src/lib/firebase.js — app de Firebase + Firestore (cliente).
// Se importa de forma diferida desde hooks/useFirestoreQuery.js.
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

export { firebaseConfig };

// Evitar re-inicialización en hot-reload de Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
export default app;
