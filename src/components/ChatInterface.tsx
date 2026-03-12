import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useScheduler } from '../context/SchedulerContext';
import { useSettings } from '../context/SettingsContext';
import { parsePromptWithAI } from '../services/LLMService';

export const ChatInterface: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { setTimeBounds, generateSchedule } = useScheduler();
    const { settings } = useSettings();

    const handlePromptSubmit = async () => {
        if (!prompt.trim()) return;

        setIsProcessing(true);

        try {
            const aiResult = await parsePromptWithAI(prompt, settings.standingItems);

            if (aiResult) {
                if (aiResult.timeBounds) {
                    setTimeBounds(aiResult.timeBounds);
                }
                generateSchedule(aiResult.subjects, settings.defaultBreakLength, []); // AI handles standing items
                setPrompt('');
            } else {
                // FALLBACK: Simple mock parser if AI fails or key is missing
                const lowerPrompt = prompt.toLowerCase();
                const parsedSubjects: { name: string, duration: number, colorClass: string }[] = [];

                if (lowerPrompt.includes('math') || lowerPrompt.includes('maths')) {
                    parsedSubjects.push({ name: 'Math Worksheet', duration: 30, colorClass: 'subject-math' });
                }
                if (lowerPrompt.includes('reading') || lowerPrompt.includes('read')) {
                    parsedSubjects.push({ name: 'English Reading', duration: 20, colorClass: 'subject-english' });
                }
                if (lowerPrompt.includes('piano') || lowerPrompt.includes('music')) {
                    parsedSubjects.push({ name: 'Piano Practice', duration: 15, colorClass: 'subject-music' });
                }

                if (parsedSubjects.length === 0) {
                    parsedSubjects.push({ name: 'General Study', duration: 45, colorClass: 'subject-other' });
                }

                generateSchedule(parsedSubjects, settings.defaultBreakLength, settings.standingItems);
                setPrompt('');
            }
        } catch (error) {
            console.error("Chat Interface Error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card isGlass className="mb-6" style={{ borderColor: 'var(--accent)' }}>
            <div className="flex-center gap-2 mb-4" style={{ justifyContent: 'flex-start' }}>
                <Sparkles color="var(--accent)" size={24} />
                <h3 style={{ margin: 0, color: 'var(--accent)' }}>Magic Planner</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Just type what you need to do, and I'll create a plan!
                <br /><em>e.g. "I have 30 mins of math, 20 mins reading, and need to practice piano starting at 4pm"</em>
            </p>

            <div className="flex-center gap-3">
                <div style={{ flex: 1 }}>
                    <Input
                        label=""
                        placeholder="What's your homework tonight?"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
                        style={{ marginBottom: 0 }}
                        disabled={isProcessing}
                    />
                </div>
                <Button
                    variant="accent"
                    onClick={handlePromptSubmit}
                    disabled={isProcessing || !prompt.trim()}
                    className="btn-icon"
                >
                    {isProcessing ? '...' : <MessageSquare size={20} />}
                </Button>
            </div>
        </Card>
    );
};
