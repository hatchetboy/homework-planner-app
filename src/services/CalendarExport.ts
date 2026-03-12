import { addMinutes, parse } from 'date-fns';
import type { ScheduleItem, TimeBounds } from '../context/SchedulerContext';

export const exportToGoogleCalendar = async (
    accessToken: string,
    items: ScheduleItem[],
    timeBounds: TimeBounds
) => {
    if (!accessToken) throw new Error("No access token available. Please sign in.");
    if (items.length === 0) return;

    const today = new Date();
    const startDateTime = parse(timeBounds.start, 'HH:mm', today);
    let currentStartTime = startDateTime;

    for (const item of items) {
        // We export study items and standing items, but usually skip 'breaks' as formal calendar events
        if (item.type !== 'break') {
            const eventStart = currentStartTime.toISOString();
            const eventEnd = addMinutes(currentStartTime, item.durationMinutes).toISOString();

            const eventBody = {
                summary: `${item.title} (Homework Planner)`,
                description: `Scheduled via Homework Planner Web App. Duration: ${item.durationMinutes} mins.`,
                start: {
                    dateTime: eventStart,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: eventEnd,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                colorId: '9', // Blueberry color in Google Calendar
            };

            try {
                await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventBody),
                });
            } catch (error) {
                console.error("Failed to export event:", item.title, error);
                throw error;
            }
        }

        // Always advance time by duration, even for breaks
        currentStartTime = addMinutes(currentStartTime, item.durationMinutes);
    }
};
