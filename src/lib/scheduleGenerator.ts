import { v4 as uuidv4 } from 'uuid';
import { parse, addMinutes, format } from 'date-fns';
import type { ScheduleItem, ScheduleItemType } from '../context/SchedulerContext';

export interface SubjectInput {
    name: string;
    duration: number;
    colorClass: string;
    isStanding?: boolean;
    isBreak?: boolean;
    fixedStartTime?: string;
    orderPreference?: boolean; // true if the user explicitly requested this task's position
}

export interface StandingItemInput {
    name: string;
    durationMinutes: number;
    startTime?: string; // HH:mm — if set, treated as a fixedStartTime
}

export interface ScheduleResult {
    items: ScheduleItem[];
    warnings: string[];
}

const TIME_FORMAT = 'HH:mm';
const BREAK_COLOR = 'bg-gray-200 text-gray-700';
const STANDING_COLOR = 'subject-pe';

/**
 * Reorders subjects so that any task with a fixedStartTime is not pushed
 * past its requested time by preceding flexible tasks.
 */
export function resolveFixedTimeConflicts(
    subjects: SubjectInput[],
    scheduleStart: string,
    breakDuration: number
): SubjectInput[] {
    const result = [...subjects];
    const maxIterations = result.length * result.length;
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
                    // Conflict: too many tasks before the fixed-time task.
                    // Strategy: try moving the LARGEST flexible task first. This maximises
                    // the chance that smaller "preferred" tasks (placed close to the fixed
                    // task by the AI) can stay in front of it. If the largest alone isn't
                    // enough, the while-loop iterates again to move another.
                    const flexCandidates: number[] = [];
                    for (let j = 0; j < i; j++) {
                        if (!result[j].fixedStartTime) flexCandidates.push(j);
                    }
                    // Sort: infill tasks (no orderPreference) first, then by duration desc.
                    // This ensures user-placed tasks stay put while infill tasks absorb the overflow.
                    flexCandidates.sort((a, b) => {
                        const aPref = result[a].orderPreference ? 1 : 0;
                        const bPref = result[b].orderPreference ? 1 : 0;
                        if (aPref !== bPref) return aPref - bPref;
                        return result[b].duration - result[a].duration;
                    });

                    // Find the first candidate whose removal lets remaining tasks fit
                    let moveIndex = flexCandidates.length > 0 ? flexCandidates[0] : -1;
                    for (const candidateIdx of flexCandidates) {
                        let testTime = startDateTime;
                        for (let j = 0; j < i; j++) {
                            if (j === candidateIdx) continue;
                            const task = result[j];
                            if (task.fixedStartTime) {
                                const tf = parse(task.fixedStartTime, TIME_FORMAT, new Date());
                                if (tf > testTime) testTime = tf;
                            }
                            testTime = addMinutes(testTime, task.duration);
                            // find next non-skipped task for break calculation
                            let nextTask: SubjectInput | null = null;
                            for (let k = j + 1; k <= i; k++) {
                                if (k !== candidateIdx) { nextTask = result[k] ?? null; break; }
                            }
                            if (nextTask && breakDuration > 0 && !task.isBreak && !nextTask.isBreak) {
                                testTime = addMinutes(testTime, breakDuration);
                            }
                        }
                        if (testTime <= fixedTime) {
                            moveIndex = candidateIdx;
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
 * Converts an ordered list of subjects into ScheduleItems, inserting break
 * items between non-break subjects. Tracks actual start times to detect when
 * a fixedStartTime could not be honoured and emits a warning in that case.
 */
export function buildScheduleItems(
    subjects: SubjectInput[],
    breakDuration: number,
    scheduleStart: string
): ScheduleResult {
    const items: ScheduleItem[] = [];
    const warnings: string[] = [];

    let currentTime = parse(scheduleStart, TIME_FORMAT, new Date());

    subjects.forEach((subject, index) => {
        if (subject.fixedStartTime) {
            const requestedTime = parse(subject.fixedStartTime, TIME_FORMAT, new Date());

            if (requestedTime > currentTime) {
                // Jump forward — gap will be rendered by ScheduleList
                currentTime = requestedTime;
            } else if (requestedTime < currentTime) {
                // Can't honour the requested time — warn the user
                const requested = format(requestedTime, 'h:mm a');
                const actual = format(currentTime, 'h:mm a');
                warnings.push(
                    `Uh oh! "${subject.name}" wanted to start at ${requested}, but your jam-packed schedule pushed it to ${actual}. Ever heard of leaving a little breathing room?`
                );
            }
        }

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

        currentTime = addMinutes(currentTime, subject.duration);

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
                currentTime = addMinutes(currentTime, breakDuration);
            }
        }
    });

    return { items, warnings };
}

/**
 * Main entry point. Combines standing items (honouring their startTime if set)
 * with user-supplied subjects, resolves fixed-time conflicts, then builds the
 * final schedule item list with any conflict warnings.
 */
export function generateScheduleItems(
    subjects: SubjectInput[],
    breakDuration: number,
    scheduleStart: string,
    standingItems: StandingItemInput[] = []
): ScheduleResult {
    let subjectsToProcess = [...subjects];

    if (standingItems.length > 0) {
        const preparedStanding: SubjectInput[] = standingItems.map(item => ({
            name: item.name,
            duration: item.durationMinutes,
            colorClass: STANDING_COLOR,
            isStanding: true,
            fixedStartTime: item.startTime, // honour precise standing item times
        }));
        subjectsToProcess = [...preparedStanding, ...subjectsToProcess];
    }

    // Always resolve fixed-time conflicts: fixed start times take priority over
    // ordering preferences. If a flexible task can't fit before a fixed-time task,
    // it gets moved after it and free time fills the gap.
    const ordered = resolveFixedTimeConflicts(subjectsToProcess, scheduleStart, breakDuration);
    return buildScheduleItems(ordered, breakDuration, scheduleStart);
}
