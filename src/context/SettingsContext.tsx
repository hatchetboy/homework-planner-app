import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

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

    // Initial load when user changes
    useEffect(() => {
        if (!storageKey) {
            setSettings(defaultSettings);
            return;
        }

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
    }, [storageKey]);

    // Save when settings change
    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(settings));
        }
    }, [settings, storageKey]);

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
        <SettingsContext.Provider value={{ settings, updateSettings, addStandingItem, removeStandingItem }}>
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
