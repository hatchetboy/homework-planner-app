import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { Settings as SettingsIcon, Trash2, Plus, Clock } from 'lucide-react';

export const SettingsModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, updateSettings, addStandingItem, removeStandingItem } = useSettings();

    // Local state for editing before saving
    const [activityLen, setActivityLen] = useState(settings.defaultActivityLength.toString());
    const [breakLen, setBreakLen] = useState(settings.defaultBreakLength.toString());

    // For new standing item
    const [standingName, setStandingName] = useState('');
    const [standingDuration, setStandingDuration] = useState('20');
    const [standingTime, setStandingTime] = useState('');

    const handleOpen = () => {
        setActivityLen(settings.defaultActivityLength.toString());
        setBreakLen(settings.defaultBreakLength.toString());
        setIsOpen(true);
    };

    const handleSave = () => {
        updateSettings({
            defaultActivityLength: Number(activityLen) || 30,
            defaultBreakLength: Number(breakLen) || 5,
        });
        setIsOpen(false);
    };

    const handleAddStanding = () => {
        if (!standingName.trim()) return;
        addStandingItem({
            name: standingName.trim(),
            durationMinutes: Number(standingDuration) || 20,
            startTime: standingTime || undefined
        });
        setStandingName('');
        setStandingTime('');
    };

    return (
        <>
            <Button variant="outline" onClick={handleOpen} className="btn-icon" title="Settings">
                <SettingsIcon size={20} />
            </Button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Planner Settings">
                <div className="flex-column gap-6">
                    <section>
                        <h4 className="mb-3 flex-center gap-2" style={{ justifyContent: 'flex-start', color: 'var(--primary)' }}>
                            <SettingsIcon size={18} /> General Settings
                        </h4>
                        <div className="flex-column gap-4">
                            <Input
                                label="Default Activity Length (minutes)"
                                type="number"
                                min="5"
                                max="120"
                                value={activityLen}
                                onChange={(e) => setActivityLen(e.target.value)}
                            />
                            <Input
                                label="Default Break Length (minutes)"
                                type="number"
                                min="0"
                                max="60"
                                value={breakLen}
                                onChange={(e) => setBreakLen(e.target.value)}
                            />
                        </div>
                    </section>

                    <section style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                        <h4 className="mb-3 flex-center gap-2" style={{ justifyContent: 'flex-start', color: 'var(--accent)' }}>
                            <Clock size={18} /> Standing Tasks (Daily)
                        </h4>

                        <div className="flex-column gap-3 mb-4">
                            {settings.standingItems.map(item => (
                                <div key={item.id} className="flex-between glass-panel" style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                                    <div className="flex-column">
                                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {item.durationMinutes}m {item.startTime ? `@${item.startTime}` : '(any time)'}
                                        </span>
                                    </div>
                                    <button onClick={() => removeStandingItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.3)' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem' }}>Add New Standing Task</p>
                            <div className="flex-column gap-3">
                                <Input
                                    label="Task Name"
                                    placeholder="e.g. Piano Practice"
                                    value={standingName}
                                    onChange={e => setStandingName(e.target.value)}
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
                                <Button variant="secondary" onClick={handleAddStanding} style={{ width: '100%' }}>
                                    <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Standing Task
                                </Button>
                            </div>
                        </div>
                    </section>

                    <div className="flex-between mt-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>Save Settings</Button>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '0.5rem' }}>
                        v{__APP_VERSION__}
                    </p>
                </div>
            </Modal>
        </>
    );
};
