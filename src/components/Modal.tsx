import React from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="flex-center"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100dvh', // Use dvh for mobile respect
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 50,
                overflowY: 'auto', // Allow scrolling on the backdrop if needed
                padding: '2rem 0', // Space for pop effect
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="animate-pop"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    margin: 'auto', // Center horizontally and vertically within flex
                    maxHeight: 'calc(100vh - 4rem)', // Leave some padding
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Card style={{
                    overflowY: 'auto', // Enable scrolling within the card
                    maxHeight: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div className="flex-between mb-4" style={{ flexShrink: 0 }}>
                        <h2 style={{ margin: 0, color: 'var(--primary)' }}>{title}</h2>
                        <Button variant="outline" onClick={onClose} className="btn-icon" style={{ border: 'none', padding: '0.5rem' }}>
                            <X size={20} />
                        </Button>
                    </div>
                    <div style={{ overflowY: 'auto' }}>
                        {children}
                    </div>
                </Card>
            </div>
        </div>
    );
};
