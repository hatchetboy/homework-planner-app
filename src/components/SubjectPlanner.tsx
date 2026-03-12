import React, { useState } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { useScheduler } from '../context/SchedulerContext';
import { useSettings } from '../context/SettingsContext';
import { BookOpen, Plus } from 'lucide-react';

const SUBJECT_COLORS = [
    { label: 'Math', class: 'subject-math' },
    { label: 'Science', class: 'subject-science' },
    { label: 'English', class: 'subject-english' },
    { label: 'History', class: 'subject-history' },
    { label: 'Music', class: 'subject-music' },
    { label: 'PE', class: 'subject-pe' },
    { label: 'Other', class: 'subject-other' },
];

export const SubjectPlanner: React.FC = () => {
    const { generateSchedule } = useScheduler();
    const { settings } = useSettings();

    const [subjects, setSubjects] = useState<{ name: string, duration: number, colorClass: string }[]>([]);
    const [newSubject, setNewSubject] = useState('');
    const [newDuration, setNewDuration] = useState(settings.defaultActivityLength.toString());

    const handleAddSubject = () => {
        if (!newSubject.trim()) return;

        // Pick a pseudo-random color based on name length so it's consistent-ish
        const colorIndex = newSubject.length % SUBJECT_COLORS.length;

        setSubjects([...subjects, {
            name: newSubject.trim(),
            duration: Number(newDuration) || settings.defaultActivityLength,
            colorClass: SUBJECT_COLORS[colorIndex].class
        }]);

        setNewSubject('');
        setNewDuration(settings.defaultActivityLength.toString());
    };

    const handleGenerate = () => {
        generateSchedule(subjects, settings.defaultBreakLength, settings.standingItems);
    };

    const handleRemove = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    return (
        <Card isGlass className="mb-6">
            <div className="flex-center gap-2 mb-4" style={{ justifyContent: 'flex-start' }}>
                <BookOpen color="var(--accent)" size={24} />
                <h3 style={{ margin: 0 }}>What do you need to do?</h3>
            </div>

            <div className="flex-between gap-4 mb-4" style={{ alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                    <Input
                        label="Subject / Task"
                        placeholder="e.g. Math Worksheet"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <Input
                        label="Mins"
                        type="number"
                        min="5"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                    />
                </div>
                <Button onClick={handleAddSubject} className="btn-icon mb-4"><Plus size={20} /></Button>
            </div>

            {subjects.length > 0 && (
                <div className="mb-4">
                    <p className="input-label mb-2">Planned Items:</p>
                    <div className="flex-column gap-2">
                        {subjects.map((sub, idx) => (
                            <div key={idx} className="flex-between glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                                <div className="flex-center gap-2">
                                    <div className={sub.colorClass} style={{ width: 12, height: 12, borderRadius: '50%' }}></div>
                                    <span style={{ fontWeight: 500 }}>{sub.name}</span>
                                </div>
                                <div className="flex-center gap-4">
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{sub.duration} min</span>
                                    <button
                                        onClick={() => handleRemove(idx)}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                    >×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subjects.length > 0 && (
                <Button variant="accent" onClick={handleGenerate} className="mt-4 animate-pulse" style={{ width: '100%' }}>
                    Generate Schedule!
                </Button>
            )}
        </Card>
    );
};
