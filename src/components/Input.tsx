import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, id, className = '', ...props }, ref) => {
        const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="input-group">
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
                <input
                    ref={ref}
                    id={inputId}
                    className={`input-field ${className}`}
                    {...props}
                />
            </div>
        );
    }
);
