import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="input-group">
            <label htmlFor={inputId} className="input-label">
                {label}
            </label>
            <input
                id={inputId}
                className={`input-field ${className}`}
                {...props}
            />
        </div>
    );
};
