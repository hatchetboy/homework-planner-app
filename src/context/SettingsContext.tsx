import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { loadUserSettings, saveUserSettings } from '../services/UserDataService';

export interface StandingItem {
    id: string;
    name: string;
    durationMinutes: number;
    startTime?: string; // Optional: "HH:mm"
}

interface Settings {
    defaultActivityLength: number; // in minutes (renamed from session)
    defaultBreakLength: number; // in minutes
    standingItems: StandingItem[];
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    addStandingItem: (item: Omit<StandingItem, 'id'>) => void;
    removeStandingItem: (id: string) => void;
    isLoadingSettings: boolean;
}

const defaultSettings: Settings = {
    defaultActivityLength: 30,
    defaultBreakLength: 5,
    standingItems: [],
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const storageKey = useMemo(() => user ? `homeworkPlannerSettings_${user.id}` : null, [user]);

    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);
    const isInitialLoad = useRef(true);
    const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial load when user changes: try Firestore first, fall back to localStorage
    useEffect(() => {
        isInitialLoad.current = true;

        if (!storageKey || !user) {
            setSettings(defaultSettings);
            return;
        }

        setIsLoadingSettings(true);

        loadUserSettings(user.id).then(cloudSettings => {
            if (cloudSettings) {
                // Firestore is the source of truth
                setSettings(cloudSettings);
                localStorage.setItem(storageKey, JSON.stringify(cloudSettings));
            } else {
                // Fall back to localStorage
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setSettings({
                        defaultActivityLength: parsed.defaultActivityLength || parsed.defaultSessionLength || 30,
                        defaultBreakLength: parsed.defaultBreakLength ?? 5,
                        standingItems: parsed.standingItems || [],
                    });
                } else {
                    setSettings(defaultSettings);
                }
            }
        }).finally(() => {
            setIsLoadingSettings(false);
            isInitialLoad.current = false;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    // Persist when settings change: localStorage immediately, Firestore debounced
    useEffect(() => {
        if (isInitialLoad.current) return;
        if (!storageKey || !user) return;

        localStorage.setItem(storageKey, JSON.stringify(settings));

        if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = setTimeout(() => {
            saveUserSettings(user.id, settings);
        }, 1500);

        return () => {
            if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
        };
    }, [settings, storageKey, user]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const addStandingItem = (item: Omit<StandingItem, 'id'>) => {
        const newItem = { ...item, id: crypto.randomUUID() };
        setSettings(prev => ({
            ...prev,
            standingItems: [...prev.standingItems, newItem]
        }));
    };

    const removeStandingItem = (id: string) => {
        setSettings(prev => ({
            ...prev,
            standingItems: prev.standingItems.filter(i => i.id !== id)
        }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, addStandingItem, removeStandingItem, isLoadingSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
