import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Firebase is optional — only initialise if all config vars are present.
// Without them the app falls back to localStorage-only mode.
export const firebaseEnabled = !!(apiKey && authDomain && projectId);

let db: ReturnType<typeof getFirestore> | null = null;
let firebaseAuth: ReturnType<typeof getAuth> | null = null;

if (firebaseEnabled) {
    const app = getApps().length === 0
        ? initializeApp({ apiKey, authDomain, projectId })
        : getApps()[0];
    db = getFirestore(app);
    firebaseAuth = getAuth(app);
}

export { db, firebaseAuth };
