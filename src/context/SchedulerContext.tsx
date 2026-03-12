import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateScheduleItems } from '../lib/scheduleGenerator';
import type { SubjectInput, StandingItemInput } from '../lib/scheduleGenerator';

interface GenerationInputs {
    subjects: SubjectInput[];
    breakDuration: number;
    standingItems: StandingItemInput[];
}

export type ScheduleItemType = 'study' | 'break' | 'standing';

export interface ScheduleItem {
    id: string;
    title: string;
    durationMinutes: number;
    type: ScheduleItemType;
    colorClass?: string;
    isComplete?: boolean;
    fixedStartTime?: string;
}

export interface TimeBounds {
    start: string; // HH:mm format
    end: string;   // HH:mm format
}

interface SchedulerContextType {
    timeBounds: TimeBounds;
    setTimeBounds: (bounds: TimeBounds) => void;
    items: ScheduleItem[];
    warnings: string[];
    addItem: (item: Omit<ScheduleItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<ScheduleItem>) => void;
    reorderItems: (startIndex: number, endIndex: number) => void;
    clearItems: () => void;
    generateSchedule: (subjects: SubjectInput[], breakDuration: number, standingItems?: StandingItemInput[]) => void;
}

const defaultTimeBounds: TimeBounds = {
    start: '16:00', // 4:00 PM usually after school
    end: '18:00',   // 6:00 PM usually before dinner
};

const SchedulerContext = createContext<SchedulerContextType | undefined>(undefined);

export const SchedulerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [timeBounds, setTimeBounds] = useState<TimeBounds>(defaultTimeBounds);
    const [items, setItems] = useState<ScheduleItem[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const lastInputs = useRef<GenerationInputs | null>(null);

    // Re-run the schedule when start time changes, so fixed tasks are re-ordered correctly
    useEffect(() => {
        if (!lastInputs.current || items.length === 0) return;
        const { subjects, breakDuration, standingItems } = lastInputs.current;
        const result = generateScheduleItems(subjects, breakDuration, timeBounds.start, standingItems);
        setItems(result.items);
        setWarnings(result.warnings);
    }, [timeBounds.start]); // eslint-disable-line react-hooks/exhaustive-deps

    const addItem = (item: Omit<ScheduleItem, 'id'>) => {
        setItems(prev => [...prev, { ...item, id: uuidv4() }]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateItem = (id: string, updates: Partial<ScheduleItem>) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const reorderItems = (startIndex: number, endIndex: number) => {
        setItems(prev => {
            const result = Array.from(prev);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return result;
        });
    };

    const clearItems = () => {
        setItems([]);
        setWarnings([]);
        lastInputs.current = null;
    };

    const generateSchedule = (
        subjects: SubjectInput[],
        breakDuration: number,
        standingItems: StandingItemInput[] = []
    ) => {
        lastInputs.current = { subjects, breakDuration, standingItems };
        const result = generateScheduleItems(subjects, breakDuration, timeBounds.start, standingItems);
        setItems(result.items);
        setWarnings(result.warnings);
    };

    return (
        <SchedulerContext.Provider value={{
            timeBounds, setTimeBounds,
            items, warnings, addItem, removeItem, updateItem, reorderItems, clearItems, generateSchedule
        }}>
            {children}
        </SchedulerContext.Provider>
    );
};

export const useScheduler = () => {
    const context = useContext(SchedulerContext);
    if (context === undefined) {
        throw new Error('useScheduler must be used within a SchedulerProvider');
    }
    return context;
};
