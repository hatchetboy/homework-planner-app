import React, { useState, useRef, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useScheduler } from '../context/SchedulerContext';
import { useSettings } from '../context/SettingsContext';
import { parsePromptWithAI } from '../services/LLMService';
import type { GeminiHistoryEntry } from '../services/LLMService';

type DisplayMessage = { role: 'user' | 'assistant'; text: string };

export const ChatInterface: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
    const [geminiHistory, setGeminiHistory] = useState<GeminiHistoryEntry[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { setTimeBounds, generateSchedule, clearItems, items } = useScheduler();
    const { settings } = useSettings();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayMessages]);

    const handlePromptSubmit = async () => {
        if (!prompt.trim()) return;

        const userText = prompt.trim();
        setPrompt('');
        setDisplayMessages(prev => [...prev, { role: 'user', text: userText }]);
        setIsProcessing(true);

        try {
            const currentItemsForAI = items
                .filter(i => !(i.type === 'break' && i.title === 'Break')) // keep named breaks (e.g. Dinner) but drop auto spacers
                .map(i => ({ title: i.title, durationMinutes: i.durationMinutes, fixedStartTime: i.fixedStartTime }));

            const aiResult = await parsePromptWithAI(userText, settings.standingItems, currentItemsForAI, geminiHistory);

            if (aiResult) {
                let assistantText: string;
                const modelResponseText = JSON.stringify(aiResult);

                if (aiResult.action === 'clear') {
                    clearItems();
                    assistantText = "Done! Schedule cleared. What are we doing next?";
                } else if (aiResult.subjects && aiResult.subjects.length > 0) {
                    if (aiResult.timeBounds) setTimeBounds(aiResult.timeBounds);
                    generateSchedule(aiResult.subjects, settings.defaultBreakLength, []); // AI handles standing items
                    const taskCount = aiResult.subjects.filter(s => !s.isBreak && !s.isStanding).length;
                    assistantText = items.length > 0
                        ? `Updated! ${taskCount} task${taskCount !== 1 ? 's' : ''} in your plan.`
                        : `Done! Added ${taskCount} task${taskCount !== 1 ? 's' : ''} to your plan.`;
                } else {
                    assistantText = "Hmm, I couldn't figure that out. Try rephrasing?";
                }

                setGeminiHistory(prev => [
                    ...prev,
                    { role: 'user', parts: [{ text: userText }] },
                    { role: 'model', parts: [{ text: modelResponseText }] },
                ]);
                setDisplayMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);
            } else {
                // FALLBACK: Simple mock parser if AI fails or key is missing
                const lowerPrompt = userText.toLowerCase();
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
                setDisplayMessages(prev => [...prev, { role: 'assistant', text: "Used basic mode — AI isn't available right now." }]);
            }
        } catch (error) {
            console.error("Chat Interface Error:", error);
            setDisplayMessages(prev => [...prev, { role: 'assistant', text: "Oops, something went wrong!" }]);
        } finally {
            setIsProcessing(false);
            inputRef.current?.focus();
        }
    };

    return (
        <Card isGlass className="mb-6" style={{ borderColor: 'var(--accent)' }}>
            <div className="flex-center gap-2 mb-4" style={{ justifyContent: 'flex-start' }}>
                <Sparkles color="var(--accent)" size={24} />
                <h3 style={{ margin: 0, color: 'var(--accent)' }}>Magic Planner</h3>
            </div>

            {displayMessages.length === 0 && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Just type what you need to do, and I'll create a plan!
                    <br /><em>e.g. "I have 30 mins of math, 20 mins reading, and need to practice piano starting at 4pm"</em>
                </p>
            )}

            {displayMessages.length > 0 && (
                <div
                    style={{
                        maxHeight: '220px',
                        overflowY: 'auto',
                        marginBottom: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                    }}
                >
                    {displayMessages.map((msg, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.875rem',
                                    maxWidth: '85%',
                                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface-2, #f3f4f6)',
                                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                    borderBottomRightRadius: msg.role === 'user' ? '0.25rem' : '1rem',
                                    borderBottomLeftRadius: msg.role === 'assistant' ? '0.25rem' : '1rem',
                                }}
                            >
                                {msg.text}
                            </span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}

            <div className="flex-center gap-3">
                <div style={{ flex: 1 }}>
                    <Input
                        ref={inputRef}
                        label=""
                        placeholder={displayMessages.length > 0 ? "Add more, remove something, or say 'clear'…" : "What's your homework tonight?"}
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
