import { v4 as uuidv4 } from 'uuid';
import { parse, addMinutes } from 'date-fns';
import type { ScheduleItem, ScheduleItemType } from '../context/SchedulerContext';

export interface SubjectInput {
    name: string;
    duration: number;
    colorClass: string;
    isStanding?: boolean;
    isBreak?: boolean;
    fixedStartTime?: string;
}

export interface StandingItemInput {
    name: string;
    durationMinutes: number;
}

const TIME_FORMAT = 'HH:mm';
const BREAK_COLOR = 'bg-gray-200 text-gray-700';
const STANDING_COLOR = 'subject-pe';

/**
 * Reorders subjects so that any task with a fixedStartTime is not pushed
 * past its requested time by preceding flexible tasks.
 *
 * Works by repeatedly scanning the list and moving the most-recent flexible
 * task after a fixed task whenever a conflict is detected. Terminates when
 * no conflicts remain or after a safe maximum number of iterations.
 */
export function resolveFixedTimeConflicts(
    subjects: SubjectInput[],
    scheduleStart: string,
    breakDuration: number
): SubjectInput[] {
    const result = [...subjects];
    const maxIterations = result.length * 2;
    let hasChanges = true;
    let iterations = 0;

    while (hasChanges && iterations < maxIterations) {
        hasChanges = false;
        iterations++;

        const startDateTime = parse(scheduleStart, TIME_FORMAT, new Date());
        let currentTrialTime = startDateTime;

        for (let i = 0; i < result.length; i++) {
            const subject = result[i];

            if (subject.fixedStartTime) {
                const fixedTime = parse(subject.fixedStartTime, TIME_FORMAT, new Date());

                if (fixedTime < currentTrialTime) {
                    // Conflict: find the most recent flexible task before this one and move it after
                    let moveIndex = -1;
                    for (let j = i - 1; j >= 0; j--) {
                        if (!result[j].fixedStartTime) {
                            moveIndex = j;
                            break;
                        }
                    }

                    if (moveIndex !== -1) {
                        const [movedItem] = result.splice(moveIndex, 1);
                        result.splice(i, 0, movedItem);
                        hasChanges = true;
                        break;
                    }
                } else if (fixedTime > currentTrialTime) {
                    currentTrialTime = fixedTime;
                }
            }

            currentTrialTime = addMinutes(currentTrialTime, subject.duration);
            if (i < result.length - 1 && breakDuration > 0) {
                const next = result[i + 1];
                if (!subject.isBreak && !next.isBreak) {
                    currentTrialTime = addMinutes(currentTrialTime, breakDuration);
                }
            }
        }
    }

    return result;
}

/**
 * Converts an ordered list of subjects into ScheduleItems, inserting
 * break items between non-break subjects.
 */
export function buildScheduleItems(
    subjects: SubjectInput[],
    breakDuration: number
): ScheduleItem[] {
    const items: ScheduleItem[] = [];

    subjects.forEach((subject, index) => {
        let type: ScheduleItemType = 'study';
        if (subject.isStanding) type = 'standing';
        if (subject.isBreak) type = 'break';

        const defaultColor = type === 'break' ? BREAK_COLOR : (type === 'standing' ? STANDING_COLOR : subject.colorClass);

        items.push({
            id: uuidv4(),
            title: subject.name,
            durationMinutes: subject.duration,
            type,
            colorClass: subject.colorClass || defaultColor,
            fixedStartTime: subject.fixedStartTime,
        });

        if (index < subjects.length - 1 && breakDuration > 0) {
            const next = subjects[index + 1];
            if (!subject.isBreak && !next.isBreak) {
                items.push({
                    id: uuidv4(),
                    title: 'Break',
                    durationMinutes: breakDuration,
                    type: 'break',
                    colorClass: BREAK_COLOR,
                });
            }
        }
    });

    return items;
}

/**
 * Main entry point. Combines standing items with user-supplied subjects,
 * resolves fixed-time conflicts, then builds the final schedule item list.
 */
export function generateScheduleItems(
    subjects: SubjectInput[],
    breakDuration: number,
    scheduleStart: string,
    standingItems: StandingItemInput[] = []
): ScheduleItem[] {
    let subjectsToProcess = [...subjects];

    if (standingItems.length > 0) {
        const preparedStanding: SubjectInput[] = standingItems.map(item => ({
            name: item.name,
            duration: item.durationMinutes,
            colorClass: STANDING_COLOR,
            isStanding: true,
        }));
        subjectsToProcess = [...preparedStanding, ...subjectsToProcess];
    }

    const ordered = resolveFixedTimeConflicts(subjectsToProcess, scheduleStart, breakDuration);
    return buildScheduleItems(ordered, breakDuration);
}
