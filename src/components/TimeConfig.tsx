import React from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { useScheduler } from '../context/SchedulerContext';
import { Clock } from 'lucide-react';

export const TimeConfig: React.FC = () => {
    const { timeBounds, setTimeBounds } = useScheduler();

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTimeBounds({ ...timeBounds, start: e.target.value });
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTimeBounds({ ...timeBounds, end: e.target.value });
    };

    return (
        <Card isGlass className="mb-6">
            <div className="flex-center gap-2 mb-4" style={{ justifyContent: 'flex-start' }}>
                <Clock color="var(--primary)" size={24} />
                <h3 style={{ margin: 0 }}>Available Time</h3>
            </div>

            <div className="flex-between gap-4">
                <div style={{ flex: 1 }}>
                    <Input
                        label="Start Time"
                        type="time"
                        value={timeBounds.start}
                        onChange={handleStartChange}
                        required
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <Input
                        label="End Time"
                        type="time"
                        value={timeBounds.end}
                        onChange={handleEndChange}
                        required
                    />
                </div>
            </div>
        </Card>
    );
};
