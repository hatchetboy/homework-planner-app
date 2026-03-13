import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseEnabled } from '../lib/firebase';
import type { StandingItem } from '../context/SettingsContext';

interface Settings {
    defaultActivityLength: number;
    defaultBreakLength: number;
    standingItems: StandingItem[];
}

export async function loadUserSettings(userId: string): Promise<Settings | null> {
    if (!firebaseEnabled || !db) return null;

    try {
        const snap = await getDoc(doc(db, 'users', userId));
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

    try {
        await setDoc(doc(db, 'users', userId), {
            ...settings,
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn('Firestore save failed:', err);
    }
}
