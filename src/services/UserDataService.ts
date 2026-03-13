import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseAuth, firebaseEnabled } from '../lib/firebase';
import type { StandingItem } from '../context/SettingsContext';

// Firebase Auth assigns its own UID (different from Google's sub/userInfo.sub).
// Firestore security rules use request.auth.uid, so we must use the Firebase UID
// as the document key — not the Google sub passed as userId.
function getFirebaseUid(): string | null {
    return firebaseAuth?.currentUser?.uid ?? null;
}

interface Settings {
    defaultActivityLength: number;
    defaultBreakLength: number;
    standingItems: StandingItem[];
}

export async function loadUserSettings(userId: string): Promise<Settings | null> {
    if (!firebaseEnabled || !db) return null;
    const uid = getFirebaseUid();
    if (!uid) return null;

    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return null;

        const data = snap.data();
        return {
            defaultActivityLength: data.defaultActivityLength ?? 30,
            defaultBreakLength: data.defaultBreakLength ?? 5,
            standingItems: data.standingItems ?? [],
        };
    } catch (err) {
        console.warn('Firestore load failed, using local cache:', err);
        return null;
    }
}

export async function saveUserSettings(userId: string, settings: Settings): Promise<void> {
    if (!firebaseEnabled || !db) return;
    const uid = getFirebaseUid();
    if (!uid) return;

    try {
        // Firestore rejects undefined values — strip optional fields that aren't set
        const sanitizedItems = settings.standingItems.map(item => {
            const { startTime, ...rest } = item;
            return startTime !== undefined ? { ...rest, startTime } : rest;
        });
        await setDoc(doc(db, 'users', uid), {
            ...settings,
            standingItems: sanitizedItems,
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn('Firestore save failed:', err);
    }
}
