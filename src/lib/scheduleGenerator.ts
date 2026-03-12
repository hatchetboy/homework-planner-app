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
                    // Conflict: find the FIRST flexible task that causes the overflow by
                    // simulating forward from the start. Moving it preserves the relative
                    // order of remaining tasks, so the task placed closest to the fixed
                    // task by the AI ends up closest to it in the final schedule.
                    let moveIndex = -1;
                    let simTime = startDateTime;
                    for (let j = 0; j < i; j++) {
                        const task = result[j];
                        if (task.fixedStartTime) {
                            const tf = parse(task.fixedStartTime, TIME_FORMAT, new Date());
                            if (tf > simTime) simTime = tf;
                        }
                        const taskEnd = addMinutes(simTime, task.duration);
                        const nextTask = j < result.length - 1 ? result[j + 1] : null;
                        const withBreak = (nextTask && breakDuration > 0 && !task.isBreak && !nextTask.isBreak)
                            ? addMinutes(taskEnd, breakDuration)
                            : taskEnd;
                        if (!task.fixedStartTime && withBreak > fixedTime) {
                            moveIndex = j;
                            break;
                        }
                        simTime = withBreak;
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
