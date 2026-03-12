import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { useScheduler } from '../context/SchedulerContext';
import type { ScheduleItem } from '../context/SchedulerContext';
import { useAuth } from '../context/AuthContext';
import { ListTodo, Trash2, CalendarCheck, Loader2, AlertTriangle } from 'lucide-react';
import { addMinutes, parse, format } from 'date-fns';
import { exportToGoogleCalendar } from '../services/CalendarExport';

export const ScheduleList: React.FC = () => {
    const { items, warnings, timeBounds, clearItems, removeItem } = useScheduler();

    const { accessToken } = useAuth();
    const [isExporting, setIsExporting] = React.useState(false);

    if (items.length === 0) return null;

    // Calculate times for each block based on the start time
    const startDateTime = parse(timeBounds.start, 'HH:mm', new Date());

    let currentStartTime = startDateTime;

    const scheduleWithTimes: (ScheduleItem & { startTimeFormatted: string; endTimeFormatted: string; isGap?: boolean })[] = [];

    items.forEach(item => {
        // If the item has a fixedStartTime, check if we need to jump forward
        if (item.fixedStartTime) {
            const fixedTime = parse(item.fixedStartTime, 'HH:mm', new Date());

            // Only jump forward if the fixed time is strictly in the future relative to our current rolling flow
            if (fixedTime > currentStartTime) {
                const gapDurationMinutes = (fixedTime.getTime() - currentStartTime.getTime()) / 60000;

                // Add a "Free Time" gap block visually
                scheduleWithTimes.push({
                    id: `gap-${item.id}`,
                    title: 'Free Time (Gap)',
                    durationMinutes: gapDurationMinutes,
                    type: 'break',
                    colorClass: 'bg-white border-dashed border-2 border-gray-200 text-gray-500',
                    isGap: true,
                    startTimeFormatted: format(currentStartTime, 'h:mm a'),
                    endTimeFormatted: format(fixedTime, 'h:mm a')
                });

                // Fast forward the clock
                currentStartTime = fixedTime;
            }
        }

        const startTimeFormatted = format(currentStartTime, 'h:mm a');
        const endDateTime = addMinutes(currentStartTime, item.durationMinutes);
        const endTimeFormatted = format(endDateTime, 'h:mm a');

        currentStartTime = endDateTime; // advance for next item

        scheduleWithTimes.push({
            ...item,
            startTimeFormatted,
            endTimeFormatted
        });
    });

    const handleExport = async () => {
        if (!accessToken) {
            alert("Whoa there! You need to sign in to Google before you can export. Computers can't read minds — yet.");
            return;
        }
        setIsExporting(true);
        try {
            await exportToGoogleCalendar(accessToken, items, timeBounds);
            alert("Boom! Your schedule is now in Google Calendar. No excuses for forgetting anything!");
        } catch (e) {
            alert("Well, that didn't work. Turns out Google Calendar needs a real Client ID to function — shocking, we know. Ask a grown-up to set it up properly.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card className="mt-8">
            <div className="flex-between mb-6">
                <div className="flex-center gap-2">
                    <ListTodo color="var(--primary)" size={24} />
                    <h2 style={{ margin: 0 }}>Your Plan Today</h2>
                </div>
                <div className="flex-center gap-2">
                    {items.some(i => i.type !== 'break') && (
                        <Button
                            variant="secondary"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="btn-icon"
                            title="Export to Google Calendar"
                        >
                            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <CalendarCheck size={18} />}
                        </Button>
                    )}
                    <Button variant="outline" onClick={clearItems} className="btn-icon" title="Clear Schedule">
                        <Trash2 size={18} color="var(--danger)" />
                    </Button>
                </div>
            </div>

            {warnings.length > 0 && (
                <div className="flex-column gap-2 mb-4" style={{ background: 'var(--warning-bg, #fffbeb)', border: '1px solid var(--warning-border, #f59e0b)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                    {warnings.map((warning, i) => (
                        <div key={i} className="flex-center gap-2" style={{ fontSize: '0.875rem', color: 'var(--warning-text, #92400e)' }}>
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>{warning}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex-column gap-3">
                {scheduleWithTimes.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex-between ${item.type === 'break' ? 'glass-panel' : 'card'}`}
                        style={{
                            padding: '1rem',
                            borderLeft: item.type !== 'break' ? `6px solid ${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()}` : 'none',
                            animationDelay: `${index * 0.1}s`,
                            borderLeftColor: item.type !== 'break' && item.colorClass ? 'transparent' : undefined // We'll use the colorClass as background instead if available
                        }}
                    >
                        <div className={`flex-column ${item.colorClass && item.type !== 'break' ? item.colorClass : ''}`} style={item.colorClass && item.type !== 'break' ? { padding: '0.2rem 0.6rem', borderRadius: '4px' } : {}}>
                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{item.title}</span>
                            <span style={{ fontSize: '0.85rem', color: item.type === 'break' ? 'var(--text-secondary)' : 'inherit', opacity: 0.9 }}>
                                {item.durationMinutes} minutes
                            </span>
                        </div>

                        <div className="flex-center gap-4">
                            <div className="flex-column" style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <span>{item.startTimeFormatted}</span>
                                <span>to {item.endTimeFormatted}</span>
                            </div>
                            <button
                                onClick={() => removeItem(item.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
                                title="Remove Item"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Finish Time: <strong>{format(currentStartTime, 'h:mm a')}</strong>
                </p>
            </div>
        </Card>
    );
};
