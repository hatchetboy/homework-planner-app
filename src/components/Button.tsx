import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'outline';
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    icon,
    className = '',
    ...props
}) => {
    return (
        <button className={`btn btn-${variant} ${className}`} {...props}>
            {icon && <span className="flex-center">{icon}</span>}
            {children}
        </button>
    );
};
