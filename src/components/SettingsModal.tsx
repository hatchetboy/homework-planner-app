import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { Settings as SettingsIcon } from 'lucide-react';

export const SettingsModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, updateSettings } = useSettings();

    // Local state for editing before saving
    const [activityLen, setActivityLen] = useState(settings.defaultActivityLength.toString());
    const [breakLen, setBreakLen] = useState(settings.defaultBreakLength.toString());

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
