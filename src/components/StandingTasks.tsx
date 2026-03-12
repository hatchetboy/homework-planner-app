import React, { useState } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { useSettings } from '../context/SettingsContext';
import { Clock, Plus, Trash2 } from 'lucide-react';

export const StandingTasks: React.FC = () => {
    const { settings, addStandingItem, removeStandingItem } = useSettings();

    const [standingName, setStandingName] = useState('');
    const [standingDuration, setStandingDuration] = useState('20');
    const [standingTime, setStandingTime] = useState('');

    const handleAdd = () => {
        if (!standingName.trim()) return;
        addStandingItem({
            name: standingName.trim(),
            durationMinutes: Number(standingDuration) || 20,
            startTime: standingTime || undefined,
        });
        setStandingName('');
        setStandingTime('');
    };

    return (
        <Card isGlass className="mb-6">
            <div className="flex-center gap-2 mb-4" style={{ justifyContent: 'flex-start' }}>
                <Clock color="var(--accent)" size={24} />
                <h3 style={{ margin: 0 }}>Standing Tasks</h3>
            </div>

            {settings.standingItems.length > 0 && (
                <div className="flex-column gap-2 mb-4">
                    {settings.standingItems.map(item => (
                        <div key={item.id} className="flex-between glass-panel" style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                            <div className="flex-column">
                                <span style={{ fontWeight: 600 }}>{item.name}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {item.durationMinutes}m {item.startTime ? `@ ${item.startTime}` : '(any time)'}
                                </span>
                            </div>
                            <button onClick={() => removeStandingItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex-column gap-3">
                <Input
                    label="Task Name"
                    placeholder="e.g. Piano Practice"
                    value={standingName}
                    onChange={e => setStandingName(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAdd()}
                />
                <div className="flex-between gap-3">
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Mins"
                            type="number"
                            value={standingDuration}
                            onChange={e => setStandingDuration(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Time (Optional)"
                            type="time"
                            value={standingTime}
                            onChange={e => setStandingTime(e.target.value)}
                        />
                    </div>
                </div>
                <Button variant="secondary" onClick={handleAdd} style={{ width: '100%' }}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Standing Task
                </Button>
            </div>
        </Card>
    );
};
