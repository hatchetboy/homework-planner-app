import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { parse, addMinutes } from 'date-fns';

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
    addItem: (item: Omit<ScheduleItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, updates: Partial<ScheduleItem>) => void;
    reorderItems: (startIndex: number, endIndex: number) => void;
    clearItems: () => void;
    generateSchedule: (subjects: { name: string, duration: number, colorClass: string, isStanding?: boolean, isBreak?: boolean, fixedStartTime?: string }[], breakDuration: number, standingItems?: { name: string, durationMinutes: number }[]) => void;
}

const defaultTimeBounds: TimeBounds = {
    start: '16:00', // 4:00 PM usually after school
    end: '18:00',   // 6:00 PM usually before dinner
};

const SchedulerContext = createContext<SchedulerContextType | undefined>(undefined);

export const SchedulerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [timeBounds, setTimeBounds] = useState<TimeBounds>(defaultTimeBounds);
    const [items, setItems] = useState<ScheduleItem[]>([]);

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

    const clearItems = () => setItems([]);

    const generateSchedule = (
        subjects: { name: string, duration: number, colorClass: string, isStanding?: boolean, isBreak?: boolean, fixedStartTime?: string }[],
        breakDuration: number,
        standingItems: { name: string, durationMinutes: number }[] = []
    ) => {
        // 0. Initial preparation: Combine standing items if they aren't already represented (fallback)
        let subjectsToProcess = [...subjects];

        // If standingItems are passed separately (from manual UI), we should prepend them
        // But from ChatInterface, standingItems is usually empty because AI includes them in 'subjects'
        if (standingItems.length > 0) {
            const preparedStanding = standingItems.map(item => ({
                name: item.name,
                duration: item.durationMinutes,
                colorClass: 'subject-pe',
                isStanding: true
            }));
            subjectsToProcess = [...preparedStanding, ...subjectsToProcess];
        }

        // 1. REORDERING PASS: Resolve conflicts where flexible tasks push a fixed task past its requested time
        let hasChanges = true;
        let iterations = 0;
        const maxIterations = subjectsToProcess.length * 2; // Prevent infinite loops

        while (hasChanges && iterations < maxIterations) {
            hasChanges = false;
            iterations++;

            const startDateTime = parse(timeBounds.start, 'HH:mm', new Date());
            let currentTrialTime = startDateTime;

            for (let i = 0; i < subjectsToProcess.length; i++) {
                const subject = subjectsToProcess[i];

                if (subject.fixedStartTime) {
                    const fixedTime = parse(subject.fixedStartTime, 'HH:mm', new Date());

                    if (fixedTime < currentTrialTime) {
                        // CONFLICT! This fixed task is "late".
                        // Find the most recent flexible task (no fixedStartTime) BEFORE this one to move after it.
                        let moveIndex = -1;
                        for (let j = i - 1; j >= 0; j--) {
                            if (!subjectsToProcess[j].fixedStartTime) {
                                moveIndex = j;
                                break;
                            }
                        }

                        if (moveIndex !== -1) {
                            const [movedItem] = subjectsToProcess.splice(moveIndex, 1);
                            // Insert it *after* the current fixed task (which is now at i-1)
                            subjectsToProcess.splice(i, 0, movedItem);
                            hasChanges = true;
                            break; // Stop checking this pass and restart
                        }
                    } else if (fixedTime > currentTrialTime) {
                        // Jump forward for calculation
                        currentTrialTime = fixedTime;
                    }
                }

                // Advance the trial clock
                currentTrialTime = addMinutes(currentTrialTime, subject.duration);
                // Add a break for the next item if applicable
                if (i < subjectsToProcess.length - 1 && breakDuration > 0) {
                    const nextS = subjectsToProcess[i + 1];
                    if (!subject.isBreak && !nextS.isBreak) {
                        currentTrialTime = addMinutes(currentTrialTime, breakDuration);
                    }
                }
            }
        }

        const newItems: ScheduleItem[] = [];

        // 2. Build the final items list from the (potentially reordered) subjectsToProcess
        subjectsToProcess.forEach((subject, index) => {
            let type: ScheduleItemType = 'study';
            if (subject.isStanding) type = 'standing';
            if (subject.isBreak) type = 'break';

            const defaultColor = type === 'break' ? 'bg-gray-200 text-gray-700' : (type === 'standing' ? 'subject-pe' : subject.colorClass);

            newItems.push({
                id: uuidv4(),
                title: subject.name,
                durationMinutes: subject.duration,
                type: type,
                colorClass: subject.colorClass || defaultColor,
                fixedStartTime: subject.fixedStartTime
            });

            // Add a break after each subject except the last one
            if (index < subjectsToProcess.length - 1 && breakDuration > 0) {
                const nextSubject = subjectsToProcess[index + 1];
                if (!subject.isBreak && !nextSubject.isBreak) {
                    newItems.push({
                        id: uuidv4(),
                        title: 'Break',
                        durationMinutes: breakDuration,
                        type: 'break',
                        colorClass: 'bg-gray-200 text-gray-700'
                    });
                }
            }
        });

        setItems(newItems);
    };

    return (
        <SchedulerContext.Provider value={{
            timeBounds, setTimeBounds,
            items, addItem, removeItem, updateItem, reorderItems, clearItems, generateSchedule
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
